import {
  PremierLeagueClub,
  CareerFixture,
  CareerStandingRow,
  CareerSeasonState,
} from '../types/game';
import { resolveClubCrestUrls } from '../utils/clubCrests';

export const USER_CLUB_ID = 'user_club';

export const CAREER_OPPONENT_OVR_BOOST = 20;

export const getPremierLeagueClubs = (
  userTeamName: string,
  userTeamLogo: string,
  userOvr: number
): PremierLeagueClub[] => {
  const baseClubs: PremierLeagueClub[] = [
  {
    id: USER_CLUB_ID,
    name: userTeamName || 'Premier FC',
    shortName: (userTeamName || 'PFC').slice(0, 3).toUpperCase(),
    ovr: userOvr || 74,
    primaryColor: '#2563EB',
    secondaryColor: '#FACC15',
    badgeUrl: userTeamLogo || '/assets/aistudio/Premier_League_ad9034c5.png',
    stadium: 'Sân Vận Động Của Bạn',
    starPlayer: 'Đội trưởng CLB',
    roster: [],
  },
  {
    id: 'pl_mancity',
    name: 'Manchester City',
    shortName: 'MCI',
    ovr: 90,
    primaryColor: '#6CABDD',
    secondaryColor: '#1C2C5B',
    badgeUrl: 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg',
    stadium: 'Etihad Stadium',
    starPlayer: 'E. Haaland',
    roster: [
      { name: 'Doku', pos: 'LW', ovr: 86 },
      { name: 'Haaland', pos: 'ST', ovr: 92 },
      { name: 'Savinho', pos: 'RW', ovr: 85 },
      { name: 'Foden', pos: 'CAM', ovr: 90 },
      { name: 'De Bruyne', pos: 'CM', ovr: 91 },
      { name: 'Rodri', pos: 'CDM', ovr: 92 },
      { name: 'Gvardiol', pos: 'LB', ovr: 87 },
      { name: 'Rúben Dias', pos: 'CB', ovr: 89 },
      { name: 'Akanji', pos: 'CB', ovr: 86 },
      { name: 'Walker', pos: 'RB', ovr: 85 },
      { name: 'Ederson', pos: 'GK', ovr: 89 },
    ],
  },
  {
    id: 'pl_arsenal',
    name: 'Arsenal',
    shortName: 'ARS',
    ovr: 89,
    primaryColor: '#EF0107',
    secondaryColor: '#FFFFFF',
    badgeUrl: 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg',
    stadium: 'Emirates Stadium',
    starPlayer: 'B. Saka',
    roster: [
      { name: 'Martinelli', pos: 'LW', ovr: 86 },
      { name: 'Havertz', pos: 'ST', ovr: 86 },
      { name: 'Saka', pos: 'RW', ovr: 90 },
      { name: 'Ødegaard', pos: 'CAM', ovr: 90 },
      { name: 'Merino', pos: 'CM', ovr: 85 },
      { name: 'Rice', pos: 'CDM', ovr: 89 },
      { name: 'Timber', pos: 'LB', ovr: 84 },
      { name: 'Gabriel', pos: 'CB', ovr: 88 },
      { name: 'Saliba', pos: 'CB', ovr: 90 },
      { name: 'Ben White', pos: 'RB', ovr: 86 },
      { name: 'Raya', pos: 'GK', ovr: 87 },
    ],
  },
  {
    id: 'pl_liverpool',
    name: 'Liverpool',
    shortName: 'LIV',
    ovr: 89,
    primaryColor: '#C8102E',
    secondaryColor: '#F6EB61',
    badgeUrl: 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg',
    stadium: 'Anfield',
    starPlayer: 'M. Salah',
    roster: [
      { name: 'Luis Díaz', pos: 'LW', ovr: 87 },
      { name: 'Núñez', pos: 'ST', ovr: 85 },
      { name: 'Salah', pos: 'RW', ovr: 91 },
      { name: 'Szoboszlai', pos: 'CAM', ovr: 86 },
      { name: 'Mac Allister', pos: 'CM', ovr: 88 },
      { name: 'Gravenberch', pos: 'CDM', ovr: 86 },
      { name: 'Robertson', pos: 'LB', ovr: 86 },
      { name: 'Van Dijk', pos: 'CB', ovr: 91 },
      { name: 'Konaté', pos: 'CB', ovr: 86 },
      { name: 'Trent A-A', pos: 'RB', ovr: 88 },
      { name: 'Alisson', pos: 'GK', ovr: 90 },
    ],
  },
  {
    id: 'pl_chelsea',
    name: 'Chelsea',
    shortName: 'CHE',
    ovr: 85,
    primaryColor: '#034694',
    secondaryColor: '#FFFFFF',
    badgeUrl: 'https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg',
    stadium: 'Stamford Bridge',
    starPlayer: 'C. Palmer',
    roster: [
      { name: 'Pedro Neto', pos: 'LW', ovr: 83 },
      { name: 'Jackson', pos: 'ST', ovr: 83 },
      { name: 'Madueke', pos: 'RW', ovr: 82 },
      { name: 'Palmer', pos: 'CAM', ovr: 89 },
      { name: 'Enzo', pos: 'CM', ovr: 85 },
      { name: 'Caicedo', pos: 'CDM', ovr: 86 },
      { name: 'Cucurella', pos: 'LB', ovr: 83 },
      { name: 'Colwill', pos: 'CB', ovr: 82 },
      { name: 'Fofana', pos: 'CB', ovr: 82 },
      { name: 'Reece James', pos: 'RB', ovr: 84 },
      { name: 'Sánchez', pos: 'GK', ovr: 82 },
    ],
  },
  {
    id: 'pl_astonvilla',
    name: 'Aston Villa',
    shortName: 'AVL',
    ovr: 84,
    primaryColor: '#670E36',
    secondaryColor: '#95BFE5',
    badgeUrl: 'https://upload.wikimedia.org/wikipedia/en/9/9f/Aston_Villa_FC_new_crest.svg',
    stadium: 'Villa Park',
    starPlayer: 'O. Watkins',
    roster: [
      { name: 'Rogers', pos: 'LW', ovr: 82 },
      { name: 'Watkins', pos: 'ST', ovr: 86 },
      { name: 'Bailey', pos: 'RW', ovr: 83 },
      { name: 'McGinn', pos: 'CAM', ovr: 83 },
      { name: 'Tielemans', pos: 'CM', ovr: 84 },
      { name: 'Onana', pos: 'CDM', ovr: 83 },
      { name: 'Digne', pos: 'LB', ovr: 82 },
      { name: 'Pau Torres', pos: 'CB', ovr: 84 },
      { name: 'Konsa', pos: 'CB', ovr: 84 },
      { name: 'Cash', pos: 'RB', ovr: 81 },
      { name: 'E. Martínez', pos: 'GK', ovr: 88 },
    ],
  },
  {
    id: 'pl_newcastle',
    name: 'Newcastle United',
    shortName: 'NEW',
    ovr: 84,
    primaryColor: '#241F20',
    secondaryColor: '#FFFFFF',
    badgeUrl: 'https://upload.wikimedia.org/wikipedia/en/5/56/Newcastle_United_Logo.svg',
    stadium: 'St. James Park',
    starPlayer: 'A. Isak',
    roster: [
      { name: 'Gordon', pos: 'LW', ovr: 85 },
      { name: 'Isak', pos: 'ST', ovr: 87 },
      { name: 'Barnes', pos: 'RW', ovr: 82 },
      { name: 'Joelinton', pos: 'CAM', ovr: 83 },
      { name: 'Tonali', pos: 'CM', ovr: 85 },
      { name: 'Bruno G.', pos: 'CDM', ovr: 87 },
      { name: 'Hall', pos: 'LB', ovr: 79 },
      { name: 'Botman', pos: 'CB', ovr: 84 },
      { name: 'Schär', pos: 'CB', ovr: 83 },
      { name: 'Livramento', pos: 'RB', ovr: 81 },
      { name: 'Pope', pos: 'GK', ovr: 84 },
    ],
  },
  {
    id: 'pl_tottenham',
    name: 'Tottenham Hotspur',
    shortName: 'TOT',
    ovr: 84,
    primaryColor: '#132257',
    secondaryColor: '#FFFFFF',
    badgeUrl: 'https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg',
    stadium: 'Tottenham Hotspur Stadium',
    starPlayer: 'Son Heung-min',
    roster: [
      { name: 'Son', pos: 'LW', ovr: 88 },
      { name: 'Solanke', pos: 'ST', ovr: 83 },
      { name: 'Johnson', pos: 'RW', ovr: 82 },
      { name: 'Maddison', pos: 'CAM', ovr: 86 },
      { name: 'Kulusevski', pos: 'CM', ovr: 85 },
      { name: 'Bissouma', pos: 'CDM', ovr: 82 },
      { name: 'Udogie', pos: 'LB', ovr: 83 },
      { name: 'Van de Ven', pos: 'CB', ovr: 85 },
      { name: 'Romero', pos: 'CB', ovr: 86 },
      { name: 'Porro', pos: 'RB', ovr: 84 },
      { name: 'Vicario', pos: 'GK', ovr: 85 },
    ],
  },
  {
    id: 'pl_manutd',
    name: 'Manchester United',
    shortName: 'MUN',
    ovr: 83,
    primaryColor: '#DA291C',
    secondaryColor: '#FBE122',
    badgeUrl: 'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg',
    stadium: 'Old Trafford',
    starPlayer: 'B. Fernandes',
    roster: [
      { name: 'Garnacho', pos: 'LW', ovr: 82 },
      { name: 'Højlund', pos: 'ST', ovr: 81 },
      { name: 'Amad', pos: 'RW', ovr: 82 },
      { name: 'Bruno F.', pos: 'CAM', ovr: 88 },
      { name: 'Mainoo', pos: 'CM', ovr: 82 },
      { name: 'Ugarte', pos: 'CDM', ovr: 83 },
      { name: 'Dalot', pos: 'LB', ovr: 82 },
      { name: 'L. Martínez', pos: 'CB', ovr: 84 },
      { name: 'De Ligt', pos: 'CB', ovr: 84 },
      { name: 'Mazraoui', pos: 'RB', ovr: 82 },
      { name: 'Onana', pos: 'GK', ovr: 84 },
    ],
  },
  {
    id: 'pl_brighton',
    name: 'Brighton & Hove Albion',
    shortName: 'BHA',
    ovr: 81,
    primaryColor: '#0057B8',
    secondaryColor: '#FFCD00',
    badgeUrl: 'https://upload.wikimedia.org/wikipedia/en/f/fd/Brighton_%26_Hove_Albion_logo.svg',
    stadium: 'Amex Stadium',
    starPlayer: 'K. Mitoma',
    roster: [
      { name: 'Mitoma', pos: 'LW', ovr: 83 },
      { name: 'Welbeck', pos: 'ST', ovr: 80 },
      { name: 'Minteh', pos: 'RW', ovr: 79 },
      { name: 'João Pedro', pos: 'CAM', ovr: 82 },
      { name: 'Baleba', pos: 'CM', ovr: 81 },
      { name: 'Ayari', pos: 'CDM', ovr: 78 },
      { name: 'Estupiñán', pos: 'LB', ovr: 81 },
      { name: 'Dunk', pos: 'CB', ovr: 81 },
      { name: 'Van Hecke', pos: 'CB', ovr: 80 },
      { name: 'Veltman', pos: 'RB', ovr: 79 },
      { name: 'Verbruggen', pos: 'GK', ovr: 80 },
    ],
  },
  {
    id: 'pl_nottingham',
    name: 'Nottingham Forest',
    shortName: 'NFO',
    ovr: 80,
    primaryColor: '#DD0000',
    secondaryColor: '#FFFFFF',
    badgeUrl: 'https://upload.wikimedia.org/wikipedia/en/e/e5/Nottingham_Forest_F.C._logo.svg',
    stadium: 'City Ground',
    starPlayer: 'M. Gibbs-White',
    roster: [
      { name: 'Hudson-Odoi', pos: 'LW', ovr: 80 },
      { name: 'Chris Wood', pos: 'ST', ovr: 81 },
      { name: 'Elanga', pos: 'RW', ovr: 80 },
      { name: 'Gibbs-White', pos: 'CAM', ovr: 82 },
      { name: 'Anderson', pos: 'CM', ovr: 79 },
      { name: 'Yates', pos: 'CDM', ovr: 78 },
      { name: 'Aina', pos: 'LB', ovr: 80 },
      { name: 'Murillo', pos: 'CB', ovr: 82 },
      { name: 'Milenković', pos: 'CB', ovr: 81 },
      { name: 'Williams', pos: 'RB', ovr: 78 },
      { name: 'Sels', pos: 'GK', ovr: 80 },
    ],
  },
  {
    id: 'pl_brentford',
    name: 'Brentford',
    shortName: 'BRE',
    ovr: 79,
    primaryColor: '#E30613',
    secondaryColor: '#FFFFFF',
    badgeUrl: 'https://upload.wikimedia.org/wikipedia/en/2/2a/Brentford_FC_crest.svg',
    stadium: 'Gtech Community Stadium',
    starPlayer: 'B. Mbeumo',
    roster: [
      { name: 'Schade', pos: 'LW', ovr: 78 },
      { name: 'Wissa', pos: 'ST', ovr: 81 },
      { name: 'Mbeumo', pos: 'RW', ovr: 83 },
      { name: 'Damsgaard', pos: 'CAM', ovr: 79 },
      { name: 'Janelt', pos: 'CM', ovr: 78 },
      { name: 'Nørgaard', pos: 'CDM', ovr: 80 },
      { name: 'Lewis-Potter', pos: 'LB', ovr: 77 },
      { name: 'Pinnock', pos: 'CB', ovr: 79 },
      { name: 'Collins', pos: 'CB', ovr: 79 },
      { name: 'Ajer', pos: 'RB', ovr: 78 },
      { name: 'Flekken', pos: 'GK', ovr: 79 },
    ],
  },
  {
    id: 'pl_bournemouth',
    name: 'AFC Bournemouth',
    shortName: 'BOU',
    ovr: 79,
    primaryColor: '#DA291C',
    secondaryColor: '#000000',
    badgeUrl: 'https://upload.wikimedia.org/wikipedia/en/e/e5/AFC_Bournemouth_%282013%29.svg',
    stadium: 'Vitality Stadium',
    starPlayer: 'A. Semenyo',
    roster: [
      { name: 'Kluivert', pos: 'LW', ovr: 80 },
      { name: 'Evanilson', pos: 'ST', ovr: 80 },
      { name: 'Semenyo', pos: 'RW', ovr: 81 },
      { name: 'Tavernier', pos: 'CAM', ovr: 78 },
      { name: 'Christie', pos: 'CM', ovr: 79 },
      { name: 'Tyler Adams', pos: 'CDM', ovr: 79 },
      { name: 'Kerkez', pos: 'LB', ovr: 80 },
      { name: 'Zabarnyi', pos: 'CB', ovr: 80 },
      { name: 'Senesi', pos: 'CB', ovr: 79 },
      { name: 'Smith', pos: 'RB', ovr: 76 },
      { name: 'Kepa', pos: 'GK', ovr: 80 },
    ],
  },
  {
    id: 'pl_fulham',
    name: 'Fulham',
    shortName: 'FUL',
    ovr: 79,
    primaryColor: '#111827',
    secondaryColor: '#FFFFFF',
    badgeUrl: 'https://upload.wikimedia.org/wikipedia/en/e/eb/Fulham_FC_%28shield%29.svg',
    stadium: 'Craven Cottage',
    starPlayer: 'A. Robinson',
    roster: [
      { name: 'Iwobi', pos: 'LW', ovr: 80 },
      { name: 'Jiménez', pos: 'ST', ovr: 79 },
      { name: 'Adama', pos: 'RW', ovr: 78 },
      { name: 'Smith Rowe', pos: 'CAM', ovr: 80 },
      { name: 'Pereira', pos: 'CM', ovr: 80 },
      { name: 'Berge', pos: 'CDM', ovr: 79 },
      { name: 'Robinson', pos: 'LB', ovr: 82 },
      { name: 'Bassey', pos: 'CB', ovr: 79 },
      { name: 'Andersen', pos: 'CB', ovr: 80 },
      { name: 'Tete', pos: 'RB', ovr: 78 },
      { name: 'Leno', pos: 'GK', ovr: 82 },
    ],
  },
  {
    id: 'pl_westham',
    name: 'West Ham United',
    shortName: 'WHU',
    ovr: 80,
    primaryColor: '#7A263A',
    secondaryColor: '#1BB1E7',
    badgeUrl: 'https://upload.wikimedia.org/wikipedia/en/c/c2/West_Ham_United_FC_logo.svg',
    stadium: 'London Stadium',
    starPlayer: 'J. Bowen',
    roster: [
      { name: 'Kudus', pos: 'LW', ovr: 83 },
      { name: 'Antonio', pos: 'ST', ovr: 78 },
      { name: 'Bowen', pos: 'RW', ovr: 84 },
      { name: 'Paquetá', pos: 'CAM', ovr: 83 },
      { name: 'Souček', pos: 'CM', ovr: 80 },
      { name: 'Álvarez', pos: 'CDM', ovr: 81 },
      { name: 'Emerson', pos: 'LB', ovr: 79 },
      { name: 'Kilman', pos: 'CB', ovr: 80 },
      { name: 'Todibo', pos: 'CB', ovr: 80 },
      { name: 'Wan-Bissaka', pos: 'RB', ovr: 80 },
      { name: 'Areola', pos: 'GK', ovr: 81 },
    ],
  },
  {
    id: 'pl_crystalpalace',
    name: 'Crystal Palace',
    shortName: 'CRY',
    ovr: 79,
    primaryColor: '#1B458F',
    secondaryColor: '#C4122E',
    badgeUrl: 'https://upload.wikimedia.org/wikipedia/en/a/a2/Crystal_Palace_FC_logo_%282022%29.svg',
    stadium: 'Selhurst Park',
    starPlayer: 'E. Eze',
    roster: [
      { name: 'Eze', pos: 'LW', ovr: 84 },
      { name: 'Mateta', pos: 'ST', ovr: 81 },
      { name: 'I. Sarr', pos: 'RW', ovr: 79 },
      { name: 'Kamada', pos: 'CAM', ovr: 79 },
      { name: 'Wharton', pos: 'CM', ovr: 80 },
      { name: 'Lerma', pos: 'CDM', ovr: 79 },
      { name: 'Mitchell', pos: 'LB', ovr: 78 },
      { name: 'Guéhi', pos: 'CB', ovr: 83 },
      { name: 'Lacroix', pos: 'CB', ovr: 80 },
      { name: 'Muñoz', pos: 'RB', ovr: 80 },
      { name: 'Henderson', pos: 'GK', ovr: 80 },
    ],
  },
  {
    id: 'pl_wolves',
    name: 'Wolverhampton',
    shortName: 'WOL',
    ovr: 77,
    primaryColor: '#FDB913',
    secondaryColor: '#231F20',
    badgeUrl: 'https://upload.wikimedia.org/wikipedia/en/f/fc/Wolverhampton_Wanderers.svg',
    stadium: 'Molineux Stadium',
    starPlayer: 'M. Cunha',
    roster: [
      { name: 'Cunha', pos: 'LW', ovr: 83 },
      { name: 'Strand Larsen', pos: 'ST', ovr: 79 },
      { name: 'Hwang', pos: 'RW', ovr: 78 },
      { name: 'Bellegarde', pos: 'CAM', ovr: 76 },
      { name: 'João Gomes', pos: 'CM', ovr: 80 },
      { name: 'André', pos: 'CDM', ovr: 79 },
      { name: 'Aït-Nouri', pos: 'LB', ovr: 80 },
      { name: 'Toti', pos: 'CB', ovr: 77 },
      { name: 'Dawson', pos: 'CB', ovr: 76 },
      { name: 'Semedo', pos: 'RB', ovr: 78 },
      { name: 'José Sá', pos: 'GK', ovr: 79 },
    ],
  },
  {
    id: 'pl_everton',
    name: 'Everton',
    shortName: 'EVE',
    ovr: 77,
    primaryColor: '#003399',
    secondaryColor: '#FFFFFF',
    badgeUrl: 'https://upload.wikimedia.org/wikipedia/en/7/7c/Everton_FC_logo.svg',
    stadium: 'Goodison Park',
    starPlayer: 'J. Pickford',
    roster: [
      { name: 'McNeil', pos: 'LW', ovr: 79 },
      { name: 'Calvert-Lewin', pos: 'ST', ovr: 78 },
      { name: 'Ndiaye', pos: 'RW', ovr: 79 },
      { name: 'Doucouré', pos: 'CAM', ovr: 78 },
      { name: 'Garner', pos: 'CM', ovr: 76 },
      { name: 'Gueye', pos: 'CDM', ovr: 78 },
      { name: 'Mykolenko', pos: 'LB', ovr: 77 },
      { name: 'Tarkowski', pos: 'CB', ovr: 80 },
      { name: 'Branthwaite', pos: 'CB', ovr: 80 },
      { name: 'Young', pos: 'RB', ovr: 74 },
      { name: 'Pickford', pos: 'GK', ovr: 83 },
    ],
  },
  {
    id: 'pl_leicester',
    name: 'Leicester City',
    shortName: 'LEI',
    ovr: 74,
    primaryColor: '#003090',
    secondaryColor: '#FDBE11',
    badgeUrl: 'https://upload.wikimedia.org/wikipedia/en/2/2d/Leicester_City_crest.svg',
    stadium: 'King Power Stadium',
    starPlayer: 'J. Vardy',
    roster: [
      { name: 'Mavididi', pos: 'LW', ovr: 75 },
      { name: 'Vardy', pos: 'ST', ovr: 77 },
      { name: 'Fatawu', pos: 'RW', ovr: 75 },
      { name: 'Buonanotte', pos: 'CAM', ovr: 75 },
      { name: 'Winks', pos: 'CM', ovr: 76 },
      { name: 'Ndidi', pos: 'CDM', ovr: 77 },
      { name: 'Kristiansen', pos: 'LB', ovr: 74 },
      { name: 'Faes', pos: 'CB', ovr: 76 },
      { name: 'Vestergaard', pos: 'CB', ovr: 75 },
      { name: 'Justin', pos: 'RB', ovr: 75 },
      { name: 'Hermansen', pos: 'GK', ovr: 76 },
    ],
  },
  {
    id: 'pl_ipswich',
    name: 'Ipswich Town',
    shortName: 'IPS',
    ovr: 73,
    primaryColor: '#3A64A3',
    secondaryColor: '#FFFFFF',
    badgeUrl: 'https://upload.wikimedia.org/wikipedia/en/4/43/Ipswich_Town.svg',
    stadium: 'Portman Road',
    starPlayer: 'L. Delap',
    roster: [
      { name: 'Clarke', pos: 'LW', ovr: 74 },
      { name: 'Delap', pos: 'ST', ovr: 76 },
      { name: 'Hutchinson', pos: 'RW', ovr: 75 },
      { name: 'Szmodics', pos: 'CAM', ovr: 75 },
      { name: 'Cajuste', pos: 'CM', ovr: 74 },
      { name: 'Morsy', pos: 'CDM', ovr: 74 },
      { name: 'Leif Davis', pos: 'LB', ovr: 76 },
      { name: 'Greaves', pos: 'CB', ovr: 74 },
      { name: 'OShea', pos: 'CB', ovr: 73 },
      { name: 'Tuanzebe', pos: 'RB', ovr: 73 },
      { name: 'Muric', pos: 'GK', ovr: 74 },
    ],
  },
];

  return baseClubs.map((club) =>
    club.id === USER_CLUB_ID
      ? club
      : {
          ...club,
          badgeUrl: resolveClubCrestUrls(club.name, club.badgeUrl)[0] || club.badgeUrl,
          ovr: club.ovr + CAREER_OPPONENT_OVR_BOOST,
          roster: club.roster.map((player) => ({
            ...player,
            ovr: player.ovr + CAREER_OPPONENT_OVR_BOOST,
          })),
        }
  );
};

