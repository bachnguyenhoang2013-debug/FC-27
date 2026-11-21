import express from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import {
  type ApexControlInput,
  type ApexMatchState,
  type ApexPlayerInit,
  createInitialApexMatchState,
  projectApexStateForSide,
  stepApexMatch,
} from './src/engine/apexMatchEngine.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PREEXISTING_AISTUDIO_FILES = new Set<string>([
  '100_olise_toty_hm_9f4a6330.png',
  '101_gvardiol__toty_hm_4d9fc7b0.png',
  '102_hakimi_toty_hm_6fa9f2b6.png',
  '103_nuno_mendes_toty_hm_60792c6b.png',
  '104_lahm_toty_hm_238cdc59.png',
  '104_maldini_toty_hm_7e590f4b.png',
  'Messi_TOTY_HM_104_ovr_df6c37fa.png',
  'Ramos_TOTY_HM_102_ovr_27d84745.png',
  'Ronaldo_TOTY_HM_104_ovr_2dc4286a.png',
  'iniesta_TOTY_HM_103_ovr_82ed7bb5.png',
  'suker_101_toty_hm_47af07f0.png',
  'thuram_102_toty_hm_3e9fa7a5.png',
  'default_KEYMATCHCUSTOM_MEDIUM_BG_21d60d22.png',
  'default_KEYMATCHCUSTOM_LARGEPOPUP_TEAMBG_RIG_3994f18d.png',
  'default_KEYMATCHCUSTOM_LARGEPOPUP_TEAMBG_LEF__1__3994f18d.png',
  'default_KEYMATCHCUSTOM_DIFFICULTY_TILEBG_SEL_8c5b67ca.png',
  'default_KEYMATCHCUSTOM_DIFFICULTY_TILEBG_PRESS_4d0864c8.png',
  'default_KEYMATCHCUSTOM_DIFFICULTY_TILEBG_NOR_f094d98e.png',
  'default_KEYMATCHCUSTOM_DIFFICULTY_BG__1__87671226.png',
  'image_9a09198a.png',
  'image_4cfe9368.png',
  '2026-01-15_TOTY__2048__97ef4195.jpg',
  'Background_m_c_v__quay_Future_Stars_336ec779.png',
  'FC_Mobile_26___FULL_SOUNDTRACK_PLAYLIST___fdd1fa23.mp3',
  'N_t_m__10_v__quay_Future_Stars_ch_a_ghi_t_n_-_Copy__2__5cfafeea.png',
  'N_t_m__1_v__quay_Future_Stars_ch_a_ghi_t_n_-_Copy_5cfafeea.png',
  'N_t_m__1_v__quay_Future_Stars_ch_a_ghi_t_n_5cfafeea.png',
  'POTM_Bundesliga_Card_ce092f14.png',
  'POTM_LaLiga_Card_8bfc3918.png',
  'POTM_Ligue_1_Card_82cd74e7.png',
  'POTM_Serie_A_Card_68178d74.png',
  'Thay___i_EURO_2024_2bfb41c6.zip',
  'BNS_Vietnam_f67bc222.zip',
  'backgrounds_TOTY26_HM_b1b0286b.png',
  '_m_thanh_animation_Future_Stars__loop_ch__v_o_l_n___u_c762a19b.mp3',
  '_m_thanh_animation_Future_Stars_qu_c_gia__v__tr__v__c_u_l_c_b__804a098c.mp3',
  '_nh_c_u_th__TOTY_ch__ng_1_929d5ee0.png',
  '_nh_c_u_th____m_n_h_nh_m__v__8e2febf4.png',
  '_nh_c_u_th__n_u_kh_ng_hi_n_th_____c_e141ec44.png',
  '_nh_hi_n_th__b_n_tr_n_n_t_v__quay_2229f7f9.png',
  '_nh_m__m_c_v__quay_b5c6b29b.png',
  '_nh_thu_nh__mu__th__UTOTY_Trong_album_d367c95c.png',
  'alex_baena_91_ovr_b7004fec.png',
  'alfonso_moreira_99_ovr_8cd279ff.png',
  'alisson_becker_1774884519477_2b0dc558.png',
  'animation_Future_Stars_loop_452bd904.mp4',
  'animation_Future_Stars_qu_c_gia__v__tr__v__c_u_l_c_b__62c58534.mp4',
  'animation__nh_v__tr___qu_c_gia_v__c_u_l_c_b__af7f42c4.mp3',
  'animation_box_gold_1ef933ca.mp4',
  'animation_box_normal_37025496.mp4',
  'currencysmall_XP_24b56012.png',
  'phong_c_ch_ch_i_tiki_taka_45f775fd.png',
  'phong_c_ch_ch_i_ph_ng_ng__e36e19a1.png',
  'phong_c_ch_ch_i_ph_n_c_ng_19e5bb40.png',
  'phong_c_ch_ch_i_high_press_f49cf103.png',
  'phong_c_ch_ch_i_t_t_c_nh___nh___u_909b6886.png',
  'animation_laliga_qu_c_gia__v__tr__v__c_u_l_c_b__d32f3d2f.mp4',
  'animation_loop_711e4e47.mp3',
  'animtion_loop_laliga_79d83897.mp4',
  'background___u_x_p_h_ng_696f58f9.png',
  'background_laliga_6cb51447.png',
  'ph_c_th_o_m_n_h_nh_ch_nh_39364ad5.png',
  'ph_c_th_o_c_a_h_ng_19837b5c.png',
  'background_s__ki_n_ch__ng_1_467de7cf.png',
  'background_s__ki_n_ch__ng_2_0f4d06e0.png',
  'background_s__ki_n_ch__ng_3_5b528481.png',
  'bellingham__1789368607273_3bf9f9e9.png',
  'box_TOTY26_BG_BTN_NORMAL_2b37f590.png',
  'box_TOTY26_BG_BTN_PRESS_01593156.png',
  'box_TOTY26_BG_NORMAL_abac3573.png',
  'box_TOTY26_BG_PREMIUM_46dc9668.png',
  'box_TOTY26_BG_REMOVE_8820e905.png',
  'box_TOTY26_BG_REWARDPOPUP_071ff4ff.png',
  'box_TOTY26_BG_db8b25e6.png',
  'box_TOTY26_ENTRANCE_WEEK2_1c29c738.png',
  'box_TOTY26_PLAYER_WEEK2_6b52724e.png',
  'bronze_bd340644.png',
  'camara_94_ovr_3f40b31d.png',
  'card_frame_bronze.svg',
  'card_frame_gold.svg',
  'card_frame_icon.svg',
  'card_frame_silver.svg',
  'cole_palmer_1774940479375_9d3af8bf.png',
  'courtois_1779888425976_2ab4307e.png',
  'cristiano_ronaldo_1789369416511_e7a49c1a.png',
  'cruyff_1789118044760_bf79ef03.png',
  'currencylarge_ANS26_SHARDS_38324d2e.png',
  'currencylarge_FESTIVE_DRAFT_VOUCHER_6e95ca19.png',
  'currencysmall_CASHSUB_186b3b3e.png',
  'currencysmall_CASH_b2121428.png',
  'currencysmall_CLUB_TOKEN_ed2df70f.png',
  'currencysmall_COIN_ec777114.png',
  'currencysmall_FESTIVE_DRAFT_VOUCHER_920d4673.png',
  'currencysmall_GE26_SHARDS_845d9f3f.png',
  'currencysmall_RANKUP_TOKEN_92c41213.png',
  'dani_olmo_94_ovr_02cc905a.png',
  'default_KEYMATCHCUSTOM_DIFFICULTY_BG_87671226.png',
  'default_KEYMATCHCUSTOM_LARGEPOPUP_TEAMBG_LEF_3994f18d.png',
  'dembele_1776753690878_16992ddf.png',
  'dorgu_93_ovr_3742de45.png',
  'doue_104_ovr_65c910ea.png',
  'draft_KICKOFF26_BG_85f63734.png',
  'draft_TOTY26_BG__1__c07ec164.png',
  'draft_TOTY26_BG_c07ec164.png',
  'draft_TOTY26_BTN_62974508.png',
  'draft_TOTY26_TABBG_d367c95c.png',
  'ea-sports-fc-mobile-login-main-menu-oct-23-2026-5-50-27-pm_362d56b7.zip',
  'esposito_92_ovr_ac453a13.png',
  'estev_o_103_ovr_47d7fa43.png',
  'foden_1774941248948_8677cab9.png',
  'francisco_conceicao_95_ovr_c3748730.png',
  'gabriel_1792054892538_0eb1b8a2.png',
  'gold_ad959c5e.png',
  'gullit__1783166339902_d67ff87f.png',
  'haaland_1774884438147_1ac42678.png',
  'harry_kane_1774882697885_ac5e0673.png',
  'headerbar_ACTIVITIES_7da2bf18.png',
  'headerbar_FRIENDS_fdfd4b8b.png',
  'headerbar_HOME_46aea045.png',
  'headerbar_INBOX_49949725.png',
  'headerbar_NEWS_ed1c49f0.png',
  'headerbar_SETTING_7888905b.png',
  'henry_1776753191216_a8fb2b66.png',
  'hujisen_98_ovr_6b9032d2.png',
  'ic_launcher_background_efb9615c.png',
  'icon_9df1e579.png',
  'inbox_WEEKEND_GIFT_BANNER_260903_f827e810.png',
  'itemexchange_EXTRA_TIME_TOKEN_59197a13.png',
  'kaka_1792074947594_5d502268.png',
  'karl_97_ovr_c8858d90.png',
  'kevin_de_bruyne_2e758a16.png',
  'khung_hi_n_th__ph_n_th__ng___u_x_p_h_ng_9a3c19b0.png',
  'khung_th__UTOTY_197a5b09.png',
  'khung_th__c_u_th__99-_f1ce2665.png',
  'khung_th__c_u_th__huy_n_tho_i_8b108d78.png',
  'khung_th__c_u_th__ovr_100__0cf0427c.png',
  'khung_th__c_u_th__ovr_90-99_4def7f77.png',
  'khung_th__c_u_th__ovr_th_p___n_ovr_90_a4f2d4b3.png',
  'khung_th__c_u_th__tr_n_90_ovr_314a4ad0.png',
  'khung_trao___i_UTOTY_4da07c41.png',
  'lamine_yamal_1789369228267_d717553b.png',
  'lewandowski_1776753492173_05d7d6bd.png',
  'loading__2__1446a32e.mp4',
  'logo__1__699d1d8d.mp4',
  'logo_chuy_n_nghi_p_c_p_1_704548f5.png',
  'logo_chuy_n_nghi_p_c_p_2_e3f36fec.png',
  'logo_chuy_n_nghi_p_c_p_3_f9139d8f.png',
  'logo_huy_n_tho_i_c_p_1_7e85e9bf.png',
  'logo_huy_n_tho_i_c_p_2_b70b3a2b.png',
  'logo_huy_n_tho_i_c_p_3_08905b13.png',
  'logo_n_t_nh_n_ph_n_th__ng_99fdba6c.png',
  'logo_nh__v____ch_21db442c.png',
  'logo_nhi_m_v__ch_a_ghi_t_n__69def374.png',
  'logo_ph_n_th__ng_f69e6fc7.png',
  'logo_t_i_n_ng_c_p_1_6834cb78.png',
  'logo_t_i_n_ng_c_p_2_c8f05c26.png',
  'logo_t_i_n_ng_c_p_3_eda08e57.png',
  'logo_t_p_s__c_p_1_5beda3ca.png',
  'logo_t_p_s__c_p_2_d6986a22.png',
  'logo_t_p_s__c_p_3_bbdf7a7d.png',
  'logo_th__gi_i_c_p_1_793d437a.png',
  'logo_th__gi_i_c_p_2_112d52ac.png',
  'logo_th__gi_i_c_p_3_98ac4c74.png',
  'maldini_1776958591972_ea2f6250.png',
  'mane_1792055226462_d551afaa.png',
  'mbappe_1792055096022_8899b476.png',
  'messi__1792075578633_ead71949.png',
  'minigamebanner_S10_TOTY26_b2a0f35e.png',
  'minigameicon_S10_TOTY26_83c86f52.png',
  'musiala_1788599210234_6037a4f7.png',
  'myteam_FRAME_CLUB_9d6af476.png',
  'myteam_FRAME_TEAM_FORMATION_d29418c7.png',
  'myteam_FRAME_TEAM_ROLESETTINNG_d5fe62b7.png',
  'n_t_chuy_n_sang_v__quay_Future_Stars_6b977a6f.png',
  'n_t_m__10_v__e46f1af3.png',
  'n_t_m__1_v__8dfd8fe7.png',
  'n_t_trao___i_d4e93c14.png',
  'ngumoha_91_ovr_a9bfee5a.png',
  'nico_paz_102_ovr_c9e47fa1.png',
  'o_reilly_100_ovr_4b74910d.png',
  'packopening_TOTY26_1_2f4b198d.mp4',
  'packopening_TOTY26_2_752636b2.mp4',
  'pau_cubarsi_101_ovr_114b8fce.png',
  'pedri_90_ovr_aa63fc83.png',
  'pele_245f51bd.png',
  'raphinha_97_ovr_73151c98.png',
  'rodri_1789369329983_0f51fb10.png',
  'ronaldinho__1792075083645_20e923ec.png',
  'ronaldo_1776958779148_536f1756.png',
  'saka_1776955535530_3806e9db.png',
  'salah_87bb35e0.png',
  'saliba_1776955521824_3cb7743b.png',
  'screenshot_1_38f17445.png',
  'silver_8099d2cb.png',
  'son_6c00dd24.png',
  'storepack_S11_F_676265b6.png',
  'storepack_S11_d9617be0.png',
  'theo_1df960d7.png',
  'unai_simon_92_ovr_720a1e07.png',
  'v__minigame_ch__ng_5_4a6d531e.png',
  'valverde_1786630085351_cb28c54a.png',
  'van_dijk__1774941605534_70c869f9.png',
  'vieira_2085386e.png',
  'vinicius__1788598778285_3e532f28.png',
  'vuskovic_90_ovr_c4b2d397.png',
  'wirtz_a79e88dd.png',
  'yashin_1774887760506_03c4a2d1.png',
  'zaire_emery_96_ovr_ac64f29d.png',
  'zidane_1786897202347_8dbc8c67.png',
  'ph_c_th_o_m_c_v__quay_d5d21b09.png',
  'UTOTY_Icons_bfeb6ab6.png',
  'logo_star_pass_02de823e.png',
  'c_u_th__n_i_b_t_star_pass_eeb73a44.png',
  'samuel_eto_104_ovr_4fcc5041.png',
  'cha_bum_kun_103_ovr_80269efa.png',
  'de_rossi_102_ovr_20fa1e97.png',
  'rummenigge_101_ovr_28aa2d9c.png',
  'okocha_100_ovr_4db1886a.png',
  '_nh_m_n_h_nh_ch_nh_m_c___u_x_p_h_ng_18ab3244.png',
  '_nh_m_n_h_nh_ch_nh_m_c___u_s__nghi_p_a3fc1f80.png',
  '_nh_m_n_h_nh_ch_nh_m_c___i_h_nh_741b5b87.png',
  'logo_m_n_h_nh_ch_nh_m_c_s__ki_n_39a90bc3.png',
  'olympique_lyonnias_club_81951f92.png',
  'hamburg_club_676dff15.png',
  'porto_club_fac28ab9.png',
  'galatasaray_club_5eb9269b.png',
  'monaco_club_b1e39bdb.png',
  'vietnam_club_1d2bebf2.png',
  'al_nassr_club_bf211e06.png',
  'puskas_dae454a7.png',
  'buffon_3370c894.png',
  'roberto_carlos_2dcbffa9.png',
  'beckham_f2928295.png',
  'khung_th__classics_6d23269c.png',
  'arshavin_7e23d826.png',
  'dani_alves_4bceed38.png',
  'ozil_e3389a7b.png',
  'dida_06c24a9c.png',
  'robben_3957059e.png',
  'shevchenko_classics_529ad638.png',
  'walcott_classics_d477d411.png',
  'sergio_aguero_classics_de6174f8.png',
  'nakata_classics_36afad70.png',
  'park_ji_sung_classics_d85ac917.png',
  'kewell_classics_3d59fafe.png',
  '_nh_hi_n_th__ph_n_th__ng_kim_c__ng_m_c_kh_i___u_fa372a4b.png',
  'khung_nhi_m_v__m_c_kh_i___u_69def374.png',
  '_nh_hi_n_th__ph_n_th__ng_v__quay_m_c_kh_i___u_9ff47727.png',
  '_nh_hi_n_th__ph_n_th__ng_coin_m_c_kh_i___u_bead28fa.png',
]);

