import React from 'react';
import { resolveClubCrestUrls } from '../utils/clubCrests';

// Pure Nation Flag - NO frame, NO border, NO name
export const NationBadge: React.FC<{ nation: string; flagUrl?: string }> = ({ nation, flagUrl }) => {
  const [imgFailed, setImgFailed] = React.useState(false);

  const getFlagContent = () => {
    const n = nation.toLowerCase();
    if (n.includes('pháp') || n.includes('france')) {
      return (
        <svg viewBox="0 0 90 60" className="w-52 sm:w-72 h-auto drop-shadow-[0_0_40px_rgba(37,99,235,0.9)]">
          <rect width="30" height="60" fill="#002654" />
          <rect x="30" width="30" height="60" fill="#FFFFFF" />
          <rect x="60" width="30" height="60" fill="#CE1126" />
        </svg>
      );
    }
    if (n.includes('anh') || n.includes('england')) {
      return (
        <svg viewBox="0 0 90 60" className="w-52 sm:w-72 h-auto drop-shadow-[0_0_40px_rgba(255,255,255,0.95)]">
          <rect width="90" height="60" fill="#FFFFFF" />
          <rect x="39" width="12" height="60" fill="#CE1124" />
          <rect y="24" width="90" height="12" fill="#CE1124" />
        </svg>
      );
    }
    if (n.includes('na uy') || n.includes('norway')) {
      return (
        <svg viewBox="0 0 90 60" className="w-52 sm:w-72 h-auto drop-shadow-[0_0_40px_rgba(186,12,47,0.9)]">
          <rect width="90" height="60" fill="#BA0C2F" />
          <rect x="25" width="16" height="60" fill="#FFFFFF" />
          <rect y="22" width="90" height="16" fill="#FFFFFF" />
          <rect x="29" width="8" height="60" fill="#00205B" />
          <rect y="26" width="90" height="8" fill="#00205B" />
        </svg>
      );
    }
    if (n.includes('tây ban nha') || n.includes('spain')) {
      return (
        <svg viewBox="0 0 90 60" className="w-52 sm:w-72 h-auto drop-shadow-[0_0_40px_rgba(241,191,0,0.9)]">
          <rect width="90" height="15" fill="#AA151B" />
          <rect y="15" width="90" height="30" fill="#F1BF00" />
          <rect y="45" width="90" height="15" fill="#AA151B" />
          <circle cx="28" cy="30" r="7" fill="#AA151B" />
        </svg>
      );
    }
    if (n.includes('brazil')) {
      return (
        <svg viewBox="0 0 90 60" className="w-52 sm:w-72 h-auto drop-shadow-[0_0_40px_rgba(0,151,57,0.9)]">
          <rect width="90" height="60" fill="#009739" />
          <polygon points="45,8 80,30 45,52 10,30" fill="#FEDD00" />
          <circle cx="45" cy="30" r="14" fill="#012169" />
        </svg>
      );
    }
    if (n.includes('hà lan') || n.includes('netherlands')) {
      return (
        <svg viewBox="0 0 90 60" className="w-52 sm:w-72 h-auto drop-shadow-[0_0_40px_rgba(174,28,40,0.9)]">
          <rect width="90" height="20" fill="#AE1C28" />
          <rect y="20" width="90" height="20" fill="#FFFFFF" />
          <rect y="40" width="90" height="20" fill="#21468B" />
        </svg>
      );
    }
    if (n.includes('argentina')) {
      return (
        <svg viewBox="0 0 90 60" className="w-52 sm:w-72 h-auto drop-shadow-[0_0_40px_rgba(117,170,219,0.9)]">
          <rect width="90" height="20" fill="#75AADB" />
          <rect y="20" width="90" height="20" fill="#FFFFFF" />
          <rect y="40" width="90" height="20" fill="#75AADB" />
          <circle cx="45" cy="30" r="7" fill="#F6B40E" />
        </svg>
      );
    }
    if (n.includes('bồ đào nha') || n.includes('portugal')) {
      return (
        <svg viewBox="0 0 90 60" className="w-52 sm:w-72 h-auto drop-shadow-[0_0_40px_rgba(218,37,29,0.9)]">
          <rect width="36" height="60" fill="#006600" />
          <rect x="36" width="54" height="60" fill="#DA251D" />
          <circle cx="36" cy="30" r="11" fill="#FFFF00" />
          <circle cx="36" cy="30" r="8" fill="#DA251D" />
        </svg>
      );
    }
    if (n.includes('đức') || n.includes('germany')) {
      return (
        <svg viewBox="0 0 90 60" className="w-52 sm:w-72 h-auto drop-shadow-[0_0_40px_rgba(255,206,0,0.9)]">
          <rect width="90" height="20" fill="#000000" />
          <rect y="20" width="90" height="20" fill="#DD0000" />
          <rect y="40" width="90" height="20" fill="#FFCE00" />
        </svg>
      );
    }
    if (n.includes('bỉ') || n.includes('belgium')) {
      return (
        <svg viewBox="0 0 90 60" className="w-52 sm:w-72 h-auto drop-shadow-[0_0_40px_rgba(255,206,0,0.9)]">
          <rect width="30" height="60" fill="#000000" />
          <rect x="30" width="30" height="60" fill="#FFD90C" />
          <rect x="60" width="30" height="60" fill="#EF3340" />
        </svg>
      );
    }
    if (n.includes('hàn quốc') || n.includes('korea')) {
      return (
        <svg viewBox="0 0 90 60" className="w-52 sm:w-72 h-auto drop-shadow-[0_0_40px_rgba(255,255,255,0.9)]">
          <rect width="90" height="60" fill="#FFFFFF" />
          <circle cx="45" cy="30" r="14" fill="#CD2E3A" />
          <path d="M45 44 A14 14 0 0 0 45 16 A7 7 0 0 0 45 30 A7 7 0 0 1 45 44" fill="#0047A0" />
        </svg>
      );
    }
    if (n.includes('ý') || n.includes('italy')) {
      return (
        <svg viewBox="0 0 90 60" className="w-52 sm:w-72 h-auto drop-shadow-[0_0_40px_rgba(0,146,70,0.9)]">
          <rect width="30" height="60" fill="#009246" />
          <rect x="30" width="30" height="60" fill="#FFFFFF" />
          <rect x="60" width="30" height="60" fill="#CE2B37" />
        </svg>
      );
    }
    if (n.includes('uruguay')) {
      return (
        <svg viewBox="0 0 90 60" className="w-52 sm:w-72 h-auto drop-shadow-[0_0_40px_rgba(117,170,219,0.9)]">
          <rect width="90" height="60" fill="#FFFFFF" />
          <rect y="7" width="90" height="7" fill="#0038A8" />
          <rect y="21" width="90" height="7" fill="#0038A8" />
          <rect y="35" width="90" height="7" fill="#0038A8" />
          <rect y="49" width="90" height="7" fill="#0038A8" />
          <rect width="32" height="30" fill="#FFFFFF" />
          <circle cx="16" cy="15" r="7" fill="#FCD116" />
        </svg>
      );
    }
    if (n.includes('colombia')) {
      return (
        <svg viewBox="0 0 90 60" className="w-52 sm:w-72 h-auto drop-shadow-[0_0_40px_rgba(252,209,22,0.9)]">
          <rect width="90" height="30" fill="#FCD116" />
          <rect y="30" width="90" height="15" fill="#003893" />
          <rect y="45" width="90" height="15" fill="#CE1126" />
        </svg>
      );
    }
    if (n.includes('peru') || n.includes('perú')) {
      return (
        <svg viewBox="0 0 90 60" className="w-52 sm:w-72 h-auto drop-shadow-[0_0_40px_rgba(217,16,35,0.9)]">
          <rect width="30" height="60" fill="#D91023" />
          <rect x="30" width="30" height="60" fill="#FFFFFF" />
          <rect x="60" width="30" height="60" fill="#D91023" />
        </svg>
      );
    }
    if (n.includes('thổ nhĩ kỳ') || n.includes('turkey')) {
      return (
        <svg viewBox="0 0 90 60" className="w-52 sm:w-72 h-auto drop-shadow-[0_0_40px_rgba(227,10,23,0.9)]">
          <rect width="90" height="60" fill="#E30A17" />
          <circle cx="36" cy="30" r="14" fill="#FFFFFF" />
          <circle cx="40" cy="30" r="11" fill="#E30A17" />
          <polygon points="50,30 55,33 53,27 57,24 51,24 50,19 49,24 43,24 47,27 45,33" fill="#FFFFFF" />
        </svg>
      );
    }
    if (n.includes('việt nam') || n.includes('vietnam')) {
      return (
        <svg viewBox="0 0 90 60" className="w-52 sm:w-72 h-auto drop-shadow-[0_0_40px_rgba(218,37,29,0.9)]">
          <rect width="90" height="60" fill="#DA251D" />
          <polygon points="45,14 49,26 61,26 51,33 55,45 45,38 35,45 39,33 29,26 41,26" fill="#FFFF00"/>
        </svg>
      );
    }
    if (n.includes('nga') || n.includes('russia')) {
      return (
        <svg viewBox="0 0 90 60" className="w-52 sm:w-72 h-auto drop-shadow-[0_0_40px_rgba(0,57,166,0.9)]">
          <rect width="90" height="20" fill="#FFFFFF" />
          <rect y="20" width="90" height="20" fill="#0039A6" />
          <rect y="40" width="90" height="20" fill="#D52B1E" />
        </svg>
      );
    }
    if (n.includes('ai cập') || n.includes('egypt')) {
      return (
        <svg viewBox="0 0 90 60" className="w-52 sm:w-72 h-auto drop-shadow-[0_0_40px_rgba(206,17,38,0.9)]">
          <rect width="90" height="20" fill="#CE1126" />
          <rect y="20" width="90" height="20" fill="#FFFFFF" />
          <rect y="40" width="90" height="20" fill="#000000" />
          <polygon points="45,26 49,34 41,34" fill="#C09A35" />
        </svg>
      );
    }
    if (n.includes('senegal')) {
      return (
        <svg viewBox="0 0 90 60" className="w-52 sm:w-72 h-auto drop-shadow-[0_0_40px_rgba(0,133,63,0.9)]">
          <rect width="30" height="60" fill="#00853F" />
          <rect x="30" width="30" height="60" fill="#FDEF42" />
          <rect x="60" width="30" height="60" fill="#E31B23" />
          <polygon points="45,21 47,27 53,27 48,31 50,37 45,33 40,37 42,31 37,27 43,27" fill="#00853F" />
        </svg>
      );
    }
    if (n.includes('đan mạch') || n.includes('denmark')) {
      return (
        <svg viewBox="0 0 90 60" className="w-52 sm:w-72 h-auto drop-shadow-[0_0_40px_rgba(200,16,46,0.9)]">
          <rect width="90" height="60" fill="#C8102E" />
          <rect x="27" width="10" height="60" fill="#FFFFFF" />
          <rect y="25" width="90" height="10" fill="#FFFFFF" />
        </svg>
      );
    }
    if (n.includes('séc') || n.includes('czech')) {
      return (
        <svg viewBox="0 0 90 60" className="w-52 sm:w-72 h-auto drop-shadow-[0_0_40px_rgba(17,69,126,0.95)]">
          <rect width="90" height="30" fill="#FFFFFF" />
          <rect y="30" width="90" height="30" fill="#D7141A" />
          <polygon points="0,0 45,30 0,60" fill="#11457E" />
        </svg>
      );
    }
    if (n.includes('croatia')) {
      return (
        <svg viewBox="0 0 90 60" className="w-52 sm:w-72 h-auto drop-shadow-[0_0_40px_rgba(255,0,0,0.9)]">
          <rect width="90" height="20" fill="#FF0000" />
          <rect y="20" width="90" height="20" fill="#FFFFFF" />
          <rect y="40" width="90" height="20" fill="#171796" />
          <rect x="37" y="17" width="16" height="20" rx="2" fill="#FF0000" stroke="#FFFFFF" strokeWidth="2" />
        </svg>
      );
    }
    if (n.includes('thụy sĩ') || n.includes('switzerland')) {
      return (
        <svg viewBox="0 0 90 60" className="w-52 sm:w-72 h-auto drop-shadow-[0_0_40px_rgba(213,43,30,0.9)]">
          <rect width="90" height="60" fill="#D52B1E" />
          <rect x="39" y="12" width="12" height="36" fill="#FFFFFF" />
          <rect x="27" y="24" width="36" height="12" fill="#FFFFFF" />
        </svg>
      );
    }
    if (n.includes('georgia') || n.includes('gruzia')) {
      return (
        <svg viewBox="0 0 90 60" className="w-52 sm:w-72 h-auto drop-shadow-[0_0_40px_rgba(255,255,255,0.9)]">
          <rect width="90" height="60" fill="#FFFFFF" />
          <rect x="39" width="12" height="60" fill="#FF0000" />
          <rect y="24" width="90" height="12" fill="#FF0000" />
        </svg>
      );
    }
    if (n.includes('ma-rốc') || n.includes('ma rốc') || n.includes('morocco')) {
      return (
        <svg viewBox="0 0 90 60" className="w-52 sm:w-72 h-auto drop-shadow-[0_0_40px_rgba(193,39,45,0.95)]">
          <rect width="90" height="60" fill="#C1272D" />
          <polygon
            points="45,15 49.5,28.5 63,28.5 52,36.6 56.1,49.5 45,41.4 33.9,49.5 38,36.6 27,28.5 40.5,28.5"
            fill="none"
            stroke="#006233"
            strokeWidth="4"
          />
        </svg>
      );
    }
    if (n.includes('cameroon')) {
      return (
        <svg viewBox="0 0 90 60" className="w-52 sm:w-72 h-auto drop-shadow-[0_0_40px_rgba(252,209,22,0.95)]">
          <rect width="30" height="60" fill="#007A5E" />
          <rect x="30" width="30" height="60" fill="#CE1126" />
          <rect x="60" width="30" height="60" fill="#FCD116" />
          <polygon points="45,21 47,27 53,27 48,31 50,37 45,33 40,37 42,31 37,27 43,27" fill="#FCD116" />
        </svg>
      );
    }
    if (n.includes('nigeria')) {
      return (
        <svg viewBox="0 0 90 60" className="w-52 sm:w-72 h-auto drop-shadow-[0_0_40px_rgba(0,135,81,0.95)]">
          <rect width="30" height="60" fill="#008751" />
          <rect x="30" width="30" height="60" fill="#FFFFFF" />
          <rect x="60" width="30" height="60" fill="#008751" />
        </svg>
      );
    }
    if (n === 'nga' || n.includes('russia')) {
      return (
        <svg viewBox="0 0 90 60" className="w-52 sm:w-72 h-auto drop-shadow-[0_0_40px_rgba(255,255,255,0.95)]">
          <rect width="90" height="20" fill="#FFFFFF" />
          <rect y="20" width="90" height="20" fill="#0039A6" />
          <rect y="40" width="90" height="20" fill="#D52B1E" />
        </svg>
      );
    }
    if (n.includes('nhật') || n.includes('japan')) {
      return (
        <svg viewBox="0 0 90 60" className="w-52 sm:w-72 h-auto drop-shadow-[0_0_40px_rgba(255,255,255,0.95)]">
          <rect width="90" height="60" fill="#FFFFFF" />
          <circle cx="45" cy="30" r="16" fill="#BC002D" />
        </svg>
      );
    }
    if (n === 'úc' || n.includes('australia')) {
      return (
        <svg viewBox="0 0 90 60" className="w-52 sm:w-72 h-auto drop-shadow-[0_0_40px_rgba(37,99,235,0.95)]">
          <rect width="90" height="60" fill="#00008B" />
          <rect width="42" height="30" fill="#012169" />
          <path d="M0,0 L42,30 M42,0 L0,30" stroke="#FFFFFF" strokeWidth="5" />
          <rect x="17" width="8" height="30" fill="#FFFFFF" />
          <rect y="11" width="42" height="8" fill="#FFFFFF" />
          <rect x="19" width="4" height="30" fill="#C8102E" />
          <rect y="13" width="42" height="4" fill="#C8102E" />
          <circle cx="21" cy="45" r="5" fill="#FFFFFF" />
          <circle cx="68" cy="18" r="3" fill="#FFFFFF" />
          <circle cx="76" cy="30" r="3" fill="#FFFFFF" />
          <circle cx="68" cy="44" r="3" fill="#FFFFFF" />
          <circle cx="58" cy="31" r="3" fill="#FFFFFF" />
        </svg>
      );
    }
    if (n === 'mỹ' || n.includes('hoa kỳ') || n.includes('usa') || n.includes('united states')) {
      return (
        <svg viewBox="0 0 90 60" className="w-52 sm:w-72 h-auto drop-shadow-[0_0_40px_rgba(178,34,52,0.95)]">
          <rect width="90" height="60" fill="#FFFFFF" />
          <rect y="0" width="90" height="8.5" fill="#B22234" />
          <rect y="17" width="90" height="8.5" fill="#B22234" />
          <rect y="34" width="90" height="8.5" fill="#B22234" />
          <rect y="51" width="90" height="9" fill="#B22234" />
          <rect width="38" height="33" fill="#3C3B6E" />
          <circle cx="11" cy="10" r="2.5" fill="#FFFFFF" />
          <circle cx="26" cy="10" r="2.5" fill="#FFFFFF" />
          <circle cx="18.5" cy="17" r="2.5" fill="#FFFFFF" />
          <circle cx="11" cy="24" r="2.5" fill="#FFFFFF" />
          <circle cx="26" cy="24" r="2.5" fill="#FFFFFF" />
        </svg>
      );
    }
    if (n.includes('ukraine')) {
      return (
        <svg viewBox="0 0 90 60" className="w-52 sm:w-72 h-auto drop-shadow-[0_0_40px_rgba(255,215,0,0.95)]">
          <rect width="90" height="30" fill="#0057B7" />
          <rect y="30" width="90" height="30" fill="#FFD700" />
        </svg>
      );
    }
    if (n.includes('hungary')) {
      return (
        <svg viewBox="0 0 90 60" className="w-52 sm:w-72 h-auto drop-shadow-[0_0_40px_rgba(206,41,57,0.95)]">
          <rect width="90" height="20" fill="#CE2939" />
          <rect y="20" width="90" height="20" fill="#FFFFFF" />
          <rect y="40" width="90" height="20" fill="#477050" />
        </svg>
      );
    }
    if (n.includes('mexico')) {
      return (
        <svg viewBox="0 0 90 60" className="w-52 sm:w-72 h-auto drop-shadow-[0_0_40px_rgba(0,104,71,0.95)]">
          <rect width="30" height="60" fill="#006847" />
          <rect x="30" width="30" height="60" fill="#FFFFFF" />
          <rect x="60" width="30" height="60" fill="#CE1126" />
          <circle cx="45" cy="30" r="6" fill="#8B5A2B" />
        </svg>
      );
    }
    if (n.includes('ả rập') || n.includes('saudi')) {
      return (
        <svg viewBox="0 0 90 60" className="w-52 sm:w-72 h-auto drop-shadow-[0_0_40px_rgba(0,108,53,0.95)]">
          <rect width="90" height="60" fill="#006C35" />
          <rect x="22" y="21" width="46" height="6" rx="3" fill="#FFFFFF" />
          <rect x="28" y="38" width="34" height="3.5" rx="1.75" fill="#FFFFFF" />
          <circle cx="62" cy="39.75" r="2.6" fill="#FFFFFF" />
        </svg>
      );
    }
    if (n.includes('bờ biển ngà') || n.includes('ivory') || n.includes('côte')) {
      return (
        <svg viewBox="0 0 90 60" className="w-52 sm:w-72 h-auto drop-shadow-[0_0_40px_rgba(247,127,0,0.95)]">
          <rect width="30" height="60" fill="#F77F00" />
          <rect x="30" width="30" height="60" fill="#FFFFFF" />
          <rect x="60" width="30" height="60" fill="#009E60" />
        </svg>
      );
    }
    // Fallback World Flag
    return (
      <svg viewBox="0 0 90 60" className="w-52 sm:w-72 h-auto drop-shadow-[0_0_40px_rgba(234,179,8,0.9)]">
        <rect width="90" height="60" fill="#1E3A8A" />
        <circle cx="45" cy="30" r="16" fill="#F59E0B" />
        <circle cx="45" cy="30" r="12" fill="#1E3A8A" />
      </svg>
    );
  };

  return (
    <div className="flex items-center justify-center pointer-events-none">
      {/* Pure Flag Only - Strictly No border, No frame, No name */}
      {flagUrl && !imgFailed ? (
        <img
          src={flagUrl}
          alt={nation}
          className="w-52 sm:w-72 h-auto max-h-48 object-contain rounded-sm drop-shadow-[0_0_45px_rgba(255,255,255,0.95)]"
          onError={() => setImgFailed(true)}
        />
      ) : (
        getFlagContent()
      )}
    </div>
  );
};