// Generate authentic 38-matchday double round-robin schedule for 20 Premier League clubs
export const generatePremierLeagueSchedule = (clubIds: string[]): CareerFixture[][] => {
  const n = clubIds.length; // 20
  const teams = [...clubIds];
  const firstHalf: CareerFixture[][] = [];

  // Circle method for 19 rounds
  const fixed = teams[0];
  const rotating = teams.slice(1);

  for (let round = 0; round < n - 1; round++) {
    const roundMatches: CareerFixture[] = [];
    const currentOrder = [fixed, ...rotating];

    for (let i = 0; i < n / 2; i++) {
      const t1 = currentOrder[i];
      const t2 = currentOrder[n - 1 - i];
      const flip = (round + i) % 2 === 0;
      roundMatches.push({
        matchday: round + 1,
        homeClubId: flip ? t1 : t2,
        awayClubId: flip ? t2 : t1,
        played: false,
      });
    }

    firstHalf.push(roundMatches);
    // Rotate clockwise
    const last = rotating.pop()!;
    rotating.unshift(last);
  }

  // Second half (rounds 20..38) swaps home & away
  const secondHalf: CareerFixture[][] = firstHalf.map((roundFixtures, idx) =>
    roundFixtures.map((f) => ({
      matchday: idx + 20,
      homeClubId: f.awayClubId,
      awayClubId: f.homeClubId,
      played: false,
    }))
  );

  return [...firstHalf, ...secondHalf];
};

