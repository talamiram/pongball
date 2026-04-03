export const TEAMS = [
  { id: 'brazil',      name: 'Brazil',       code: 'BRA', flag: '🇧🇷', primary: '#009C3B', secondary: '#FFDF00', difficulty: 0.92 },
  { id: 'argentina',   name: 'Argentina',    code: 'ARG', flag: '🇦🇷', primary: '#6CACE4', secondary: '#FFFFFF', difficulty: 0.90 },
  { id: 'france',      name: 'France',       code: 'FRA', flag: '🇫🇷', primary: '#002395', secondary: '#FFFFFF', difficulty: 0.88 },
  { id: 'germany',     name: 'Germany',      code: 'GER', flag: '🇩🇪', primary: '#EEEEEE', secondary: '#111111', difficulty: 0.86 },
  { id: 'spain',       name: 'Spain',        code: 'ESP', flag: '🇪🇸', primary: '#AA151B', secondary: '#F1BF00', difficulty: 0.85 },
  { id: 'england',     name: 'England',      code: 'ENG', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', primary: '#FFFFFF', secondary: '#CF081F', difficulty: 0.83 },
  { id: 'portugal',    name: 'Portugal',     code: 'POR', flag: '🇵🇹', primary: '#006600', secondary: '#FF0000', difficulty: 0.82 },
  { id: 'netherlands', name: 'Netherlands',  code: 'NED', flag: '🇳🇱', primary: '#FF6600', secondary: '#FFFFFF', difficulty: 0.80 },
  { id: 'italy',       name: 'Italy',        code: 'ITA', flag: '🇮🇹', primary: '#003087', secondary: '#FFFFFF', difficulty: 0.80 },
  { id: 'croatia',     name: 'Croatia',      code: 'CRO', flag: '🇭🇷', primary: '#CC0000', secondary: '#FFFFFF', difficulty: 0.78 },
  { id: 'usa',         name: 'USA',          code: 'USA', flag: '🇺🇸', primary: '#B22234', secondary: '#3C3B6E', difficulty: 0.75 },
  { id: 'mexico',      name: 'Mexico',       code: 'MEX', flag: '🇲🇽', primary: '#006847', secondary: '#FFFFFF', difficulty: 0.73 },
  { id: 'japan',       name: 'Japan',        code: 'JPN', flag: '🇯🇵', primary: '#BC002D', secondary: '#FFFFFF', difficulty: 0.70 },
  { id: 'morocco',     name: 'Morocco',      code: 'MAR', flag: '🇲🇦', primary: '#C1272D', secondary: '#006233', difficulty: 0.68 },
  { id: 'senegal',     name: 'Senegal',      code: 'SEN', flag: '🇸🇳', primary: '#00853F', secondary: '#FDEF42', difficulty: 0.65 },
  { id: 'australia',   name: 'Australia',    code: 'AUS', flag: '🇦🇺', primary: '#00008B', secondary: '#FFCD00', difficulty: 0.62 },
];

export function getTeamById(id) {
  return TEAMS.find(t => t.id === id);
}