function parseMp4DurationSeconds(filePath: string): number | undefined {
  try {
    const buf = fs.readFileSync(filePath);
    const mvhdTag = Buffer.from('mvhd');
    let idx = buf.indexOf(mvhdTag);
    while (idx >= 4) {
      const version = buf[idx + 4];
      if (version === 0 && idx + 24 <= buf.length) {
        const timescale = buf.readUInt32BE(idx + 16);
        const duration = buf.readUInt32BE(idx + 20);
        if (timescale > 0 && duration > 0) {
          return duration / timescale;
        }
      } else if (version === 1 && idx + 36 <= buf.length) {
        const timescale = buf.readUInt32BE(idx + 24);
        const duration = Number(buf.readBigUInt64BE(idx + 28));
        if (timescale > 0 && duration > 0) {
          return duration / timescale;
        }
      }
      idx = buf.indexOf(mvhdTag, idx + 4);
    }
  } catch {
    // ignore read/parse error
  }
  return undefined;
}

const EURO_ASSET_RULES: Array<{
  key: string;
  canonicalFile: string;
  ext: 'png' | 'mp4' | 'mp3';
  match: (normName: string, durationSec?: number) => boolean;
}> = [
  {
    key: 'claimButton',
    canonicalFile: 'claim_button.png',
    ext: 'png',
    match: (n) =>
      n === 'claim button.png' ||
      n.includes('nut nhan phan thuong') ||
      (n.includes('euro') && (n.includes('nut') || /\bn t nh n\b/.test(n) || /\bn t m\b/.test(n))),
  },
  {
    key: 'chainRewardFrame',
    canonicalFile: 'chain_reward_frame.png',
    ext: 'png',
    match: (n) =>
      n === 'chain reward frame.png' ||
      n.includes('khung phan thuong chuoi') ||
      (n.includes('euro') && (n.includes('chuoi') || /\bchu i\b/.test(n))),
  },
  {
    key: 'questFrame',
    canonicalFile: 'quest_frame.png',
    ext: 'png',
    match: (n) =>
      n === 'quest frame.png' ||
      n.includes('khung nhiem vu') ||
      (n.includes('euro') && (n.includes('nhiem vu') || /\bnhi m v\b/.test(n))),
  },
  {
    key: 'pack',
    canonicalFile: 'pack_euro2024.png',
    ext: 'png',
    match: (n) => (n.includes('pack') && n.includes('euro')) || n === 'pack euro2024.png',
  },
  {
    key: 'background',
    canonicalFile: 'bg_euro2024.png',
    ext: 'png',
    match: (n) =>
      ((n.includes('background') || /\bbg\b/.test(n)) && n.includes('euro')) ||
      n === 'bg euro2024.png',
  },
  {
    key: 'iconSmall',
    canonicalFile: 'icon_small.png',
    ext: 'png',
    match: (n) =>
      (n.includes('icon') && n.includes('euro') && (n.includes('nho') || /\bicon nh\b/.test(n))) ||
      n === 'icon small.png',
  },
  {
    key: 'iconLarge',
    canonicalFile: 'icon_large.png',
    ext: 'png',
    match: (n) =>
      (n.includes('icon') && n.includes('euro') && (n.includes('lon') || /\bicon l n\b/.test(n))) ||
      n === 'icon large.png',
  },
  {
    key: 'frame100_105',
    canonicalFile: 'frame_100_105.png',
    ext: 'png',
    match: (n) =>
      (n.includes('euro') && n.includes('100') && (n.includes('105') || n.includes('104'))) ||
      n === 'frame 100 105.png',
  },
  {
    key: 'frame90_99',
    canonicalFile: 'frame_90_99.png',
    ext: 'png',
    match: (n) =>
      (n.includes('euro') && n.includes('90') && n.includes('99')) ||
      n === 'frame 90 99.png',
  },
  // 25 EURO 2024 Player Portraits (matching both clean UTF-8 & AI Studio underscore-mangled names)
  { key: 'euro24_yamal', canonicalFile: 'yamal_104.png', ext: 'png', match: (n) => n.includes('yamal') },
  { key: 'euro24_rodri', canonicalFile: 'rodri_104.png', ext: 'png', match: (n) => n.includes('rodri') },
  { key: 'euro24_fabian_ruiz', canonicalFile: 'fabian_ruiz_103.png', ext: 'png', match: (n) => n.includes('fabian') || n.includes('ruiz') || /\bfabi n\b/.test(n) },
  { key: 'euro24_olmo', canonicalFile: 'olmo_103.png', ext: 'png', match: (n) => n.includes('olmo') },
  { key: 'euro24_musiala', canonicalFile: 'musiala_102.png', ext: 'png', match: (n) => n.includes('musiala') },
  { key: 'euro24_nico_williams', canonicalFile: 'nico_williams_102.png', ext: 'png', match: (n) => n.includes('williams') || (n.includes('nico') && !n.includes('paz')) },
  { key: 'euro24_cucurella', canonicalFile: 'cucurella_101.png', ext: 'png', match: (n) => n.includes('cucurella') },
  { key: 'euro24_saliba', canonicalFile: 'saliba_101.png', ext: 'png', match: (n) => n.includes('saliba') },
  { key: 'euro24_gakpo', canonicalFile: 'gakpo_100.png', ext: 'png', match: (n) => n.includes('gakpo') },
  { key: 'euro24_maignan', canonicalFile: 'maignan_100.png', ext: 'png', match: (n) => n.includes('maignan') },
  { key: 'euro24_akanji', canonicalFile: 'akanji_99.png', ext: 'png', match: (n) => n.includes('akanji') },
  { key: 'euro24_xhaka', canonicalFile: 'xhaka_99.png', ext: 'png', match: (n) => n.includes('xhaka') },
  { key: 'euro24_walker', canonicalFile: 'walker_98.png', ext: 'png', match: (n) => n.includes('walker') },
  { key: 'euro24_bellingham', canonicalFile: 'bellingham_98.png', ext: 'png', match: (n) => n.includes('bellingham') },
  { key: 'euro24_mamardashvili', canonicalFile: 'mamardashvili_97.png', ext: 'png', match: (n) => n.includes('mamardashvili') },
  { key: 'euro24_kane', canonicalFile: 'kane_96.png', ext: 'png', match: (n) => /\bkane\b/.test(n) },
  { key: 'euro24_kroos', canonicalFile: 'kroos_96.png', ext: 'png', match: (n) => n.includes('kroos') },
  { key: 'euro24_saka', canonicalFile: 'saka_95.png', ext: 'png', match: (n) => /\bsaka\b/.test(n) },
  { key: 'euro24_guler', canonicalFile: 'guler_95.png', ext: 'png', match: (n) => n.includes('guler') || n.includes('arda') || /\bg ler\b/.test(n) },
  { key: 'euro24_kante', canonicalFile: 'kante_94.png', ext: 'png', match: (n) => n.includes('kante') || /\bkant\b/.test(n) },
  { key: 'euro24_diogo_costa', canonicalFile: 'diogo_costa_94.png', ext: 'png', match: (n) => n.includes('costa') || n.includes('diogo') },
  { key: 'euro24_guehi', canonicalFile: 'guehi_93.png', ext: 'png', match: (n) => n.includes('guehi') || /\bgu hi\b/.test(n) },
  { key: 'euro24_de_vrij', canonicalFile: 'de_vrij_92.png', ext: 'png', match: (n) => n.includes('vrij') },
  { key: 'euro24_de_bruyne', canonicalFile: 'de_bruyne_91.png', ext: 'png', match: (n) => n.includes('bruyne') },
  { key: 'euro24_yildiz', canonicalFile: 'yildiz_90.png', ext: 'png', match: (n) => n.includes('yilidz') || n.includes('yildiz') || n.includes('kenan') || /\by ld z\b/.test(n) },
  // 2 Videos (MP4)
  {
    key: 'videoStageLoop',
    canonicalFile: 'video_stage_loop.mp4',
    ext: 'mp4',
    match: (n, dur) =>
      n === 'video stage loop.mp4' ||
      n.includes('loop') ||
      (typeof dur === 'number' && dur > 0 && dur < 5.2 && !n.includes('quoc gia') && !/\bqu c gia\b/.test(n)),
  },
  {
    key: 'videoWalkoutIntro',
    canonicalFile: 'video_walkout_intro.mp4',
    ext: 'mp4',
    match: (n, dur) =>
      n === 'video walkout intro.mp4' ||
      n.includes('quoc gia') ||
      /\bqu c gia\b/.test(n) ||
      n.includes('vi tri') ||
      /\bv tr\b/.test(n) ||
      (n.includes('euro') && !n.includes('loop')) ||
      (typeof dur === 'number' && dur >= 5.2),
  },
  // 2 Audio tracks (MP3)
  {
    key: 'audioStageLoop',
    canonicalFile: 'audio_stage_loop.mp3',
    ext: 'mp3',
    match: (n, dur) =>
      n === 'audio stage loop.mp3' ||
      n.includes('loop') ||
      (typeof dur === 'number' && dur >= 12),
  },
  {
    key: 'audioWalkoutIntro',
    canonicalFile: 'audio_walkout_intro.mp3',
    ext: 'mp3',
    match: (n, dur) =>
      n === 'audio walkout intro.mp3' ||
      n.includes('quoc gia') ||
      /\bqu c gia\b/.test(n) ||
      n.includes('vi tri') ||
      /\bv tr\b/.test(n) ||
      (n.includes('euro') && !n.includes('loop')) ||
      (typeof dur === 'number' && dur > 0 && dur < 12),
  },
];

function normalizeAssetName(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[_\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const processedZipCache = new Set<string>();

function scanEuro2024Assets(rootDir: string): Record<string, string> {
  const resolved: Record<string, string> = {};
  const euroDir = path.join(rootDir, 'public', 'assets', 'aistudio', 'euro2024');
  const baseAistudioDir = path.join(rootDir, 'public', 'assets', 'aistudio');
  const distRoot = path.join(rootDir, 'dist');

  // 0. Auto-extract any newly chat-uploaded .zip in /public/assets/aistudio/ verbatim (untouched bytes)
  if (fs.existsSync(baseAistudioDir)) {
    const allBase = fs.readdirSync(baseAistudioDir);
    for (const file of allBase) {
      if (
        file.toLowerCase().endsWith('.zip') &&
        !PREEXISTING_AISTUDIO_FILES.has(file) &&
        !processedZipCache.has(file)
      ) {
        processedZipCache.add(file);
        try {
          const zipFull = path.join(baseAistudioDir, file);
          const tmpExtract = path.join('/tmp', `euro24_autozip_${Date.now()}`);
          fs.mkdirSync(tmpExtract, { recursive: true });
          execFileSync('unzip', ['-oq', zipFull, '-d', tmpExtract]);
          fs.mkdirSync(euroDir, { recursive: true });

          const walkExtracted = (dir: string): string[] => {
            const out: string[] = [];
            for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
              if (entry.name.startsWith('__MACOSX') || entry.name.startsWith('.')) continue;
              const full = path.join(dir, entry.name);
              if (entry.isDirectory()) out.push(...walkExtracted(full));
              else out.push(full);
            }
            return out;
          };

          for (const fPath of walkExtracted(tmpExtract)) {
            const fBase = path.basename(fPath);
            const fExt = path.extname(fBase).toLowerCase().replace('.', '');
            if (!['png', 'jpg', 'jpeg', 'webp', 'mp4', 'mp3'].includes(fExt)) continue;
            const nExt: 'png' | 'mp4' | 'mp3' =
              fExt === 'mp4' ? 'mp4' : fExt === 'mp3' ? 'mp3' : 'png';
            const dur = nExt === 'mp4' ? parseMp4DurationSeconds(fPath) : undefined;
            const norm = normalizeAssetName(fBase);
            const rule = EURO_ASSET_RULES.find((r) => r.ext === nExt && r.match(norm, dur));
            if (rule) {
              const rawBuf = fs.readFileSync(fPath);
              fs.writeFileSync(path.join(euroDir, rule.canonicalFile), rawBuf);
              if (fs.existsSync(distRoot)) {
                const euroDistDir = path.join(distRoot, 'assets', 'aistudio', 'euro2024');
                fs.mkdirSync(euroDistDir, { recursive: true });
                fs.writeFileSync(path.join(euroDistDir, rule.canonicalFile), rawBuf);
              }
            }
          }
          fs.rmSync(tmpExtract, { recursive: true, force: true });
        } catch {
          // ignore corrupted/partial zip
        }
      }
    }
  }

  // 1. Check canonical files in /public/assets/aistudio/euro2024/
  if (fs.existsSync(euroDir)) {
    const euroFiles = fs.readdirSync(euroDir);
    for (const rule of EURO_ASSET_RULES) {
      if (euroFiles.includes(rule.canonicalFile)) {
        const stat = fs.statSync(path.join(euroDir, rule.canonicalFile));
        resolved[rule.key] = `/assets/aistudio/euro2024/${rule.canonicalFile}?v=${Math.floor(stat.mtimeMs)}`;
      }
    }
  }

  // 2. Also scan /public/assets/aistudio/ for any direct chat-uploaded EURO 2024 files
  if (fs.existsSync(baseAistudioDir)) {
    const baseFiles = fs.readdirSync(baseAistudioDir);
    const newMp3Files: Array<{ file: string; size: number; norm: string }> = [];

    for (const file of baseFiles) {
      if (PREEXISTING_AISTUDIO_FILES.has(file)) continue;
      const lowerExt = path.extname(file).toLowerCase().replace('.', '');
      if (!['png', 'jpg', 'jpeg', 'webp', 'mp4', 'mp3'].includes(lowerExt)) continue;

      const normExt: 'png' | 'mp4' | 'mp3' =
        lowerExt === 'mp4' ? 'mp4' : lowerExt === 'mp3' ? 'mp3' : 'png';
      const fullPath = path.join(baseAistudioDir, file);
      const dur = normExt === 'mp4' ? parseMp4DurationSeconds(fullPath) : undefined;
      const norm = normalizeAssetName(file);

      if (normExt === 'mp3') {
        try {
          newMp3Files.push({ file, size: fs.statSync(fullPath).size, norm });
        } catch {
          // ignore
        }
      }

      for (const rule of EURO_ASSET_RULES) {
        if (resolved[rule.key] || rule.ext !== normExt) continue;
        if (rule.match(norm, dur)) {
          resolved[rule.key] = `/assets/aistudio/${file}`;
          break;
        }
      }
    }

    // Fallback size-based disambiguation if 2 generic MP3s were uploaded
    if (
      newMp3Files.length >= 2 &&
      (!resolved.audioWalkoutIntro || !resolved.audioStageLoop)
    ) {
      const sorted = [...newMp3Files].sort((a, b) => a.size - b.size);
      if (!resolved.audioWalkoutIntro) {
        resolved.audioWalkoutIntro = `/assets/aistudio/${sorted[0].file}`;
      }
      if (!resolved.audioStageLoop) {
        resolved.audioStageLoop = `/assets/aistudio/${sorted[sorted.length - 1].file}`;
      }
    }
  }

  return resolved;
}

const ZIP_CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function computeCrc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = ZIP_CRC32_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function buildCloudflareUploadZipBuffer(distDir: string): Buffer {
  const entries: Array<{ relPath: string; data: Buffer; compress: boolean }> = [];

  const walkDist = (currentDir: string, prefix: string) => {
    const items = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const item of items) {
      const name = item.name;
      if (
        name === '.DS_Store' ||
        name === '.assetsignore' ||
        name.startsWith('wrangler.') ||
        name === 'package.json' ||
        name.startsWith('tsconfig') ||
        name.toLowerCase().endsWith('.zip')
      ) {
        continue;
      }
      const fullPath = path.join(currentDir, name);
      const relPath = prefix ? `${prefix}/${name}` : name;
      if (item.isDirectory()) {
        walkDist(fullPath, relPath);
      } else if (item.isFile()) {
        const ext = path.extname(name).toLowerCase();
        const shouldCompress = ['.html', '.js', '.css', '.svg', '.json', '.txt'].includes(ext);
        entries.push({
          relPath,
          data: fs.readFileSync(fullPath),
          compress: shouldCompress,
        });
      }
    }
  };

  walkDist(distDir, '');

  // Ensure SPA fallback rule is at the root of the Cloudflare Direct Upload archive
  if (!entries.some((e) => e.relPath === '_redirects')) {
    entries.push({
      relPath: '_redirects',
      data: Buffer.from('/* /index.html 200\n', 'utf8'),
      compress: false,
    });
  }

  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.relPath.replace(/\\/g, '/'), 'utf8');
    const rawData = entry.data;
    const crc = computeCrc32(rawData);
    const compressedData = entry.compress
      ? zlib.deflateRawSync(rawData, { level: 9 })
      : rawData;
    const method = entry.compress ? 8 : 0;

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0x0800, 6); // UTF-8 filename flag
    localHeader.writeUInt16LE(method, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0x555a, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(compressedData.length, 18);
    localHeader.writeUInt32LE(rawData.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);

    localParts.push(localHeader, nameBuf, compressedData);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(method, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0x555a, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(compressedData.length, 20);
    centralHeader.writeUInt32LE(rawData.length, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);

    centralParts.push(centralHeader, nameBuf);
    offset += localHeader.length + nameBuf.length + compressedData.length;
  }

  const centralDirBuf = Buffer.concat(centralParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralDirBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralDirBuf, eocd]);
}