export const createInitialCareerSeason = (
  seasonNumber: number,
  clubs: PremierLeagueClub[]
): CareerSeasonState => {
  const clubIds = clubs.map((c) => c.id);
  const fixtures = generatePremierLeagueSchedule(clubIds);
  const standings: CareerStandingRow[] = clubIds.map((id) => ({
    clubId: id,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    gf: 0,
    ga: 0,
    points: 0,
    form: [],
  }));

  return {
    seasonNumber,
    currentMatchday: 1,
    userClubId: USER_CLUB_ID,
    standings,
    fixtures,
    seasonRewardClaimed: false,
    totalGoalsScored: 0,
    topScorerName: 'Chưa có',
    topScorerGoals: 0,
  };
};

// Simulate an AI vs AI Premier League fixture based on club OVRs & home advantage
export const simulateAiFixture = (homeOvr: number, awayOvr: number): { homeGoals: number; awayGoals: number } => {
  const diff = homeOvr + 2 - awayOvr; // +2 home advantage
  const homeExpected = Math.max(0.45, Math.min(3.1, 1.38 + diff * 0.09));
  const awayExpected = Math.max(0.35, Math.min(2.8, 1.12 - diff * 0.08));

  const sampleGoals = (lambda: number) => {
    let L = Math.exp(-lambda);
    let k = 0;
    let p = 1;
    do {
      k++;
      p *= Math.random();
    } while (p > L && k < 7);
    return k - 1;
  };

  return {
    homeGoals: sampleGoals(homeExpected),
    awayGoals: sampleGoals(awayExpected),
  };
};

