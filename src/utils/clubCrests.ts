/**
 * Centralized official club crest resolver for FCCard & WalkoutBadges.
 * Prioritizes local uploaded /assets/aistudio/ club crests first, then fast
 * CDN PNG crests (immune to Wikimedia HTTP 429 rate-limits), then explicit card URLs.
 */

const ICON_CREST_URL =
  '/assets/aistudio/logo_c_u_l_c_b__cho_c_c_huy_n_tho_i_5adb0da5.png';

const fotmobCrest = (teamId: number): string =>
  `https://images.fotmob.com/image_resources/logo/teamlogo/${teamId}.png`;

export function resolveClubCrestUrls(
  clubRaw?: string,
  explicitLogoUrl?: string,
  forceIcon: boolean = false
): string[] {
  const club = (clubRaw || '').trim().toLowerCase();

  if (forceIcon || club.includes('icon') || club.includes('legend')) {
    return [ICON_CREST_URL];
  }

  // 1. Local uploaded official club crests (100% instant, zero network errors)
  if (
    club === 'international' ||
    club.includes('international') ||
    club === 'fc welcome' ||
    club === 'fc club'
  ) {
    return ['/assets/aistudio/club_token_908dbb4a.png'];
  }
  if (club.includes('barcelona')) {
    return ['/assets/aistudio/Barcelona_f4bdf357.png'];
  }
  if (club.includes('leverkusen')) {
    return ['/assets/aistudio/Bayer_04_Luverkusen_96ab9cb1.png'];
  }
  if (club.includes('juventus')) {
    return ['/assets/aistudio/Juventus_52bc0155.png'];
  }
  if (club.includes('lyon')) {
    return ['/assets/aistudio/olympique_lyonnias_club_81951f92.png'];
  }
  if (club.includes('hamburg') || club.includes('hsv')) {
    return ['/assets/aistudio/hamburg_club_676dff15.png'];
  }
  if (club.includes('porto')) {
    return ['/assets/aistudio/porto_club_fac28ab9.png'];
  }
  if (club.includes('galatasaray')) {
    return ['/assets/aistudio/galatasaray_club_5eb9269b.png'];
  }
  if (club.includes('monaco')) {
    return ['/assets/aistudio/monaco_club_b1e39bdb.png'];
  }
  if (club.includes('al nassr') || club.includes('al-nassr')) {
    return ['/assets/aistudio/al_nassr_club_bf211e06.png'];
  }
  if (club.includes('ravenna') || club.includes('ravena')) {
    return ['/assets/aistudio/ravena_7d399420.png'];
  }
  if (club.includes('frosinone')) {
    return ['/assets/aistudio/calo_s_club_cc42bfc2.png'];
  }
  if (club.includes('werder') || club.includes('bremen')) {
    return ['/assets/aistudio/fullkrug_s_club_52c9e4ee.png'];
  }
  if (club.includes('nashville')) {
    return ['/assets/aistudio/mukhtar_s_club_e879afa6.png'];
  }
  if (
    club.includes('hà nội') ||
    club.includes('vietnam') ||
    club.includes('việt nam') ||
    club.includes('cahn') ||
    club.includes('công an') ||
    club.includes('đtqg') ||
    club.includes('bình dương') ||
    club.includes('ninh bình') ||
    club.includes('viettel') ||
    club.includes('nam định') ||
    club.includes('hoàng anh')
  ) {
    return ['/assets/aistudio/vietnam_club_1d2bebf2.png'];
  }

  // 2. Verified official club crests via high-availability FotMob teamlogo CDN
  const urls: string[] = [];
  const addPrimary = (id: number) => {
    urls.push(fotmobCrest(id));
  };

  // CONMEBOL Libertadores (South America — must precede 'atlético' LaLiga match!)
  if (club.includes('mineiro')) addPrimary(10272);
  else if (club.includes('boca juniors') || club === 'boca') addPrimary(10077);
  else if (club.includes('palmeiras')) addPrimary(10283);
  else if (club.includes('racing club') || club === 'racing') addPrimary(10080);
  else if (club.includes('são paulo') || club.includes('sao paulo')) addPrimary(10277);
  else if (club.includes('internacional')) addPrimary(9769);
  else if (club.includes('flamengo')) addPrimary(9770);
  else if (club.includes('river plate')) addPrimary(10076);
  else if (club.includes('corinthians')) addPrimary(9808);
  else if (club.includes('santos')) addPrimary(8514);
  else if (club.includes('fluminense')) addPrimary(9863);
  // LaLiga
  else if (club.includes('real madrid')) addPrimary(8633);
  else if (club.includes('atlético') || club.includes('atletico')) addPrimary(9906);
  else if (club.includes('athletic')) addPrimary(8315);
  else if (club.includes('villarreal')) addPrimary(10205);
  else if (club.includes('valencia')) addPrimary(10267);
  else if (club.includes('betis')) addPrimary(8603);
  else if (club.includes('sociedad')) addPrimary(8560);
  else if (club.includes('girona')) addPrimary(7732);
  else if (club.includes('sevilla')) addPrimary(8302);
  // Premier League
  else if (club.includes('manchester city') || club.includes('man city')) addPrimary(8456);
  else if (
    club.includes('manchester united') ||
    club.includes('man united') ||
    club.includes('man utd')
  )
    addPrimary(10260);
  else if (club.includes('arsenal')) addPrimary(9825);
  else if (club.includes('liverpool')) addPrimary(8650);
  else if (club.includes('chelsea')) addPrimary(8455);
  else if (club.includes('tottenham')) addPrimary(8586);
  else if (club.includes('aston villa')) addPrimary(10252);
  else if (club.includes('newcastle')) addPrimary(10261);
  else if (club.includes('crystal palace')) addPrimary(9826);
  else if (club.includes('everton')) addPrimary(8668);
  else if (club.includes('ipswich')) addPrimary(9902);
  else if (club.includes('brighton')) addPrimary(10204);
  else if (club.includes('nottingham')) addPrimary(10203);
  else if (club.includes('brentford')) addPrimary(9937);
  else if (club.includes('bournemouth')) addPrimary(8678);
  else if (club.includes('fulham')) addPrimary(9879);
  else if (club.includes('west ham')) addPrimary(8654);
  else if (club.includes('wolves') || club.includes('wolverhampton')) addPrimary(8602);
  else if (club.includes('leicester')) addPrimary(8197);
  // Bundesliga
  else if (club.includes('bayern')) addPrimary(9823);
  else if (club.includes('dortmund')) addPrimary(9789);
  else if (club.includes('leipzig')) addPrimary(178475);
  else if (club.includes('union berlin')) addPrimary(8149);
  else if (club.includes('heidenheim')) addPrimary(94937);
  else if (club.includes('frankfurt')) addPrimary(9810);
  else if (club.includes('stuttgart')) addPrimary(10269);
  // Ligue 1
  else if (club.includes('psg') || club.includes('paris')) addPrimary(9847);
  else if (club.includes('lille')) addPrimary(8639);
  else if (club.includes('marseille')) addPrimary(8592);
  // Serie A
  else if (club.includes('inter miami')) addPrimary(960720);
  else if (club.includes('inter milan') || club.includes('internazionale') || club === 'inter')
    addPrimary(8636);
  else if (club.includes('ac milan') || club === 'milan') addPrimary(8564);
  else if (club.includes('napoli')) addPrimary(9875);
  else if (club.includes('roma')) addPrimary(8686);
  else if (club.includes('atalanta')) addPrimary(8524);
  else if (club.includes('lazio')) addPrimary(8543);
  else if (club.includes('como')) addPrimary(10171);
  // Rest of World
  else if (club.includes('benfica')) addPrimary(9772);
  else if (club.includes('sporting')) addPrimary(9768);
  else if (club.includes('ajax')) addPrimary(8593);
  else if (club.includes('psv')) addPrimary(8640);
  else if (club.includes('feyenoord')) addPrimary(10235);
  else if (club.includes('al hilal') || club.includes('al-hilal')) addPrimary(2529);
  else if (club.includes('al-ittihad') || club.includes('al ittihad')) addPrimary(8577);

  // Append explicitLogoUrl if valid and not a known dead 404 URL
  if (
    explicitLogoUrl &&
    !explicitLogoUrl.includes('Juventus_FC_2017_icon') &&
    !explicitLogoUrl.includes('Aston_Villa_FC_new_crest') &&
    !urls.includes(explicitLogoUrl)
  ) {
    urls.push(explicitLogoUrl);
  }

  return urls;
}