// Pure Tactical Position - NO frame, NO border, NO subtitle name
export const PositionBadge: React.FC<{ position: string }> = ({ position }) => {
  return (
    <div className="flex items-center justify-center pointer-events-none">
      {/* Pure glowing typography in Cruyff font - No box, No frame, No name */}
      <span className="font-cruyff font-black text-7xl sm:text-9xl text-white tracking-widest italic drop-shadow-[0_0_45px_rgba(255,255,255,0.95)]">
        {position}
      </span>
    </div>
  );
};

// Pure Club Crest - NO frame, NO border, NO name (Strictly Official Club Logos)
export const ClubBadge: React.FC<{ club: string; logoUrl?: string }> = ({ club, logoUrl }) => {
  const [imgStage, setImgStage] = React.useState(0);

  const crestUrls = React.useMemo(
    () => resolveClubCrestUrls(club, logoUrl),
    [club, logoUrl]
  );

  React.useEffect(() => {
    setImgStage(0);
  }, [club, logoUrl]);

  const activeUrl =
    crestUrls[imgStage] ||
    '/assets/aistudio/logo_c_u_l_c_b__cho_c_c_huy_n_tho_i_5adb0da5.png';

  return (
    <div className="flex items-center justify-center pointer-events-none">
      {/* Pure Official Club Logo Only - Strictly No border, No frame, No name */}
      <img
        src={activeUrl}
        alt={club}
        referrerPolicy="no-referrer"
        className="w-48 h-48 sm:w-60 sm:h-60 object-contain drop-shadow-[0_0_45px_rgba(234,179,8,0.95)]"
        onError={() => {
          if (imgStage + 1 < crestUrls.length) {
            setImgStage((prev) => prev + 1);
          }
        }}
      />
    </div>
  );
};