export const sortStandings = (rows: CareerStandingRow[]): CareerStandingRow[] => {
  return [...rows].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const gdA = a.gf - a.ga;
    const gdB = b.gf - b.ga;
    if (gdB !== gdA) return gdB - gdA;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.clubId.localeCompare(b.clubId);
  });
};

export interface MatchRewardBreakdown {
  coins: number;
  gems: number;
  tickets: number;
  label: string;
  bonusNote: string;
}

export const calculateMatchRewards = (
  userGoals: number,
  oppGoals: number,
  opponentOvr: number,
  matchday: number
): MatchRewardBreakdown => {
  const isWin = userGoals > oppGoals;
  const isDraw = userGoals === oppGoals;
  const isBigSix = opponentOvr >= 84 + CAREER_OPPONENT_OVR_BOOST;
  const isMilestoneRound = matchday % 5 === 0 || matchday === 38;

  let coins = isWin ? 85000 : isDraw ? 40000 : 18000;
  let gems = isWin ? 140 : isDraw ? 60 : 25;
  const tickets = 0;

  // Goal bonus
  coins += userGoals * 12000;

  // Big-6 Derby bonus
  if (isBigSix && isWin) {
    coins += 55000;
    gems += 80;
  } else if (isBigSix && isDraw) {
    coins += 25000;
    gems += 30;
  }

  // Milestone matchday bonus (every 5 rounds)
  if (isMilestoneRound && (isWin || isDraw)) {
    gems += 50;
  }

  const label = isWin ? 'CHIẾN THẮNG NGOẠI HẠNG' : isDraw ? 'CHIA ĐIỂM QUẢ CẢM' : 'PHÍ RA SÂN VÒNG ĐẤU';
  const bonusParts: string[] = [];
  if (userGoals > 0) bonusParts.push(`+${(userGoals * 12000).toLocaleString('vi-VN')} Xu bàn thắng`);
  if (isBigSix) bonusParts.push('Trận cầu tâm điểm Big 6');
  if (isMilestoneRound) bonusParts.push(`Mốc vòng ${matchday}/38`);

  return {
    coins,
    gems,
    tickets,
    label,
    bonusNote: bonusParts.length > 0 ? bonusParts.join(' · ') : 'Tiếp tục tích lũy điểm số trên BXH!',
  };
};