async function startServer() {
  const app = express();
  const port: number = Number(process.env.PORT) || 3000;
  const isDev: boolean = process.env.npm_lifecycle_event === 'dev';

  app.use(express.json({ limit: '150mb' }));

  app.get('/api/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // One-click pre-built static ZIP package ready for Cloudflare "Upload assets" drag-and-drop (zero CLI needed)
  app.get('/api/export/cloudflare-zip', (_req, res) => {
    try {
      const distDir = path.join(__dirname, 'dist');
      const indexHtml = path.join(distDir, 'index.html');
      if (!fs.existsSync(indexHtml)) {
        execFileSync('npx', ['vite', 'build'], { cwd: __dirname, stdio: 'ignore' });
      }
      const zipBuffer = buildCloudflareUploadZipBuffer(distDir);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="fc-mobile-26-cloudflare.zip"'
      );
      res.setHeader('Content-Length', String(zipBuffer.length));
      res.status(200).send(zipBuffer);
    } catch (err) {
      res.status(500).json({ ok: false, message: String(err) });
    }
  });

  const LIBERTADORES_ASSET_RULES: Array<{
    key: string;
    ext: 'png' | 'mp4' | 'mp3';
    canonicalFile: string;
    match: (normName: string) => boolean;
  }> = [
    {
      key: 'tokenSmall',
      ext: 'png',
      canonicalFile: 'token_small.png',
      match: (n) => n.includes('currencysmall') && (n.includes('conmebol') || n.includes('libertadores')),
    },
    {
      key: 'tokenLarge',
      ext: 'png',
      canonicalFile: 'token_large.png',
      match: (n) => n.includes('currencylarge') && (n.includes('conmebol') || n.includes('libertadores')),
    },
    {
      key: 'cardFrame',
      ext: 'png',
      canonicalFile: 'card_frame.png',
      match: (n) =>
        (n.includes('backgrounds') && n.includes('card') && (n.includes('conmebol') || n.includes('libertadores'))) ||
        (n.includes('khung') && n.includes('the') && (n.includes('conmebol') || n.includes('libertadores'))),
    },
    {
      key: 'lib_hulk_106',
      ext: 'png',
      canonicalFile: 'hulk_106.png',
      match: (n) => n.includes('hulk') && (n.includes('conmebol') || n.includes('libertadores') || n.includes('106')),
    },
    {
      key: 'lib_riquelme_105',
      ext: 'png',
      canonicalFile: 'riquelme_105.png',
      match: (n) => n.includes('riquelme') && (n.includes('conmebol') || n.includes('libertadores') || n.includes('105')),
    },
    {
      key: 'lib_ze_roberto_104',
      ext: 'png',
      canonicalFile: 'ze_roberto_104.png',
      match: (n) =>
        (n.includes('ze roberto') || (n.includes('roberto') && n.includes('ze'))) &&
        (n.includes('conmebol') || n.includes('libertadores') || n.includes('104')),
    },
    {
      key: 'lib_milito_103',
      ext: 'png',
      canonicalFile: 'milito_103.png',
      match: (n) => n.includes('milito') && (n.includes('conmebol') || n.includes('libertadores') || n.includes('103')),
    },
    {
      key: 'lib_pato_102',
      ext: 'png',
      canonicalFile: 'alexandre_pato_102.png',
      match: (n) => n.includes('pato') && (n.includes('conmebol') || n.includes('libertadores') || n.includes('102')),
    },
    {
      key: 'lib_maicon_106',
      ext: 'png',
      canonicalFile: 'maicon_106.png',
      match: (n) => n.includes('maicon') && (n.includes('106') || n.includes('conmebol') || n.includes('libertadores')),
    },
    {
      key: 'lib_carlos_alberto_105',
      ext: 'png',
      canonicalFile: 'carlos_alberto_105.png',
      match: (n) => n.includes('alberto') && n.includes('carlos'),
    },
    {
      key: 'lib_marcelo_104',
      ext: 'png',
      canonicalFile: 'marcelo_104.png',
      match: (n) => n.includes('marcelo') && (n.includes('104') || n.includes('conmebol') || n.includes('libertadores')),
    },
    {
      key: 'lib_ramires_103',
      ext: 'png',
      canonicalFile: 'ramires_103.png',
      match: (n) => n.includes('ramires') && (n.includes('103') || n.includes('conmebol') || n.includes('libertadores')),
    },
    {
      key: 'lib_tevez_102',
      ext: 'png',
      canonicalFile: 'tevez_102.png',
      match: (n) => n.includes('tevez') && (n.includes('102') || n.includes('conmebol') || n.includes('libertadores')),
    },
    {
      key: 'videoStageLoop',
      ext: 'mp4',
      canonicalFile: 'video_stage_loop.mp4',
      match: (n) => n.includes('loop') && (n.includes('conmebol') || n.includes('libertadores')),
    },
    {
      key: 'videoWalkoutIntro',
      ext: 'mp4',
      canonicalFile: 'video_walkout_intro.mp4',
      match: (n) => !n.includes('loop') && (n.includes('conmebol') || n.includes('libertadores')),
    },
    {
      key: 'audioStageLoop',
      ext: 'mp3',
      canonicalFile: 'audio_stage_loop.mp3',
      match: (n) => n.includes('loop') && (n.includes('conmebol') || n.includes('libertadores')),
    },
    {
      key: 'audioWalkoutIntro',
      ext: 'mp3',
      canonicalFile: 'audio_walkout_intro.mp3',
      match: (n) => !n.includes('loop') && (n.includes('conmebol') || n.includes('libertadores')),
    },
    {
      key: 'minigameLogo',
      ext: 'png',
      canonicalFile: 'logo_minigame.png',
      match: (n) => n.includes('minigame') && (n.includes('conmebol') || n.includes('libertadores')),
    },
    {
      key: 'rewardBoxLogo',
      ext: 'png',
      canonicalFile: 'logo_reward_box.png',
      match: (n) =>
        (n.includes('phan thuong') || /\bph n th\b/.test(n)) &&
        n.includes('logo') &&
        (n.includes('conmebol') || n.includes('libertadores')),
    },
    {
      key: 'eventLogo',
      ext: 'png',
      canonicalFile: 'logo_libertadores.png',
      match: (n) =>
        n === 'logo conmebol libertadores.png' ||
        (n.startsWith('logo') &&
          (n.includes('conmebol') || n.includes('libertadores')) &&
          !n.includes('minigame') &&
          !n.includes('phan thuong') &&
          !/\bph n th\b/.test(n)),
    },
    {
      key: 'storeOffer30k',
      ext: 'png',
      canonicalFile: 'store_offer_30000_gems.png',
      match: (n) =>
        (n.includes('30000') || n.includes('kim cuong') || /\bkim c\b/.test(n)) &&
        (n.includes('conmebol') || n.includes('libertadores') || n.includes('goi cua hang') || /\bg i c a h ng\b/.test(n)),
    },
    {
      key: 'storePack',
      ext: 'png',
      canonicalFile: 'storepack_libertadores.png',
      match: (n) => n === 'storepack.png' || (n.includes('storepack') && (n.includes('conmebol') || n.includes('libertadores'))),
    },
    {
      key: 'milestoneFrame',
      ext: 'png',
      canonicalFile: 'milestone_frame.png',
      match: (n) =>
        (n.includes('khung') && (n.includes('moc') || /\bm c\b/.test(n))) || n === 'milestone frame.png',
    },
    {
      key: 'questFrame',
      ext: 'png',
      canonicalFile: 'quest_frame.png',
      match: (n) =>
        n === 'khung nhiem vu.png' ||
        (n.includes('khung') &&
          (n.includes('nhiem vu') || /\bnhi m v\b/.test(n)) &&
          !n.includes('khoi dau') &&
          !/\bkh i\b/.test(n) &&
          !n.includes('euro')),
    },
    {
      key: 'entranceBanner',
      ext: 'png',
      canonicalFile: 'entrance_libertadores.png',
      match: (n) => n.includes('entrance') && (n.includes('conmebol') || n.includes('libertadores')),
    },
    {
      key: 'unlockTicket',
      ext: 'png',
      canonicalFile: 'unlock_ticket.png',
      match: (n) =>
        (n.includes('mo khoa') || /\bm kh a\b/.test(n)) && (n.includes('ve') || /\bv\b/.test(n) || n.includes('su kien')),
    },
    {
      key: 'bgMain',
      ext: 'png',
      canonicalFile: 'bg_chapter_main.png',
      match: (n) =>
        n.includes('background') && (n.includes('chuong chinh') || /\bch ng ch nh\b/.test(n)),
    },
    {
      key: 'bgChapter2',
      ext: 'png',
      canonicalFile: 'bg_chapter_2.png',
      match: (n) =>
        n.includes('background') &&
        (n.includes('chuong 2') || /\bch ng 2\b/.test(n)) &&
        !n.includes('su kien') &&
        !/\bs ki n\b/.test(n),
    },
    {
      key: 'bgChapter3',
      ext: 'png',
      canonicalFile: 'bg_chapter_3.png',
      match: (n) =>
        n.includes('background') &&
        (n.includes('chuong 3') || /\bch ng 3\b/.test(n)) &&
        !n.includes('su kien') &&
        !/\bs ki n\b/.test(n),
    },
    {
      key: 'bgRewards',
      ext: 'png',
      canonicalFile: 'bg_chapter_rewards.png',
      match: (n) =>
        n.includes('background') &&
        (n.includes('chuong phan thuong') || /\bch ng ph n th\b/.test(n)),
    },
    {
      key: 'triviaIntroBanner',
      ext: 'png',
      canonicalFile: 'trivia_intro_banner.png',
      match: (n) =>
        (n.includes('gioi thieu') || /\bgi i thi u\b/.test(n)) &&
        (n.includes('chuong 3') || /\bch ng 3\b/.test(n)),
    },
    {
      key: 'matchBall',
      ext: 'png',
      canonicalFile: 'match_ball.png',
      match: (n) => n === 'match.png' || n.startsWith('match '),
    },
  ];

  const OFFICIAL_LIBERTADORES_AISTUDIO_PATHS: Record<string, string> = {
    tokenSmall: '/assets/aistudio/currencysmall_conmebol_libertadores_TOKEN_bc407b18.png',
    tokenLarge: '/assets/aistudio/currencylarge_conmebol_libertadores_TOKEN_35860ba9.png',
    unlockTicket: '/assets/aistudio/v__m__kh_a_tr__c_s__ki_n_27573358.png',
    entranceBanner: '/assets/aistudio/entrance_conmebol_libertadores_c9e630da.png',
    eventLogo: '/assets/aistudio/logo_conmebol_libertadores_4052c782.png',
    minigameLogo: '/assets/aistudio/logo_minigame_conmebol_libertadores_64f86adc.png',
    rewardBoxLogo: '/assets/aistudio/logo_ph_n_th__ng_conmebol_libertadores_310a3077.png',
    bgMain: '/assets/aistudio/background_ch__ng_ch_nh_83c2dfd0.png',
    bgChapter2: '/assets/aistudio/background_ch__ng_2_5bb119b7.png',
    bgChapter3: '/assets/aistudio/background_ch__ng_3_86d72f45.png',
    bgRewards: '/assets/aistudio/background_ch__ng_ph_n_th__ng_b53b631d.png',
    triviaIntroBanner: '/assets/aistudio/_nh_gi_i_thi_u_ch__ng_3_69aabb3a.png',
    questFrame: '/assets/aistudio/khung_nhi_m_v__34beb230.png',
    milestoneFrame: '/assets/aistudio/khung_nh_n_ph_n_th__ng_m_c_2513af90.png',
    storePack: '/assets/aistudio/storepack_5c9df418.png',
    storeOffer30k:
      '/assets/aistudio/g_i_c_a_h_ng_conmebol_libertadores_30000_kim_c__ng_54d3ec32.png',
    cardFrame: '/assets/aistudio/backgrounds_CONMEBOL_LIBERTADORES_card_f512eb70.png',
    videoWalkoutIntro:
      '/assets/aistudio/animation_conmebol_libertadores_qu_c_gia__v__tr___c_u_l_c_b__fa560086.mp4',
    videoStageLoop:
      '/assets/aistudio/animation_conmebol_libertadores_loop_2baa5968.mp4',
    audioWalkoutIntro:
      '/assets/aistudio/_m_thanh_animation_conmebol_libertadores_qu_c_gia__v__tr___c_u_l_c_b__d0f82a7d.mp3',
    audioStageLoop:
      '/assets/aistudio/_m_thanh_animation_conmebol_libertadores_loop_l_n___u_315b7b52.mp3',
    lib_hulk_106: '/assets/aistudio/hulk_conmebol_libertadores_88ab1840.png',
    lib_riquelme_105: '/assets/aistudio/riquelme_conmebol_libertadores_1ef75720.png',
    lib_ze_roberto_104: '/assets/aistudio/ze_roberto_conmebol_libertadores_17555fdf.png',
    lib_milito_103: '/assets/aistudio/milito_conmebol_libertadores_fd286104.png',
    lib_pato_102: '/assets/aistudio/alexandre_pato_conmebol_libertadores_3607b014.png',
    lib_maicon_106: '/assets/aistudio/106_ovr_rb_maicon_0a8029b4.png',
    lib_carlos_alberto_105: '/assets/aistudio/105_ovr_alberto_carlos_f9164e93.png',
    lib_marcelo_104: '/assets/aistudio/104_ovr_marcelo_6cc6a750.png',
    lib_ramires_103: '/assets/aistudio/103_ovr_ramires_9ae339d6.png',
    lib_tevez_102: '/assets/aistudio/102_tevez_bd73437e.png',
  };

  function scanLibertadoresAssets(rootDir: string): Record<string, string> {
    const resolved: Record<string, string> = { ...OFFICIAL_LIBERTADORES_AISTUDIO_PATHS };
    const aistudioDir = path.join(rootDir, 'public', 'assets', 'aistudio');
    const libDir = path.join(aistudioDir, 'libertadores');

    // Auto-discover any matching CONMEBOL files in /public/assets/aistudio/
    if (fs.existsSync(aistudioDir)) {
      const topFiles = fs.readdirSync(aistudioDir);
      for (const fName of topFiles) {
        const extRaw = path.extname(fName).toLowerCase().replace('.', '');
        if (!['png', 'jpg', 'jpeg', 'webp', 'mp4', 'mp3'].includes(extRaw)) continue;
        const normExt: 'png' | 'mp4' | 'mp3' =
          extRaw === 'mp4' ? 'mp4' : extRaw === 'mp3' ? 'mp3' : 'png';
        const norm = normalizeAssetName(fName);
        for (const rule of LIBERTADORES_ASSET_RULES) {
          if (!resolved[rule.key] && rule.ext === normExt && rule.match(norm)) {
            resolved[rule.key] = `/assets/aistudio/${fName}`;
          }
        }
      }
    }

    // Prioritize verbatim synced files in /public/assets/aistudio/libertadores/
    if (fs.existsSync(libDir)) {
      const libFiles = fs.readdirSync(libDir);
      for (const rule of LIBERTADORES_ASSET_RULES) {
        if (libFiles.includes(rule.canonicalFile)) {
          const stat = fs.statSync(path.join(libDir, rule.canonicalFile));
          if (stat.size > 0) {
            resolved[rule.key] = `/assets/aistudio/libertadores/${rule.canonicalFile}?v=${Math.floor(stat.mtimeMs)}`;
          }
        }
      }
    }

    return resolved;
  }

  app.get('/api/libertadores-assets/status', (_req, res) => {
    try {
      const resolved = scanLibertadoresAssets(__dirname);
      res.status(200).json({
        resolved,
        customCount: Object.keys(resolved).length,
      });
    } catch (err) {
      res.status(200).json({ resolved: {}, customCount: 0, error: String(err) });
    }
  });

  app.post('/api/libertadores-assets/upload', (req, res) => {
    try {
      const { filename, dataBase64 } = req.body as {
        filename?: string;
        dataBase64?: string;
      };
      if (!filename || !dataBase64) {
        res.status(400).json({ ok: false, message: 'Missing filename or dataBase64' });
        return;
      }

      const ext = path.extname(filename).toLowerCase().replace('.', '');
      const commaIdx = dataBase64.indexOf(',');
      const rawBase64 = commaIdx >= 0 ? dataBase64.slice(commaIdx + 1) : dataBase64;
      const verbatimBuffer = Buffer.from(rawBase64, 'base64');
      const libPublicDir = path.join(__dirname, 'public', 'assets', 'aistudio', 'libertadores');
      fs.mkdirSync(libPublicDir, { recursive: true });
      const distRoot = path.join(__dirname, 'dist');

      if (ext === 'zip') {
        const tmpZipDir = path.join('/tmp', `lib_zip_${Date.now()}`);
        fs.mkdirSync(tmpZipDir, { recursive: true });
        const tmpZipFile = path.join(tmpZipDir, 'upload.zip');
        fs.writeFileSync(tmpZipFile, verbatimBuffer);
        const extractDir = path.join(tmpZipDir, 'extracted');
        fs.mkdirSync(extractDir, { recursive: true });
        execFileSync('unzip', ['-oq', tmpZipFile, '-d', extractDir]);

        const walkFiles = (dir: string): string[] => {
          const out: string[] = [];
          for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            if (entry.name.startsWith('__MACOSX') || entry.name.startsWith('.')) continue;
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) out.push(...walkFiles(full));
            else out.push(full);
          }
          return out;
        };

        let imported = 0;
        for (const fPath of walkFiles(extractDir)) {
          const fBase = path.basename(fPath);
          const fExt = path.extname(fBase).toLowerCase().replace('.', '');
          if (!['png', 'jpg', 'jpeg', 'webp', 'mp4', 'mp3'].includes(fExt)) continue;
          const nExt: 'png' | 'mp4' | 'mp3' =
            fExt === 'mp4' ? 'mp4' : fExt === 'mp3' ? 'mp3' : 'png';
          const rule = LIBERTADORES_ASSET_RULES.find(
            (r) => r.ext === nExt && r.match(normalizeAssetName(fBase))
          );
          if (rule) {
            const rawBuf = fs.readFileSync(fPath);
            fs.writeFileSync(path.join(libPublicDir, rule.canonicalFile), rawBuf);
            if (fs.existsSync(distRoot)) {
              const libDistDir = path.join(distRoot, 'assets', 'aistudio', 'libertadores');
              fs.mkdirSync(libDistDir, { recursive: true });
              fs.writeFileSync(path.join(libDistDir, rule.canonicalFile), rawBuf);
            }
            imported++;
          }
        }
        fs.rmSync(tmpZipDir, { recursive: true, force: true });
        res.status(200).json({ ok: true, zipImported: imported });
        return;
      }

      if (!['png', 'jpg', 'jpeg', 'webp', 'mp4', 'mp3'].includes(ext)) {
        res.status(400).json({ ok: false, message: `Unsupported extension: ${ext}` });
        return;
      }

      const normExt: 'png' | 'mp4' | 'mp3' =
        ext === 'mp4' ? 'mp4' : ext === 'mp3' ? 'mp3' : 'png';
      const matchedRule = LIBERTADORES_ASSET_RULES.find(
        (r) => r.ext === normExt && r.match(normalizeAssetName(filename))
      );
      if (!matchedRule) {
        res.status(200).json({ ok: false, skipped: true, filename });
        return;
      }

      fs.writeFileSync(path.join(libPublicDir, matchedRule.canonicalFile), verbatimBuffer);
      if (fs.existsSync(distRoot)) {
        const libDistDir = path.join(distRoot, 'assets', 'aistudio', 'libertadores');
        fs.mkdirSync(libDistDir, { recursive: true });
        fs.writeFileSync(path.join(libDistDir, matchedRule.canonicalFile), verbatimBuffer);
      }
      res.status(200).json({ ok: true, key: matchedRule.key });
    } catch (err) {
      res.status(500).json({ ok: false, message: String(err) });
    }
  });

  app.get('/api/euro2024-assets/status', (_req, res) => {
    try {
      const resolved = scanEuro2024Assets(__dirname);
      res.status(200).json({
        resolved,
        customCount: Object.keys(resolved).length,
      });
    } catch (err) {
      res.status(200).json({ resolved: {}, customCount: 0, error: String(err) });
    }
  });

  // Verbatim byte-for-byte untouched uploader for user's original EURO 2024 files
  app.post('/api/euro2024-assets/upload', (req, res) => {
    try {
      const { filename, dataBase64, durationSec } = req.body as {
        filename?: string;
        dataBase64?: string;
        durationSec?: number;
      };
      if (!filename || !dataBase64) {
        res.status(400).json({ ok: false, message: 'Missing filename or dataBase64' });
        return;
      }

      const ext = path.extname(filename).toLowerCase().replace('.', '');
      if (ext === 'zip') {
        const commaIdx = dataBase64.indexOf(',');
        const rawBase64 = commaIdx >= 0 ? dataBase64.slice(commaIdx + 1) : dataBase64;
        const zipBuffer = Buffer.from(rawBase64, 'base64');
        const tmpZipDir = path.join('/tmp', `euro24_zip_${Date.now()}`);
        fs.mkdirSync(tmpZipDir, { recursive: true });
        const tmpZipFile = path.join(tmpZipDir, 'upload.zip');
        fs.writeFileSync(tmpZipFile, zipBuffer);
        const extractDir = path.join(tmpZipDir, 'extracted');
        fs.mkdirSync(extractDir, { recursive: true });
        execFileSync('unzip', ['-oq', tmpZipFile, '-d', extractDir]);

        const euroPublicDir = path.join(__dirname, 'public', 'assets', 'aistudio', 'euro2024');
        fs.mkdirSync(euroPublicDir, { recursive: true });
        const distRoot = path.join(__dirname, 'dist');
        const walkFiles = (dir: string): string[] => {
          const out: string[] = [];
          for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) out.push(...walkFiles(full));
            else out.push(full);
          }
          return out;
        };

        let imported = 0;
        for (const fPath of walkFiles(extractDir)) {
          const fBase = path.basename(fPath);
          const fExt = path.extname(fBase).toLowerCase().replace('.', '');
          if (fExt !== 'png' && fExt !== 'mp4' && fExt !== 'mp3' && fExt !== 'jpg' && fExt !== 'jpeg' && fExt !== 'webp') continue;
          const nExt: 'png' | 'mp4' | 'mp3' = fExt === 'mp4' ? 'mp4' : fExt === 'mp3' ? 'mp3' : 'png';
          const rule = EURO_ASSET_RULES.find((r) => r.ext === nExt && r.match(normalizeAssetName(fBase)));
          if (rule) {
            const rawBuf = fs.readFileSync(fPath);
            fs.writeFileSync(path.join(euroPublicDir, rule.canonicalFile), rawBuf);
            if (fs.existsSync(distRoot)) {
              const euroDistDir = path.join(distRoot, 'assets', 'aistudio', 'euro2024');
              fs.mkdirSync(euroDistDir, { recursive: true });
              fs.writeFileSync(path.join(euroDistDir, rule.canonicalFile), rawBuf);
            }
            imported++;
          }
        }
        fs.rmSync(tmpZipDir, { recursive: true, force: true });
        res.status(200).json({ ok: true, zipImported: imported });
        return;
      }

      if (ext !== 'png' && ext !== 'mp4' && ext !== 'mp3' && ext !== 'jpg' && ext !== 'jpeg' && ext !== 'webp') {
        res.status(400).json({ ok: false, message: `Unsupported extension: ${ext}` });
        return;
      }

      const normExt: 'png' | 'mp4' | 'mp3' = ext === 'mp4' ? 'mp4' : ext === 'mp3' ? 'mp3' : 'png';
      const normName = normalizeAssetName(filename);

      const matchedRule = EURO_ASSET_RULES.find(
        (r) => r.ext === normExt && r.match(normName, durationSec)
      );

      if (!matchedRule) {
        res.status(200).json({ ok: false, skipped: true, filename });
        return;
      }

      const commaIdx = dataBase64.indexOf(',');
      const rawBase64 = commaIdx >= 0 ? dataBase64.slice(commaIdx + 1) : dataBase64;
      const verbatimBuffer = Buffer.from(rawBase64, 'base64');

      const euroPublicDir = path.join(__dirname, 'public', 'assets', 'aistudio', 'euro2024');
      fs.mkdirSync(euroPublicDir, { recursive: true });
      const targetPublicPath = path.join(euroPublicDir, matchedRule.canonicalFile);
      fs.writeFileSync(targetPublicPath, verbatimBuffer);

      // Mirror verbatim into dist if dist already exists
      const distRoot = path.join(__dirname, 'dist');
      if (fs.existsSync(distRoot)) {
        const euroDistDir = path.join(distRoot, 'assets', 'aistudio', 'euro2024');
        fs.mkdirSync(euroDistDir, { recursive: true });
        fs.writeFileSync(path.join(euroDistDir, matchedRule.canonicalFile), verbatimBuffer);
      }

      res.status(200).json({
        ok: true,
        key: matchedRule.key,
        url: `/assets/aistudio/euro2024/${matchedRule.canonicalFile}?v=${Date.now()}`,
      });
    } catch (err) {
      res.status(500).json({ ok: false, message: String(err) });
    }
  });

  // =========================================================================
  // REAL-TIME ONLINE PRESENCE, FRIENDS SYSTEM & PVP ENGINE SHARED STATE
  // =========================================================================
  interface RankedPitchPlayer {
    id: string;
    cardId?: string;
    name: string;
    shortName: string;
    pos: string;
    ovr: number;
    x: number;
    y: number;
    stamina: number;
    isGk: boolean;
  }

  interface RankedQueueProfile {
    clientId: string;
    username: string;
    teamName: string;
    teamLogo: string;
    ovr: number;
    tierIndex: number;
    rankLabel: string;
    rankLogoUrl: string;
    formationName: string;
    rankedSubMode?: 'manager' | 'apex';
    starters: Array<{
      id: string;
      name: string;
      shortName: string;
      pos: string;
      ovr: number;
      baseX: number;
      baseY: number;
      isGk: boolean;
      number?: number;
      pac?: number;
      sho?: number;
      pas?: number;
      dri?: number;
      def?: number;
      phy?: number;
      cardId?: string;
      cardType?: string;
      league?: string;
      avatarUrl?: string;
      customFrameUrl?: string;
      frameIncludesPortrait?: boolean;
      club?: string;
      clubLogo?: string;
      nation?: string;
      nationFlag?: string;
      skillMoves?: number;
      weakFoot?: number;
    }>;
  }

  interface RankedWsClient {
    id: string;
    ws: WebSocket;
    inQueue: boolean;
    profile: RankedQueueProfile | null;
    roomId: string | null;
  }

  interface PvpSideState {
    client: RankedWsClient | null;
    profile: RankedQueueProfile;
    mentality: 'defensive' | 'balanced' | 'attacking';
    pressing: 'low' | 'medium' | 'high';
    attackFocus: 'mixed' | 'wings' | 'center' | 'long_shot';
    formationName: string;
    score: number;
    goalScorerCardIds: string[];
    shots: number;
    possTicks: number;
    entities: RankedPitchPlayer[];
  }

  interface PvpRoom {
    id: string;
    subMode: 'manager' | 'apex';
    secondsLeft: number;
    totalTicks: number;
    ballPos: { x: number; y: number };
    possession: 'p1' | 'p2';
    p1: PvpSideState;
    p2: PvpSideState;
    timer: NodeJS.Timeout | null;
    apexState?: ApexMatchState;
    apexP1Input?: ApexControlInput;
    apexP2Input?: ApexControlInput;
    apexP1Actions?: Array<ApexControlInput['action']>;
    apexP2Actions?: Array<ApexControlInput['action']>;
  }

  const wss = new WebSocketServer({ noServer: true });
  const clients = new Map<string, RankedWsClient>();
  const rooms = new Map<string, PvpRoom>();

  const clampNum = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, v));

  const safeSend = (ws: WebSocket | undefined | null, payload: unknown) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(payload));
      } catch {
        // ignore closed socket race
      }
    }
  };

  // Persistent Server-Authoritative Friends & Coach Directory Store
  const MAX_FRIENDS = 50;

  interface SocialCoachRecord {
    userKey: string;
    username: string;
    clientId: string;
    teamName: string;
    teamLogo: string;
    ovr: number;
    rankLabel: string;
    rankLogoUrl: string;
    matchesPlayed: number;
    registeredAt: number;
    lastSeenAt: number;
  }

  interface SocialFriendRequest {
    id: string;
    fromKey: string;
    toKey: string;
    createdAt: number;
  }

  interface SocialDirectMessage {
    id: string;
    fromKey: string;
    toKey: string;
    fromUsername: string;
    text: string;
    createdAt: number;
  }

  interface SocialDbData {
    coaches: Record<string, SocialCoachRecord>;
    friendships: Array<[string, string]>;
    requests: SocialFriendRequest[];
    messages: SocialDirectMessage[];
  }

  const SOCIAL_DB_TMP_FILE = path.join('/tmp', 'fc_mobile_26_friends_db.json');
  const SOCIAL_DB_LOCAL_DIR = path.join(__dirname, '.data');
  const SOCIAL_DB_LOCAL_FILE = path.join(SOCIAL_DB_LOCAL_DIR, 'fc_mobile_26_friends_db.json');
  const normUserKey = (u: string) => String(u || '').trim().toLowerCase();

  const readPartialSocialDb = (filePath: string): SocialDbData | null => {
    try {
      if (fs.existsSync(filePath)) {
        const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        return {
          coaches: parsed?.coaches && typeof parsed.coaches === 'object' ? parsed.coaches : {},
          friendships: Array.isArray(parsed?.friendships) ? parsed.friendships : [],
          requests: Array.isArray(parsed?.requests) ? parsed.requests : [],
          messages: Array.isArray(parsed?.messages) ? parsed.messages : [],
        };
      }
    } catch {
      // ignore corrupted file
    }
    return null;
  };

  const loadSocialDb = (): SocialDbData => {
    const merged: SocialDbData = {
      coaches: {},
      friendships: [],
      requests: [],
      messages: [],
    };
    const sources = [
      readPartialSocialDb(SOCIAL_DB_LOCAL_FILE),
      readPartialSocialDb(SOCIAL_DB_TMP_FILE),
    ].filter((s): s is SocialDbData => Boolean(s));

    for (const src of sources) {
      for (const [k, rec] of Object.entries(src.coaches)) {
        if (!rec || !rec.username) continue;
        // Skip legacy placeholder key 'hlv_tanthu' if un-disambiguated
        if (k === 'hlv_tanthu' && (!rec.clientId || rec.clientId === 'FC-DEV-88492')) {
          continue;
        }
        const existing = merged.coaches[k];
        if (!existing || (rec.lastSeenAt || 0) >= (existing.lastSeenAt || 0)) {
          merged.coaches[k] = {
            ...rec,
            matchesPlayed: typeof rec.matchesPlayed === 'number' ? rec.matchesPlayed : 0,
            registeredAt: rec.registeredAt || rec.lastSeenAt || Date.now(),
          };
        }
      }
      for (const pair of src.friendships) {
        if (
          Array.isArray(pair) &&
          pair.length === 2 &&
          !merged.friendships.some(
            ([a, b]) =>
              (a === pair[0] && b === pair[1]) || (a === pair[1] && b === pair[0])
          )
        ) {
          merged.friendships.push([pair[0], pair[1]]);
        }
      }
      for (const req of src.requests) {
        if (req?.id && !merged.requests.some((r) => r.id === req.id)) {
          merged.requests.push(req);
        }
      }
      for (const m of src.messages) {
        if (m?.id && !merged.messages.some((em) => em.id === m.id)) {
          merged.messages.push(m);
        }
      }
    }
    return merged;
  };

  const socialDb: SocialDbData = loadSocialDb();
  const saveSocialDb = () => {
    if (socialDb.messages.length > 500) {
      socialDb.messages = socialDb.messages.slice(-500);
    }
    const serialized = JSON.stringify(socialDb);
    try {
      fs.writeFileSync(SOCIAL_DB_TMP_FILE, serialized, 'utf8');
    } catch {
      // ignore /tmp write race
    }
    try {
      fs.mkdirSync(SOCIAL_DB_LOCAL_DIR, { recursive: true });
      fs.writeFileSync(SOCIAL_DB_LOCAL_FILE, serialized, 'utf8');
    } catch {
      // ignore readonly fs in restricted prod environments
    }
  };

  const resolveEffectiveUsername = (
    rawUsername?: string,
    rawClientId?: string
  ): string => {
    const cleanName = String(rawUsername || '').trim();
    const cleanClient = String(rawClientId || '').trim();
    if (
      (!cleanName || normUserKey(cleanName) === 'hlv_tanthu') &&
      cleanClient &&
      cleanClient !== 'FC-DEV-88492'
    ) {
      return `HLV_${cleanClient.slice(-4)}`;
    }
    return cleanName;
  };

  const upsertSocialCoach = (
    profile: (Partial<RankedQueueProfile> & { matchesPlayed?: number }) | undefined | null
  ) => {
    if (!profile) return null;
    const effectiveName = resolveEffectiveUsername(profile.username, profile.clientId);
    if (!effectiveName) return null;
    const key = normUserKey(effectiveName);
    if (!key) return null;
    const prev = socialDb.coaches[key];
    const now = Date.now();
    const incomingMatches =
      typeof profile.matchesPlayed === 'number' && Number.isFinite(profile.matchesPlayed)
        ? Math.max(0, Math.floor(profile.matchesPlayed))
        : undefined;
    const next: SocialCoachRecord = {
      userKey: key,
      username: effectiveName,
      clientId: String(profile.clientId || prev?.clientId || effectiveName).trim(),
      teamName: String(profile.teamName || prev?.teamName || 'Premier FC').trim(),
      teamLogo: String(
        profile.teamLogo ||
          prev?.teamLogo ||
          '/assets/aistudio/logo_t_p_s__c_p_1_5beda3ca.png'
      ),
      ovr: Number(profile.ovr) || prev?.ovr || 74,
      rankLabel: String(profile.rankLabel || prev?.rankLabel || 'Tập Sự · Cấp 1'),
      rankLogoUrl: String(
        profile.rankLogoUrl ||
          prev?.rankLogoUrl ||
          '/assets/aistudio/logo_t_p_s__c_p_1_5beda3ca.png'
      ),
      matchesPlayed:
        incomingMatches !== undefined
          ? Math.max(prev?.matchesPlayed ?? 0, incomingMatches)
          : prev?.matchesPlayed ?? 0,
      registeredAt: prev?.registeredAt || now,
      lastSeenAt: now,
    };
    socialDb.coaches[key] = next;
    saveSocialDb();
    return next;
  };

  const enrichCoachWithPresence = (record: SocialCoachRecord) => {
    let liveConnId: string | null = null;
    let inQueue = false;
    let inMatch = false;
    for (const c of clients.values()) {
      if (
        c.ws.readyState === WebSocket.OPEN &&
        c.profile &&
        normUserKey(
          resolveEffectiveUsername(c.profile.username, c.profile.clientId)
        ) === record.userKey
      ) {
        liveConnId = c.id;
        inQueue = c.inQueue;
        inMatch = Boolean(c.roomId);
        break;
      }
    }
    return {
      ...record,
      matchesPlayed: record.matchesPlayed ?? 0,
      online: Boolean(liveConnId),
      connId: liveConnId,
      inQueue,
      inMatch,
    };
  };

  const areFriends = (k1: string, k2: string) =>
    socialDb.friendships.some(
      ([a, b]) => (a === k1 && b === k2) || (a === k2 && b === k1)
    );

  const countFriendsOf = (userKey: string): number => {
    const set = new Set<string>();
    for (const [a, b] of socialDb.friendships) {
      if (a === userKey && socialDb.coaches[b]) set.add(b);
      else if (b === userKey && socialDb.coaches[a]) set.add(a);
    }
    return set.size;
  };

  const notifyUserKeyWs = (targetKey: string, payload: unknown) => {
    for (const c of clients.values()) {
      if (
        c.ws.readyState === WebSocket.OPEN &&
        c.profile &&
        normUserKey(
          resolveEffectiveUsername(c.profile.username, c.profile.clientId)
        ) === targetKey
      ) {
        safeSend(c.ws, payload);
      }
    }
  };

  const buildFriendsSnapshotFor = (rawUsername: string, rawClientId?: string) => {
    const meKey = normUserKey(resolveEffectiveUsername(rawUsername, rawClientId));
    const friendKeys = new Set<string>();
    for (const [a, b] of socialDb.friendships) {
      if (a === meKey) friendKeys.add(b);
      else if (b === meKey) friendKeys.add(a);
    }

    const friends = Array.from(friendKeys)
      .map((fk) => socialDb.coaches[fk])
      .filter((r): r is SocialCoachRecord => Boolean(r))
      .map(enrichCoachWithPresence)
      .sort((a, b) => Number(b.online) - Number(a.online) || b.ovr - a.ovr)
      .slice(0, MAX_FRIENDS);

    const incomingRequests = socialDb.requests
      .filter((req) => req.toKey === meKey && socialDb.coaches[req.fromKey])
      .map((req) => ({
        id: req.id,
        createdAt: req.createdAt,
        from: enrichCoachWithPresence(socialDb.coaches[req.fromKey]),
      }))
      .sort((a, b) => b.createdAt - a.createdAt);

    const outgoingRequests = socialDb.requests
      .filter((req) => req.fromKey === meKey && socialDb.coaches[req.toKey])
      .map((req) => ({
        id: req.id,
        createdAt: req.createdAt,
        to: enrichCoachWithPresence(socialDb.coaches[req.toKey]),
      }))
      .sort((a, b) => b.createdAt - a.createdAt);

    // Include ALL registered coaches on server — including coaches with 0 matches played ("huấn luyện viên chưa chơi") and offline coaches
    const allServerCoaches = Object.values(socialDb.coaches)
      .filter((r) => r.userKey !== meKey)
      .map(enrichCoachWithPresence)
      .sort(
        (a, b) =>
          Number(b.online) - Number(a.online) ||
          b.lastSeenAt - a.lastSeenAt ||
          b.ovr - a.ovr
      )
      .slice(0, 500);

    const messages = socialDb.messages
      .filter((m) => m.fromKey === meKey || m.toKey === meKey)
      .slice(-120);

    return {
      ok: true,
      maxFriends: MAX_FRIENDS,
      totalServerCoaches: Object.keys(socialDb.coaches).length,
      friends,
      incomingRequests,
      outgoingRequests,
      directory: allServerCoaches,
      messages,
    };
  };

  app.post('/api/friends/sync', (req, res) => {
    const { profile } = req.body as {
      profile?: Partial<RankedQueueProfile> & { matchesPlayed?: number };
    };
    const saved = upsertSocialCoach(profile);
    if (!saved) {
      res.status(400).json({ ok: false, message: 'Thiếu thông tin HLV' });
      return;
    }
    res.status(200).json(buildFriendsSnapshotFor(saved.username, saved.clientId));
  });

  app.get('/api/friends/search', (req, res) => {
    const meKey = normUserKey(String(req.query.me || ''));
    const q = normUserKey(String(req.query.q || ''));
    const results = Object.values(socialDb.coaches)
      .filter((r) => {
        if (r.userKey === meKey) return false;
        if (!q) return true;
        return (
          r.userKey.includes(q) ||
          r.teamName.toLowerCase().includes(q) ||
          r.clientId.toLowerCase().includes(q)
        );
      })
      .map(enrichCoachWithPresence)
      .sort((a, b) => Number(b.online) - Number(a.online) || b.ovr - a.ovr)
      .slice(0, 100);
    res.status(200).json({ ok: true, results });
  });

  app.post('/api/friends/request', (req, res) => {
    const { fromProfile, targetUsername } = req.body as {
      fromProfile?: Partial<RankedQueueProfile> & { matchesPlayed?: number };
      targetUsername?: string;
    };
    if (!fromProfile?.username || !targetUsername) {
      res.status(400).json({ ok: false, message: 'Vui lòng nhập tên HLV cần kết bạn!' });
      return;
    }
    const sender = upsertSocialCoach(fromProfile);
    if (!sender) {
      res.status(400).json({ ok: false, message: 'Hồ sơ HLV không hợp lệ.' });
      return;
    }

    const qTarget = normUserKey(targetUsername);
    const targetCoach =
      socialDb.coaches[qTarget] ||
      Object.values(socialDb.coaches).find(
        (c) => c.clientId.toLowerCase() === qTarget || c.username.toLowerCase() === qTarget
      );

    if (!targetCoach) {
      res.status(404).json({
        ok: false,
        message: 'Không tìm thấy HLV này trên máy chủ. Hãy kiểm tra lại Tên HLV hoặc Mã Thiết Bị!',
      });
      return;
    }

    if (targetCoach.userKey === sender.userKey) {
      res.status(400).json({ ok: false, message: 'Không thể tự kết bạn với chính mình!' });
      return;
    }

    if (areFriends(sender.userKey, targetCoach.userKey)) {
      res.status(200).json({
        ...buildFriendsSnapshotFor(sender.username, sender.clientId),
        notice: `Bạn và HLV ${targetCoach.username} đã là bạn bè!`,
      });
      return;
    }

    if (countFriendsOf(sender.userKey) >= MAX_FRIENDS) {
      res.status(400).json({
        ok: false,
        message: `Danh sách bạn bè của bạn đã đạt tối đa ${MAX_FRIENDS}/${MAX_FRIENDS} người!`,
      });
      return;
    }

    if (countFriendsOf(targetCoach.userKey) >= MAX_FRIENDS) {
      res.status(400).json({
        ok: false,
        message: `Danh sách bạn bè của HLV ${targetCoach.username} đã đầy (${MAX_FRIENDS}/${MAX_FRIENDS})!`,
      });
      return;
    }

    // Check if target already sent a request to sender -> auto-accept!
    const reverseIdx = socialDb.requests.findIndex(
      (r) => r.fromKey === targetCoach.userKey && r.toKey === sender.userKey
    );
    if (reverseIdx >= 0) {
      socialDb.requests.splice(reverseIdx, 1);
      socialDb.friendships.push([sender.userKey, targetCoach.userKey]);
      saveSocialDb();
      notifyUserKeyWs(targetCoach.userKey, {
        type: 'friends:updated',
        message: `HLV ${sender.username} đã trở thành bạn bè của bạn!`,
      });
      res.status(200).json({
        ...buildFriendsSnapshotFor(sender.username, sender.clientId),
        notice: `Đã kết bạn thành công với HLV ${targetCoach.username}!`,
      });
      return;
    }

    const existing = socialDb.requests.find(
      (r) => r.fromKey === sender.userKey && r.toKey === targetCoach.userKey
    );
    if (!existing) {
      socialDb.requests.push({
        id: `freq_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        fromKey: sender.userKey,
        toKey: targetCoach.userKey,
        createdAt: Date.now(),
      });
      saveSocialDb();
      notifyUserKeyWs(targetCoach.userKey, {
        type: 'friends:request_received',
        fromUsername: sender.username,
        fromTeamName: sender.teamName,
        fromOvr: sender.ovr,
      });
    }

    res.status(200).json({
      ...buildFriendsSnapshotFor(sender.username, sender.clientId),
      notice: `Đã gửi lời mời kết bạn tới HLV ${targetCoach.username}!`,
    });
  });

  app.post('/api/friends/respond', (req, res) => {
    const { username, requestId, action } = req.body as {
      username?: string;
      requestId?: string;
      action?: 'accept' | 'decline' | 'cancel';
    };
    const meKey = normUserKey(username || '');
    if (!meKey || !requestId || !action) {
      res.status(400).json({ ok: false, message: 'Yêu cầu không hợp lệ.' });
      return;
    }
    const idx = socialDb.requests.findIndex((r) => r.id === requestId);
    if (idx >= 0) {
      const reqItem = socialDb.requests[idx];
      if (action === 'accept' && reqItem.toKey === meKey) {
        if (countFriendsOf(meKey) >= MAX_FRIENDS) {
          res.status(400).json({
            ok: false,
            message: `Danh sách bạn bè của bạn đã đạt tối đa ${MAX_FRIENDS}/${MAX_FRIENDS} người!`,
          });
          return;
        }
        if (countFriendsOf(reqItem.fromKey) >= MAX_FRIENDS) {
          res.status(400).json({
            ok: false,
            message: `Danh sách bạn bè của HLV đối phương đã đầy (${MAX_FRIENDS}/${MAX_FRIENDS})!`,
          });
          return;
        }
        socialDb.requests.splice(idx, 1);
        if (!areFriends(reqItem.fromKey, reqItem.toKey)) {
          socialDb.friendships.push([reqItem.fromKey, reqItem.toKey]);
        }
        saveSocialDb();
        const meCoach = socialDb.coaches[meKey];
        notifyUserKeyWs(reqItem.fromKey, {
          type: 'friends:updated',
          message: `HLV ${meCoach?.username || username} đã chấp nhận lời mời kết bạn!`,
        });
      } else if (
        (action === 'decline' && reqItem.toKey === meKey) ||
        (action === 'cancel' && reqItem.fromKey === meKey)
      ) {
        const otherKey = action === 'decline' ? reqItem.fromKey : reqItem.toKey;
        socialDb.requests.splice(idx, 1);
        saveSocialDb();
        notifyUserKeyWs(otherKey, { type: 'friends:updated' });
      }
    }
    res.status(200).json(buildFriendsSnapshotFor(username || ''));
  });

  app.post('/api/friends/remove', (req, res) => {
    const { username, friendUsername } = req.body as {
      username?: string;
      friendUsername?: string;
    };
    const meKey = normUserKey(username || '');
    const fKey = normUserKey(friendUsername || '');
    socialDb.friendships = socialDb.friendships.filter(
      ([a, b]) => !((a === meKey && b === fKey) || (a === fKey && b === meKey))
    );
    saveSocialDb();
    notifyUserKeyWs(fKey, { type: 'friends:updated' });
    res.status(200).json(buildFriendsSnapshotFor(username || ''));
  });

  app.post('/api/friends/message', (req, res) => {
    const { fromUsername, toUsername, text } = req.body as {
      fromUsername?: string;
      toUsername?: string;
      text?: string;
    };
    const fromKey = normUserKey(fromUsername || '');
    const toKey = normUserKey(toUsername || '');
    const cleanText = String(text || '').trim().slice(0, 240);
    if (!fromKey || !toKey || !cleanText) {
      res.status(400).json({ ok: false, message: 'Nội dung tin nhắn trống.' });
      return;
    }
    const msgObj: SocialDirectMessage = {
      id: `fmsg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      fromKey,
      toKey,
      fromUsername: String(fromUsername).trim(),
      text: cleanText,
      createdAt: Date.now(),
    };
    socialDb.messages.push(msgObj);
    saveSocialDb();
    notifyUserKeyWs(toKey, {
      type: 'friends:message_received',
      message: msgObj,
    });
    res.status(200).json(buildFriendsSnapshotFor(fromUsername || ''));
  });

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    const publicPath = path.resolve(__dirname, 'public');

    // Serve publicPath first so newly uploaded untouched assets resolve immediately
    if (fs.existsSync(publicPath)) {
      app.use(
        express.static(publicPath, {
          maxAge: '1d',
        })
      );
    }
    if (fs.existsSync(distPath)) {
      const gzipCache = new Map<string, { contentType: string; gz: Buffer }>();
      const mimeMap: Record<string, string> = {
        '.js': 'application/javascript; charset=utf-8',
        '.mjs': 'application/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.html': 'text/html; charset=utf-8',
        '.svg': 'image/svg+xml; charset=utf-8',
      };
      app.use((req, res, next) => {
        if (req.method !== 'GET') return next();
        const enc = String(req.headers['accept-encoding'] || '');
        if (!enc.includes('gzip')) return next();
        const reqPath = req.path === '/' ? '/index.html' : req.path;
        const ext = path.extname(reqPath).toLowerCase();
        const contentType = mimeMap[ext];
        if (!contentType) return next();
        const safeRel = path.normalize(reqPath).replace(/^(\.\.(\/|\\|$))+/, '');
        const fullFile = path.join(distPath, safeRel);
        if (
          !fullFile.startsWith(distPath) ||
          !fs.existsSync(fullFile) ||
          !fs.statSync(fullFile).isFile()
        ) {
          return next();
        }
        try {
          let cached = gzipCache.get(fullFile);
          if (!cached) {
            const raw = fs.readFileSync(fullFile);
            cached = { contentType, gz: zlib.gzipSync(raw, { level: 9 }) };
            gzipCache.set(fullFile, cached);
          }
          res.setHeader('Content-Type', cached.contentType);
          res.setHeader('Content-Encoding', 'gzip');
          res.setHeader('Vary', 'Accept-Encoding');
          res.setHeader(
            'Cache-Control',
            ext === '.html' ? 'no-cache' : 'public, max-age=604800'
          );
          res.setHeader('Content-Length', String(cached.gz.length));
          return res.status(200).send(cached.gz);
        } catch {
          return next();
        }
      });
      app.use(
        express.static(distPath, {
          maxAge: '7d',
        })
      );
    }

    app.use((_req, res) => {
      const indexFile = path.join(distPath, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Application build not found.');
      }
    });
  }

  const httpServer = http.createServer(app);

  interface PendingRankedInvite {
    id: string;
    fromConnId: string;
    targetConnId: string | 'broadcast';
    reason: 'direct' | 'queue';
    createdAt: number;
  }

  const pendingInvites = new Map<string, PendingRankedInvite>();

  const broadcastPresence = () => {
    let queueCount = 0;
      const onlinePlayers: Array<{
      connId: string;
      clientId: string;
      username: string;
      teamName: string;
      teamLogo: string;
      ovr: number;
      rankLabel: string;
      rankLogoUrl: string;
      inQueue: boolean;
      inMatch: boolean;
      rankedSubMode: 'manager' | 'apex';
    }> = [];

    for (const c of clients.values()) {
      if (c.inQueue) queueCount += 1;
      if (c.profile && c.ws.readyState === WebSocket.OPEN) {
        onlinePlayers.push({
          connId: c.id,
          clientId: c.profile.clientId || c.id,
          username: c.profile.username,
          teamName: c.profile.teamName,
          teamLogo: c.profile.teamLogo,
          ovr: c.profile.ovr,
          rankLabel: c.profile.rankLabel,
          rankLogoUrl: c.profile.rankLogoUrl,
          inQueue: c.inQueue,
          inMatch: Boolean(c.roomId),
          rankedSubMode: c.profile.rankedSubMode === 'apex' ? 'apex' : 'manager',
        });
      }
    }
    const msg = {
      type: 'presence:update',
      onlineCount: clients.size,
      queueCount,
      onlinePlayers,
    };
    for (const c of clients.values()) {
      safeSend(c.ws, msg);
    }
  };

  const cancelInvitesFrom = (fromConnId: string) => {
    let removedAny = false;
    for (const [invId, inv] of pendingInvites.entries()) {
      if (inv.fromConnId === fromConnId) {
        pendingInvites.delete(invId);
        removedAny = true;
      }
    }
    if (removedAny) {
      for (const c of clients.values()) {
        if (c.id !== fromConnId) {
          safeSend(c.ws, { type: 'invite:cancelled', fromConnId });
        }
      }
    }
  };

  const buildInitialEntities = (
    starters: RankedQueueProfile['starters'],
    side: 'p1' | 'p2'
  ): RankedPitchPlayer[] => {
    const fallbackSlots = [
      { pos: 'LW', x: 70, y: 20 },
      { pos: 'ST', x: 76, y: 50 },
      { pos: 'RW', x: 70, y: 80 },
      { pos: 'CM', x: 52, y: 30 },
      { pos: 'CDM', x: 42, y: 50 },
      { pos: 'CM', x: 52, y: 70 },
      { pos: 'LB', x: 26, y: 16 },
      { pos: 'CB', x: 24, y: 38 },
      { pos: 'CB', x: 24, y: 62 },
      { pos: 'RB', x: 26, y: 84 },
      { pos: 'GK', x: 7, y: 50 },
    ];
    return Array.from({ length: 11 }, (_, idx) => {
      const s = starters[idx];
      const fb = fallbackSlots[idx] || fallbackSlots[0];
      const isGk = Boolean(s?.isGk || idx === 10 || s?.pos === 'GK');
      const rawX = typeof s?.baseX === 'number' ? s.baseX : fb.x;
      const rawY = typeof s?.baseY === 'number' ? s.baseY : fb.y;
      const x = side === 'p1' ? rawX : 100 - rawX;
      const y = side === 'p1' ? rawY : 100 - rawY;
      return {
        id: `${side}_${idx}_${s?.id || idx}`,
        cardId: s?.cardId || s?.id,
        name: s?.name || `Cầu thủ ${idx + 1}`,
        shortName: s?.shortName || s?.name?.split(' ').pop() || `CT${idx + 1}`,
        pos: s?.pos || fb.pos,
        ovr: s?.ovr || 80,
        x,
        y,
        stamina: 100,
        isGk,
      };
    });
  };

  const toApexInitStarters = (starters: RankedQueueProfile['starters']): ApexPlayerInit[] => {
    const fallbackSlots = [
      { pos: 'LW', x: 70, y: 20, num: 11 },
      { pos: 'ST', x: 76, y: 50, num: 9 },
      { pos: 'RW', x: 70, y: 80, num: 7 },
      { pos: 'CM', x: 52, y: 30, num: 8 },
      { pos: 'CDM', x: 42, y: 50, num: 6 },
      { pos: 'CM', x: 52, y: 70, num: 10 },
      { pos: 'LB', x: 26, y: 16, num: 3 },
      { pos: 'CB', x: 24, y: 38, num: 4 },
      { pos: 'CB', x: 24, y: 62, num: 5 },
      { pos: 'RB', x: 26, y: 84, num: 2 },
      { pos: 'GK', x: 7, y: 50, num: 1 },
    ];
    return Array.from({ length: 11 }, (_, idx) => {
      const s = starters[idx];
      const fb = fallbackSlots[idx] || fallbackSlots[0];
      const isGk = Boolean(s?.isGk || idx === 10 || s?.pos === 'GK');
      const ovr = s?.ovr || 85;
      return {
        id: s?.id || `slot_${idx}`,
        name: s?.name || `Cầu thủ ${idx + 1}`,
        shortName: s?.shortName || s?.name?.split(' ').pop() || `CT${idx + 1}`,
        number: s?.number ?? fb.num,
        pos: s?.pos || fb.pos,
        ovr,
        pac: s?.pac ?? ovr,
        sho: s?.sho ?? ovr,
        pas: s?.pas ?? ovr,
        dri: s?.dri ?? ovr,
        def: s?.def ?? ovr,
        phy: s?.phy ?? ovr,
        baseX: typeof s?.baseX === 'number' ? s.baseX : fb.x,
        baseY: typeof s?.baseY === 'number' ? s.baseY : fb.y,
        isGk,
        cardId: s?.cardId,
        cardType: s?.cardType,
        league: s?.league,
        avatarUrl: s?.avatarUrl,
        customFrameUrl: s?.customFrameUrl,
        frameIncludesPortrait: s?.frameIncludesPortrait,
        club: s?.club,
        clubLogo: s?.clubLogo,
        nation: s?.nation,
        nationFlag: s?.nationFlag,
        skillMoves: s?.skillMoves,
        weakFoot: s?.weakFoot,
      };
    });
  };

  const startApexPvpRoom = (c1: RankedWsClient, c2: RankedWsClient) => {
    if (!c1.profile || !c2.profile) return;
    c1.inQueue = false;
    c2.inQueue = false;
    cancelInvitesFrom(c1.id);
    cancelInvitesFrom(c2.id);

    const roomId = `apex_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    c1.roomId = roomId;
    c2.roomId = roomId;

    const apexState = createInitialApexMatchState({
      p1Starters: toApexInitStarters(c1.profile.starters),
      p2Starters: toApexInitStarters(c2.profile.starters),
      isBotOpp: false,
      botTierIndex: Math.max(c1.profile.tierIndex ?? 1, c2.profile.tierIndex ?? 1),
    });

    const room: PvpRoom = {
      id: roomId,
      subMode: 'apex',
      secondsLeft: 90,
      totalTicks: 0,
      ballPos: { x: 50, y: 50 },
      possession: 'p1',
      p1: {
        client: c1,
        profile: c1.profile,
        mentality: 'balanced',
        pressing: 'medium',
        attackFocus: 'mixed',
        formationName: c1.profile.formationName || '4-3-3',
        score: 0,
        goalScorerCardIds: [],
        shots: 0,
        possTicks: 0,
        entities: buildInitialEntities(c1.profile.starters, 'p1'),
      },
      p2: {
        client: c2,
        profile: c2.profile,
        mentality: 'balanced',
        pressing: 'medium',
        attackFocus: 'mixed',
        formationName: c2.profile.formationName || '4-3-3',
        score: 0,
        goalScorerCardIds: [],
        shots: 0,
        possTicks: 0,
        entities: buildInitialEntities(c2.profile.starters, 'p2'),
      },
      timer: null,
      apexState,
      apexP1Input: { moveX: 0, moveY: 0, shootHold: false, action: null },
      apexP2Input: { moveX: 0, moveY: 0, shootHold: false, action: null },
      apexP1Actions: [],
      apexP2Actions: [],
    };

    rooms.set(roomId, room);
    broadcastPresence();

    safeSend(c1.ws, {
      type: 'match:found',
      roomId,
      side: 'p1',
      rankedSubMode: 'apex',
      opponent: {
        coachName: c2.profile.username,
        teamName: c2.profile.teamName,
        badgeUrl: c2.profile.teamLogo,
        ovr: c2.profile.ovr,
        rankLabel: c2.profile.rankLabel,
        rankLogoUrl: c2.profile.rankLogoUrl,
        isBot: false,
      },
    });

    safeSend(c2.ws, {
      type: 'match:found',
      roomId,
      side: 'p2',
      rankedSubMode: 'apex',
      opponent: {
        coachName: c1.profile.username,
        teamName: c1.profile.teamName,
        badgeUrl: c1.profile.teamLogo,
        ovr: c1.profile.ovr,
        rankLabel: c1.profile.rankLabel,
        rankLogoUrl: c1.profile.rankLogoUrl,
        isBot: false,
      },
    });

    setTimeout(() => {
      if (!rooms.has(roomId)) return;
      room.timer = setInterval(() => {
        const r = rooms.get(roomId);
        if (!r || !r.apexState) return;
        const st = r.apexState;

        const p1Act = r.apexP1Actions?.shift() ?? null;
        const p2Act = r.apexP2Actions?.shift() ?? null;
        const p1Raw = r.apexP1Input || { moveX: 0, moveY: 0, shootHold: false, action: null };
        const p2Raw = r.apexP2Input || { moveX: 0, moveY: 0, shootHold: false, action: null };

        // Mirror P2's screen input so P2 attacks naturally from their own projected view!
        const p1StepIn: ApexControlInput = { ...p1Raw, action: p1Act };
        const p2StepIn: ApexControlInput = {
          moveX: -p2Raw.moveX,
          moveY: -p2Raw.moveY,
          shootHold: p2Raw.shootHold,
          holdAction: p2Raw.holdAction ?? null,
          action: p2Act,
        };

        stepApexMatch(st, 0.033, p1StepIn, p2StepIn);

        const sfxList = st.sfxQueue.splice(0, st.sfxQueue.length);
        const snapForP1 = { ...projectApexStateForSide(st, 'p1'), sfxQueue: sfxList };
        const snapForP2 = { ...projectApexStateForSide(st, 'p2'), sfxQueue: sfxList };

        if (r.p1.client) {
          safeSend(r.p1.client.ws, { type: 'apex:tick', state: snapForP1 });
        }
        if (r.p2.client) {
          safeSend(r.p2.client.ws, { type: 'apex:tick', state: snapForP2 });
        }

        if (st.phase === 'outro' && st.phaseTimer <= 0.04) {
          if (r.timer) clearInterval(r.timer);
          rooms.delete(roomId);
          if (r.p1.client) {
            r.p1.client.roomId = null;
            safeSend(r.p1.client.ws, {
              type: 'match:end',
              userScore: st.p1Score,
              oppScore: st.p2Score,
              userGoalScorerCardIds: st.p1GoalScorerCardIds,
            });
          }
          if (r.p2.client) {
            r.p2.client.roomId = null;
            safeSend(r.p2.client.ws, {
              type: 'match:end',
              userScore: st.p2Score,
              oppScore: st.p1Score,
              userGoalScorerCardIds: st.p2GoalScorerCardIds,
            });
          }
          broadcastPresence();
        }
      }, 33);
    }, 900);
  };

  const startPvpRoom = (c1: RankedWsClient, c2: RankedWsClient) => {
    if (!c1.profile || !c2.profile) return;
    if (c1.profile.rankedSubMode === 'apex' || c2.profile.rankedSubMode === 'apex') {
      startApexPvpRoom(c1, c2);
      return;
    }
    c1.inQueue = false;
    c2.inQueue = false;
    cancelInvitesFrom(c1.id);
    cancelInvitesFrom(c2.id);

    const roomId = `room_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    c1.roomId = roomId;
    c2.roomId = roomId;

    const room: PvpRoom = {
      id: roomId,
      subMode: 'manager',
      secondsLeft: 60,
      totalTicks: 0,
      ballPos: { x: 50, y: 50 },
      possession: Math.random() < 0.5 ? 'p1' : 'p2',
      p1: {
        client: c1,
        profile: c1.profile,
        mentality: 'balanced',
        pressing: 'medium',
        attackFocus: 'mixed',
        formationName: c1.profile.formationName || '4-3-3 Tấn Công',
        score: 0,
        goalScorerCardIds: [],
        shots: 0,
        possTicks: 0,
        entities: buildInitialEntities(c1.profile.starters, 'p1'),
      },
      p2: {
        client: c2,
        profile: c2.profile,
        mentality: 'balanced',
        pressing: 'medium',
        attackFocus: 'mixed',
        formationName: c2.profile.formationName || '4-3-3 Tấn Công',
        score: 0,
        goalScorerCardIds: [],
        shots: 0,
        possTicks: 0,
        entities: buildInitialEntities(c2.profile.starters, 'p2'),
      },
      timer: null,
    };

    rooms.set(roomId, room);
    broadcastPresence();

    safeSend(c1.ws, {
      type: 'match:found',
      roomId,
      side: 'p1',
      opponent: {
        coachName: c2.profile.username,
        teamName: c2.profile.teamName,
        badgeUrl: c2.profile.teamLogo,
        ovr: c2.profile.ovr,
        rankLabel: c2.profile.rankLabel,
        rankLogoUrl: c2.profile.rankLogoUrl,
        isBot: false,
      },
    });

    safeSend(c2.ws, {
      type: 'match:found',
      roomId,
      side: 'p2',
      opponent: {
        coachName: c1.profile.username,
        teamName: c1.profile.teamName,
        badgeUrl: c1.profile.teamLogo,
        ovr: c1.profile.ovr,
        rankLabel: c1.profile.rankLabel,
        rankLogoUrl: c1.profile.rankLogoUrl,
        isBot: false,
      },
    });

    // Brief 2-second VS splash before 60s kick-off
    setTimeout(() => {
      if (!rooms.has(roomId)) return;
      room.timer = setInterval(() => {
        const r = rooms.get(roomId);
        if (!r) return;

        r.secondsLeft = Math.max(0, r.secondsLeft - 1);
        r.totalTicks += 1;
        const minute = Math.min(
          90,
          Math.max(1, Math.ceil(((60 - r.secondsLeft) / 60) * 90))
        );

        const p1Avg =
          r.p1.entities.reduce((s, e) => s + e.ovr * (0.78 + 0.22 * (e.stamina / 100)), 0) /
          11;
        const p2Avg =
          r.p2.entities.reduce((s, e) => s + e.ovr * (0.78 + 0.22 * (e.stamina / 100)), 0) /
          11;

        const p1Att =
          p1Avg +
          (r.p1.mentality === 'attacking' ? 2.5 : r.p1.mentality === 'defensive' ? -2 : 0);
        const p1Def =
          p1Avg +
          (r.p1.mentality === 'defensive' ? 2.8 : r.p1.mentality === 'attacking' ? -2 : 0) +
          (r.p1.pressing === 'high' ? 1.2 : 0);

        const p2Att =
          p2Avg +
          (r.p2.mentality === 'attacking' ? 2.5 : r.p2.mentality === 'defensive' ? -2 : 0);
        const p2Def =
          p2Avg +
          (r.p2.mentality === 'defensive' ? 2.8 : r.p2.mentality === 'attacking' ? -2 : 0) +
          (r.p2.pressing === 'high' ? 1.2 : 0);

        const ovrDelta = (p1Att + p1Def) * 0.5 - (p2Att + p2Def) * 0.5;
        const p1WinBallProb = clampNum(0.5 + ovrDelta * 0.025, 0.16, 0.84);

        if (Math.random() < 0.46) {
          r.possession = Math.random() < p1WinBallProb ? 'p1' : 'p2';
        }
        if (r.possession === 'p1') r.p1.possTicks += 1;
        else r.p2.possTicks += 1;

        let commentText = '';
        let commentTone: 'normal' | 'danger' | 'goal' | 'tactic' = 'normal';
        let goalSide: 'p1' | 'p2' | null = null;
        let goalScorer = '';

        if (r.possession === 'p1') {
          // p1 attacks toward x = 92
          const push =
            (r.p1.mentality === 'attacking' ? 15 : r.p1.mentality === 'balanced' ? 11.5 : 8.5) +
            clampNum(ovrDelta * 0.3, -3.5, 4.5);
          r.ballPos.x = clampNum(r.ballPos.x + push + (Math.random() * 8 - 3), 15, 92);
          if (r.p1.attackFocus === 'wings') {
            const wing = Math.random() < 0.5 ? 18 : 82;
            r.ballPos.y = clampNum(r.ballPos.y * 0.4 + wing * 0.6, 10, 90);
          } else if (r.p1.attackFocus === 'center') {
            r.ballPos.y = clampNum(r.ballPos.y * 0.45 + 50 * 0.55 + (Math.random() * 14 - 7), 24, 76);
          } else {
            r.ballPos.y = clampNum(r.ballPos.y + (Math.random() * 24 - 12), 14, 86);
          }

          const attackers = r.p1.entities.filter((e) => !e.isGk);
          const carrier = attackers[Math.floor(Math.random() * Math.min(5, attackers.length))] || r.p1.entities[0];
          const p2Gk = r.p2.entities.find((e) => e.isGk) || r.p2.entities[10];

          const shootThreshold = r.p1.attackFocus === 'long_shot' ? 68 : 77;
          if (
            r.ballPos.x >= shootThreshold &&
            Math.random() < clampNum(0.46 + ovrDelta * 0.02, 0.2, 0.75)
          ) {
            r.p1.shots += 1;
            const goalProb = clampNum(
              0.27 + (carrier.ovr * 0.5 + p1Att * 0.5 - ((p2Gk?.ovr || p2Def) * 0.55 + p2Def * 0.45)) * 0.022,
              0.08,
              0.72
            );
            if (Math.random() < goalProb) {
              r.p1.score += 1;
              if (carrier.cardId || carrier.id) {
                r.p1.goalScorerCardIds.push(carrier.cardId || carrier.id);
              }
              goalSide = 'p1';
              goalScorer = `${carrier.shortName} (${minute}')`;
              commentText = `VÀOOOOO!! ${carrier.name} (${r.p1.profile.teamName}) tung cú sút cháy lưới hạ gục ${p2Gk?.shortName || r.p2.profile.teamName}!`;
              commentTone = 'goal';
              r.ballPos = { x: 50, y: 50 };
              r.possession = 'p2';
            } else {
              commentText = `CỨU THUA! Thủ môn ${p2Gk?.shortName || r.p2.profile.teamName} cản phá xuất thần cú sút của ${carrier.shortName}!`;
              commentTone = 'danger';
              r.ballPos = { x: 88, y: clampNum(r.ballPos.y, 36, 64) };
              r.possession = 'p2';
            }
          } else {
            commentText = `${carrier.shortName} (${r.p1.profile.teamName}) đang phối hợp áp sát vòng cấm ${r.p2.profile.teamName}.`;
          }
        } else {
          // p2 attacks toward x = 8
          const push =
            (r.p2.mentality === 'attacking' ? 15 : r.p2.mentality === 'balanced' ? 11.5 : 8.5) +
            clampNum(-ovrDelta * 0.3, -3.5, 4.5);
          r.ballPos.x = clampNum(r.ballPos.x - push - (Math.random() * 8 - 3), 8, 85);
          if (r.p2.attackFocus === 'wings') {
            const wing = Math.random() < 0.5 ? 18 : 82;
            r.ballPos.y = clampNum(r.ballPos.y * 0.4 + wing * 0.6, 10, 90);
          } else if (r.p2.attackFocus === 'center') {
            r.ballPos.y = clampNum(r.ballPos.y * 0.45 + 50 * 0.55 + (Math.random() * 14 - 7), 24, 76);
          } else {
            r.ballPos.y = clampNum(r.ballPos.y + (Math.random() * 24 - 12), 14, 86);
          }

          const attackers = r.p2.entities.filter((e) => !e.isGk);
          const carrier = attackers[Math.floor(Math.random() * Math.min(5, attackers.length))] || r.p2.entities[0];
          const p1Gk = r.p1.entities.find((e) => e.isGk) || r.p1.entities[10];

          const shootThreshold = r.p2.attackFocus === 'long_shot' ? 32 : 23;
          if (
            r.ballPos.x <= shootThreshold &&
            Math.random() < clampNum(0.46 - ovrDelta * 0.02, 0.2, 0.75)
          ) {
            r.p2.shots += 1;
            const goalProb = clampNum(
              0.27 + (carrier.ovr * 0.5 + p2Att * 0.5 - ((p1Gk?.ovr || p1Def) * 0.55 + p1Def * 0.45)) * 0.022,
              0.08,
              0.72
            );
            if (Math.random() < goalProb) {
              r.p2.score += 1;
              if (carrier.cardId || carrier.id) {
                r.p2.goalScorerCardIds.push(carrier.cardId || carrier.id);
              }
              goalSide = 'p2';
              goalScorer = `${carrier.shortName} (${minute}')`;
              commentText = `VÀOOOOO!! ${carrier.name} (${r.p2.profile.teamName}) dứt điểm lạnh lùng tung lưới ${r.p1.profile.teamName}!`;
              commentTone = 'goal';
              r.ballPos = { x: 50, y: 50 };
              r.possession = 'p1';
            } else {
              commentText = `CỨU THUA! Thủ môn ${p1Gk?.shortName || r.p1.profile.teamName} bay người từ chối bàn thắng của ${carrier.shortName}!`;
              commentTone = 'danger';
              r.ballPos = { x: 12, y: clampNum(r.ballPos.y, 36, 64) };
              r.possession = 'p1';
            }
          } else {
            commentText = `${carrier.shortName} (${r.p2.profile.teamName}) tổ chức lên bóng tốc độ cao về phía khung thành ${r.p1.profile.teamName}.`;
          }
        }

        // Move entities for p1 & p2
        const shiftP1 =
          (r.p1.mentality === 'attacking' ? 9 : r.p1.mentality === 'defensive' ? -7 : 0) +
          (r.possession === 'p1' ? 12 : -8);
        r.p1.entities = r.p1.entities.map((ent, idx) => {
          if (ent.isGk || idx === 10) {
            return {
              ...ent,
              x: clampNum(r.ballPos.x < 35 ? 11 : 6, 3.5, 13.5),
              y: clampNum(50 + (r.ballPos.y - 50) * 0.3, 34, 66),
            };
          }
          const base = r.p1.profile.starters[idx] || { baseX: 45, baseY: 50 };
          return {
            ...ent,
            x: clampNum(base.baseX + shiftP1 + (r.ballPos.x - base.baseX) * 0.24 + (Math.random() * 5 - 2.5), 16, 92),
            y: clampNum(base.baseY + (r.ballPos.y - base.baseY) * 0.22 + (Math.random() * 5 - 2.5), 8, 92),
            stamina: Math.max(25, ent.stamina - (r.p1.pressing === 'high' ? 1.05 : 0.7)),
          };
        });

        const shiftP2 =
          (r.p2.mentality === 'attacking' ? -9 : r.p2.mentality === 'defensive' ? 7 : 0) +
          (r.possession === 'p2' ? -12 : 8);
        r.p2.entities = r.p2.entities.map((ent, idx) => {
          if (ent.isGk || idx === 10) {
            return {
              ...ent,
              x: clampNum(r.ballPos.x > 65 ? 89 : 94, 86.5, 96.5),
              y: clampNum(50 + (r.ballPos.y - 50) * 0.3, 34, 66),
            };
          }
          const sBase = r.p2.profile.starters[idx] || { baseX: 45, baseY: 50 };
          const mirrorX = 100 - sBase.baseX;
          const mirrorY = 100 - sBase.baseY;
          return {
            ...ent,
            x: clampNum(mirrorX + shiftP2 + (r.ballPos.x - mirrorX) * 0.24 + (Math.random() * 5 - 2.5), 8, 84),
            y: clampNum(mirrorY + (r.ballPos.y - mirrorY) * 0.22 + (Math.random() * 5 - 2.5), 8, 92),
            stamina: Math.max(25, ent.stamina - (r.p2.pressing === 'high' ? 1.05 : 0.7)),
          };
        });

        const p1PossPct = Math.round((r.p1.possTicks / Math.max(1, r.totalTicks)) * 100);

        // Send perspective-accurate state to P1
        if (r.p1.client) {
          safeSend(r.p1.client.ws, {
            type: 'match:tick',
            secondsLeft: r.secondsLeft,
            minute,
            userScore: r.p1.score,
            oppScore: r.p2.score,
            userShots: r.p1.shots,
            oppShots: r.p2.shots,
            userPossessionPct: p1PossPct,
            ballPos: r.ballPos,
            userEntities: r.p1.entities,
            oppEntities: r.p2.entities,
            commentary: commentText
              ? { id: `tk_${r.secondsLeft}`, minute, text: commentText, tone: commentTone }
              : null,
            goalBanner: goalSide
              ? { scorer: goalScorer, side: goalSide === 'p1' ? 'user' : 'opp' }
              : null,
          });
        }

        // Send mirrored perspective-accurate state to P2 (so P2 also sees themselves on the left!)
        if (r.p2.client) {
          safeSend(r.p2.client.ws, {
            type: 'match:tick',
            secondsLeft: r.secondsLeft,
            minute,
            userScore: r.p2.score,
            oppScore: r.p1.score,
            userShots: r.p2.shots,
            oppShots: r.p1.shots,
            userPossessionPct: 100 - p1PossPct,
            ballPos: { x: 100 - r.ballPos.x, y: 100 - r.ballPos.y },
            userEntities: r.p2.entities.map((e) => ({
              ...e,
              x: 100 - e.x,
              y: 100 - e.y,
            })),
            oppEntities: r.p1.entities.map((e) => ({
              ...e,
              x: 100 - e.x,
              y: 100 - e.y,
            })),
            commentary: commentText
              ? { id: `tk_${r.secondsLeft}`, minute, text: commentText, tone: commentTone }
              : null,
            goalBanner: goalSide
              ? { scorer: goalScorer, side: goalSide === 'p2' ? 'user' : 'opp' }
              : null,
          });
        }

        if (r.secondsLeft <= 0) {
          if (r.timer) clearInterval(r.timer);
          rooms.delete(roomId);
          if (r.p1.client) {
            r.p1.client.roomId = null;
            safeSend(r.p1.client.ws, {
              type: 'match:end',
              userScore: r.p1.score,
              oppScore: r.p2.score,
              userGoalScorerCardIds: r.p1.goalScorerCardIds,
            });
          }
          if (r.p2.client) {
            r.p2.client.roomId = null;
            safeSend(r.p2.client.ws, {
              type: 'match:end',
              userScore: r.p2.score,
              oppScore: r.p1.score,
              userGoalScorerCardIds: r.p2.goalScorerCardIds,
            });
          }
        }
      }, 1000);
    }, 2000);
  };

  const tryMatchmakeQueue = () => {
    const waiting = Array.from(clients.values()).filter(
      (c) => c.inQueue && c.profile && c.ws.readyState === WebSocket.OPEN && !c.roomId
    );
    while (waiting.length >= 2) {
      const first = waiting.shift()!;
      const firstMode = first.profile?.rankedSubMode === 'apex' ? 'apex' : 'manager';
      // Ensure distinct session/user pairing within same sub-mode
      const secondIdx = waiting.findIndex(
        (w) =>
          w.id !== first.id &&
          (w.profile?.rankedSubMode === 'apex' ? 'apex' : 'manager') === firstMode
      );
      if (secondIdx === -1) continue;
      const [second] = waiting.splice(secondIdx, 1);
      startPvpRoom(first, second);
    }
  };

  wss.on('connection', (ws) => {
    const connId = `conn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const clientObj: RankedWsClient = {
      id: connId,
      ws,
      inQueue: false,
      profile: null,
      roomId: null,
    };
    clients.set(connId, clientObj);
    safeSend(ws, { type: 'welcome', connId });
    broadcastPresence();

    ws.on('message', (rawData) => {
      try {
        const msg = JSON.parse(String(rawData));
        if (!msg || typeof msg.type !== 'string') return;

        if (msg.type === 'presence:hello' && msg.profile) {
          clientObj.profile = msg.profile as RankedQueueProfile;
          upsertSocialCoach(clientObj.profile);
          broadcastPresence();
          return;
        }

        if (msg.type === 'queue:join' && msg.profile) {
          clientObj.profile = msg.profile as RankedQueueProfile;
          upsertSocialCoach(clientObj.profile);
          clientObj.inQueue = true;
          broadcastPresence();
          tryMatchmakeQueue();

          // If still waiting in queue (not immediately paired), notify idle online players with an invitation!
          if (clientObj.inQueue && !clientObj.roomId && clientObj.profile) {
            cancelInvitesFrom(clientObj.id);
            const inviteId = `inv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
            pendingInvites.set(inviteId, {
              id: inviteId,
              fromConnId: clientObj.id,
              targetConnId: 'broadcast',
              reason: 'queue',
              createdAt: Date.now(),
            });

            const invitePayload = {
              type: 'invite:received',
              inviteId,
              fromConnId: clientObj.id,
              reason: 'queue',
              createdAt: Date.now(),
              fromProfile: {
                username: clientObj.profile.username,
                teamName: clientObj.profile.teamName,
                teamLogo: clientObj.profile.teamLogo,
                ovr: clientObj.profile.ovr,
                rankLabel: clientObj.profile.rankLabel,
                rankLogoUrl: clientObj.profile.rankLogoUrl,
                rankedSubMode: clientObj.profile.rankedSubMode === 'apex' ? 'apex' : 'manager',
              },
            };

            for (const other of clients.values()) {
              if (
                other.id !== clientObj.id &&
                other.ws.readyState === WebSocket.OPEN &&
                !other.roomId &&
                !other.inQueue
              ) {
                safeSend(other.ws, invitePayload);
              }
            }
          }
          return;
        }

        if (msg.type === 'queue:leave') {
          clientObj.inQueue = false;
          cancelInvitesFrom(clientObj.id);
          broadcastPresence();
          return;
        }

        if (msg.type === 'invite:send' && msg.profile) {
          clientObj.profile = msg.profile as RankedQueueProfile;
          if (clientObj.roomId) return;

          cancelInvitesFrom(clientObj.id);
          const targetConnId =
            typeof msg.targetConnId === 'string' && msg.targetConnId
              ? msg.targetConnId
              : 'broadcast';
          const inviteId = `inv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

          pendingInvites.set(inviteId, {
            id: inviteId,
            fromConnId: clientObj.id,
            targetConnId,
            reason: 'direct',
            createdAt: Date.now(),
          });

          const invitePayload = {
            type: 'invite:received',
            inviteId,
            fromConnId: clientObj.id,
            reason: 'direct',
            createdAt: Date.now(),
            fromProfile: {
              username: clientObj.profile.username,
              teamName: clientObj.profile.teamName,
              teamLogo: clientObj.profile.teamLogo,
              ovr: clientObj.profile.ovr,
              rankLabel: clientObj.profile.rankLabel,
              rankLogoUrl: clientObj.profile.rankLogoUrl,
              rankedSubMode: clientObj.profile.rankedSubMode === 'apex' ? 'apex' : 'manager',
            },
          };

          if (targetConnId !== 'broadcast') {
            const targetClient = clients.get(targetConnId);
            if (
              targetClient &&
              targetClient.ws.readyState === WebSocket.OPEN &&
              !targetClient.roomId
            ) {
              safeSend(targetClient.ws, invitePayload);
              safeSend(clientObj.ws, {
                type: 'invite:sent',
                inviteId,
                targetUsername: targetClient.profile?.username || 'HLV Online',
              });
            } else {
              pendingInvites.delete(inviteId);
              safeSend(clientObj.ws, {
                type: 'invite:expired',
                message: 'HLV này hiện đang trong trận đấu hoặc đã ngoại tuyến.',
              });
            }
          } else {
            let sentCount = 0;
            for (const other of clients.values()) {
              if (
                other.id !== clientObj.id &&
                other.ws.readyState === WebSocket.OPEN &&
                !other.roomId
              ) {
                safeSend(other.ws, invitePayload);
                sentCount += 1;
              }
            }
            safeSend(clientObj.ws, {
              type: 'invite:sent',
              inviteId,
              targetUsername: `${sentCount} HLV đang online`,
            });
          }
          broadcastPresence();
          return;
        }

        if (msg.type === 'invite:accept' && msg.profile && typeof msg.fromConnId === 'string') {
          clientObj.profile = msg.profile as RankedQueueProfile;
          const inviter = clients.get(msg.fromConnId);
          if (
            !inviter ||
            inviter.id === clientObj.id ||
            inviter.ws.readyState !== WebSocket.OPEN ||
            inviter.roomId ||
            !inviter.profile ||
            clientObj.roomId
          ) {
            safeSend(clientObj.ws, {
              type: 'invite:expired',
              message: 'Lời mời đã hết hạn hoặc đối thủ đã vào trận khác.',
            });
            return;
          }
          startPvpRoom(inviter, clientObj);
          return;
        }

        if (msg.type === 'invite:decline' && typeof msg.fromConnId === 'string') {
          const inviter = clients.get(msg.fromConnId);
          if (inviter && inviter.ws.readyState === WebSocket.OPEN && !inviter.roomId) {
            safeSend(inviter.ws, {
              type: 'invite:declined',
              inviteId: msg.inviteId,
              byUsername: msg.byUsername || clientObj.profile?.username || 'Đối thủ',
            });
          }
          return;
        }

        if (msg.type === 'apex:input' && clientObj.roomId) {
          const room = rooms.get(clientObj.roomId);
          if (!room || room.subMode !== 'apex') return;
          const isP1 = room.p1.client?.id === clientObj.id;
          const holdAct =
            msg.holdAction === 'I' || msg.holdAction === 'J' || msg.holdAction === 'L'
              ? msg.holdAction
              : null;
          const nextIn: ApexControlInput = {
            moveX: clampNum(Number(msg.moveX) || 0, -1, 1),
            moveY: clampNum(Number(msg.moveY) || 0, -1, 1),
            shootHold: Boolean(msg.shootHold),
            holdAction: holdAct,
            action: null,
          };
          if (isP1) {
            room.apexP1Input = nextIn;
            if (msg.action) room.apexP1Actions?.push(msg.action);
          } else {
            room.apexP2Input = nextIn;
            if (msg.action) room.apexP2Actions?.push(msg.action);
          }
          return;
        }

        if (msg.type === 'match:tactic' && clientObj.roomId) {
          const room = rooms.get(clientObj.roomId);
          if (!room) return;
          const isP1 = room.p1.client?.id === clientObj.id;
          const sideState = isP1 ? room.p1 : room.p2;
          if (msg.mentality) sideState.mentality = msg.mentality;
          if (msg.pressing) sideState.pressing = msg.pressing;
          if (msg.attackFocus) sideState.attackFocus = msg.attackFocus;
          if (msg.formationName) sideState.formationName = msg.formationName;
          if (Array.isArray(msg.updatedBaseSlots)) {
            msg.updatedBaseSlots.forEach(
              (slot: { baseX: number; baseY: number; pos?: string }, idx: number) => {
                if (sideState.profile.starters[idx]) {
                  sideState.profile.starters[idx].baseX = slot.baseX;
                  sideState.profile.starters[idx].baseY = slot.baseY;
                  if (slot.pos) sideState.profile.starters[idx].pos = slot.pos;
                }
              }
            );
          }

          const minute = Math.min(
            90,
            Math.max(1, Math.ceil(((60 - room.secondsLeft) / 60) * 90))
          );
          const alertText =
            typeof msg.noticeText === 'string' && msg.noticeText.trim()
              ? msg.noticeText.trim()
              : `HLV ${sideState.profile.username} (${sideState.profile.teamName}) vừa điều chỉnh chiến thuật!`;

          if (room.p1.client) {
            safeSend(room.p1.client.ws, {
              type: 'match:tactic_alert',
              isSelf: isP1,
              coachName: sideState.profile.username,
              teamName: sideState.profile.teamName,
              minute,
              text: alertText,
            });
          }
          if (room.p2.client) {
            safeSend(room.p2.client.ws, {
              type: 'match:tactic_alert',
              isSelf: !isP1,
              coachName: sideState.profile.username,
              teamName: sideState.profile.teamName,
              minute,
              text: alertText,
            });
          }
          return;
        }

        if (msg.type === 'match:sub' && clientObj.roomId) {
          const room = rooms.get(clientObj.roomId);
          if (!room) return;
          const isP1 = room.p1.client?.id === clientObj.id;
          const sideState = isP1 ? room.p1 : room.p2;
          const slotIdx = Number(msg.slotIdx);
          if (
            Number.isInteger(slotIdx) &&
            slotIdx >= 0 &&
            slotIdx < 11 &&
            msg.inPlayer
          ) {
            const oldEnt = sideState.entities[slotIdx];
            sideState.entities[slotIdx] = {
              ...oldEnt,
              cardId: msg.inPlayer.cardId || oldEnt.cardId,
              name: msg.inPlayer.name || oldEnt.name,
              shortName:
                msg.inPlayer.shortName ||
                msg.inPlayer.name?.split(' ').pop() ||
                oldEnt.shortName,
              ovr: Number(msg.inPlayer.ovr) || oldEnt.ovr,
              stamina: 100,
            };
            const minute = Math.min(
              90,
              Math.max(1, Math.ceil(((60 - room.secondsLeft) / 60) * 90))
            );
            const subNotice = `HLV ${sideState.profile.username} thay người: ${msg.inPlayer.name} (OVR ${msg.inPlayer.ovr}) vào thay ${msg.outPlayerName || oldEnt.name}!`;
            if (room.p1.client) {
              safeSend(room.p1.client.ws, {
                type: 'match:tactic_alert',
                isSelf: isP1,
                coachName: sideState.profile.username,
                teamName: sideState.profile.teamName,
                minute,
                text: subNotice,
              });
            }
            if (room.p2.client) {
              safeSend(room.p2.client.ws, {
                type: 'match:tactic_alert',
                isSelf: !isP1,
                coachName: sideState.profile.username,
                teamName: sideState.profile.teamName,
                minute,
                text: subNotice,
              });
            }
          }
          return;
        }

        if (msg.type === 'match:emoji' && clientObj.roomId) {
          const room = rooms.get(clientObj.roomId);
          if (!room) return;
          const isP1 = room.p1.client?.id === clientObj.id;
          const sideState = isP1 ? room.p1 : room.p2;
          const rawEmoji = typeof msg.emoji === 'string' ? msg.emoji.trim().slice(0, 12) : '';
          const rawLabel = typeof msg.label === 'string' ? msg.label.trim().slice(0, 36) : '';
          if (!rawEmoji) return;

          const minute = Math.min(
            90,
            Math.max(1, Math.ceil(((60 - room.secondsLeft) / 60) * 90))
          );
          const emojiMsgId = `emj_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

          if (room.p1.client) {
            safeSend(room.p1.client.ws, {
              type: 'match:emoji',
              id: emojiMsgId,
              isSelf: isP1,
              emoji: rawEmoji,
              label: rawLabel,
              coachName: sideState.profile.username,
              teamName: sideState.profile.teamName,
              minute,
            });
          }
          if (room.p2.client) {
            safeSend(room.p2.client.ws, {
              type: 'match:emoji',
              id: emojiMsgId,
              isSelf: !isP1,
              emoji: rawEmoji,
              label: rawLabel,
              coachName: sideState.profile.username,
              teamName: sideState.profile.teamName,
              minute,
            });
          }
          return;
        }
      } catch {
        // ignore malformed WS frames
      }
    });

    ws.on('close', () => {
      cancelInvitesFrom(connId);
      clients.delete(connId);
      if (clientObj.roomId) {
        const room = rooms.get(clientObj.roomId);
        if (room) {
          const isP1 = room.p1.client?.id === connId;
          if (isP1) room.p1.client = null;
          else room.p2.client = null;
          const remaining = isP1 ? room.p2.client : room.p1.client;

          if (room.timer) clearInterval(room.timer);
          rooms.delete(room.id);

          if (remaining) {
            const remainingIsP1 = !isP1;
            const rawRemScore =
              room.subMode === 'apex' && room.apexState
                ? remainingIsP1
                  ? room.apexState.p1Score
                  : room.apexState.p2Score
                : remainingIsP1
                ? room.p1.score
                : room.p2.score;
            const rawDiscScore =
              room.subMode === 'apex' && room.apexState
                ? remainingIsP1
                  ? room.apexState.p2Score
                  : room.apexState.p1Score
                : remainingIsP1
                ? room.p2.score
                : room.p1.score;

            const userScore = Math.max(rawRemScore, rawDiscScore + 1, 3);
            const oppScore = Math.min(rawDiscScore, userScore - 1);
            const minute =
              room.subMode === 'apex' && room.apexState
                ? Math.min(90, Math.max(1, Math.ceil(((90 - room.apexState.playSecondsLeft) / 90) * 90)))
                : Math.min(90, Math.max(1, Math.ceil(((60 - room.secondsLeft) / 60) * 90)));

            remaining.roomId = null;
            remaining.inQueue = false;
            safeSend(remaining.ws, {
              type: 'match:tactic_alert',
              isSelf: false,
              coachName: 'Trọng Tài Bàn',
              teamName: 'Hệ Thống',
              minute,
              text: `Đối thủ đã thoát trận — Xử thắng kỹ thuật (${userScore} - ${oppScore}) cho bạn!`,
            });
            const userGoalScorerCardIds =
              room.subMode === 'apex' && room.apexState
                ? remainingIsP1
                  ? room.apexState.p1GoalScorerCardIds
                  : room.apexState.p2GoalScorerCardIds
                : remainingIsP1
                ? room.p1.goalScorerCardIds
                : room.p2.goalScorerCardIds;

            safeSend(remaining.ws, {
              type: 'match:end',
              userScore,
              oppScore,
              forfeitWin: true,
              userGoalScorerCardIds,
            });
          }
        }
      }
      broadcastPresence();
    });
  });

  httpServer.on('upgrade', (request, socket, head) => {
    try {
      const reqUrl = new URL(request.url || '/', 'http://localhost');
      if (reqUrl.pathname === '/ws/ranked') {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      }
    } catch {
      socket.destroy();
    }
  });

  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
  });
}

startServer();
