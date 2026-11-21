import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, URL } from 'url';
import { defineConfig, Plugin } from 'vite';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

function cloudflareStaticDistPlugin(): Plugin {
  return {
    name: 'cloudflare-static-dist-clean',
    closeBundle() {
      const distDir = path.resolve(__dirname, 'dist');
      const publicDir = path.resolve(__dirname, 'public');
      if (!fs.existsSync(distDir)) return;

      const cleanWalk = (dir: string) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            cleanWalk(full);
          } else if (
            entry.name.toLowerCase().endsWith('.zip') ||
            entry.name === '.assetsignore' ||
            entry.name === 'image_9a09198a.png' ||
            entry.name === 'image_4cfe9368.png'
          ) {
            try {
              fs.unlinkSync(full);
            } catch {
              // ignore
            }
          } else {
            // Hardlink identical static assets from public/ to avoid duplicating 38MB+ on disk
            const rel = path.relative(distDir, full);
            const pubFile = path.join(publicDir, rel);
            if (fs.existsSync(pubFile)) {
              try {
                const sDist = fs.statSync(full);
                const sPub = fs.statSync(pubFile);
                if (sDist.ino !== sPub.ino && sDist.size === sPub.size) {
                  fs.unlinkSync(full);
                  fs.linkSync(pubFile, full);
                }
              } catch {
                // fallback: leave copied file intact if cross-device link fails
              }
            }
          }
        }
      };

      cleanWalk(distDir);
      fs.writeFileSync(path.join(distDir, '_redirects'), '/* /index.html 200\n', 'utf8');
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), cloudflareStaticDistPlugin()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('.', import.meta.url)),
      },
    },
    server: {
      allowedHosts: true as const,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    preview: {
      allowedHosts: true as const,
    },
    build: {
      reportCompressedSize: false,
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('lucide-react')) return 'vendor-icons';
              return 'vendor';
            }
          },
        },
      },
    },
  };
});