export interface SeasonRewardTier {
  title: string;
  rankRange: string;
  coins: number;
  gems: number;
  tickets: number;
  badgeColor: string;
}

export const SEASON_REWARD_TIERS: SeasonRewardTier[] = [
  {
    title: 'Vô Địch Premier League',
    rankRange: 'Hạng 1',
    coins: 5000000,
    gems: 3000,
    tickets: 0,
    badgeColor: 'text-yellow-300',
  },
  {
    title: 'Top 4 Champions League',
    rankRange: 'Hạng 2 – 4',
    coins: 2500000,
    gems: 1500,
    tickets: 0,
    badgeColor: 'text-sky-300',
  },
  {
    title: 'Vé Dự Cúp Châu Âu',
    rankRange: 'Hạng 5 – 7',
    coins: 1200000,
    gems: 800,
    tickets: 0,
    badgeColor: 'text-emerald-300',
  },
  {
    title: 'Trụ Hạng Giữa Bảng',
    rankRange: 'Hạng 8 – 17',
    coins: 600000,
    gems: 400,
    tickets: 0,
    badgeColor: 'text-slate-200',
  },
  {
    title: 'Nhóm Cuối Bảng',
    rankRange: 'Hạng 18 – 20',
    coins: 250000,
    gems: 150,
    tickets: 0,
    badgeColor: 'text-rose-300',
  },
];

export const getSeasonRewardForRank = (rank: number): SeasonRewardTier => {
  if (rank === 1) return SEASON_REWARD_TIERS[0];
  if (rank <= 4) return SEASON_REWARD_TIERS[1];
  if (rank <= 7) return SEASON_REWARD_TIERS[2];
  if (rank <= 17) return SEASON_REWARD_TIERS[3];
  return SEASON_REWARD_TIERS[4];
};
