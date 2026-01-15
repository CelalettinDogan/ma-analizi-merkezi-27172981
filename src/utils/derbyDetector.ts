// Derbi maçlarını tespit et
export const DERBIES: Record<string, [string, string][]> = {
  'PL': [
    ['Manchester United', 'Manchester City'], // Manchester Derby
    ['Liverpool', 'Everton'], // Merseyside Derby
    ['Arsenal', 'Tottenham Hotspur'], // North London Derby
    ['Chelsea', 'Tottenham Hotspur'], // London Derby
    ['Chelsea', 'Arsenal'], // London Derby
    ['Chelsea', 'West Ham United'], // London Derby
    ['Manchester United', 'Liverpool'], // Northwest Derby
    ['Newcastle United', 'Sunderland'], // Tyne-Wear Derby
  ],
  'PD': [
    ['Real Madrid CF', 'FC Barcelona'], // El Clásico
    ['Real Madrid CF', 'Atlético de Madrid'], // Madrid Derby
    ['FC Barcelona', 'RCD Espanyol'], // Catalan Derby
    ['Sevilla FC', 'Real Betis'], // Seville Derby
    ['Athletic Club', 'Real Sociedad'], // Basque Derby
  ],
  'BL1': [
    ['FC Bayern München', 'Borussia Dortmund'], // Der Klassiker
    ['Borussia Dortmund', 'FC Schalke 04'], // Revierderby
    ['Hamburger SV', 'Werder Bremen'], // Nordderby
    ['1. FC Köln', 'Borussia Mönchengladbach'], // Rheinderby
  ],
  'SA': [
    ['Juventus FC', 'Inter Milan'], // Derby d\'Italia
    ['AC Milan', 'Inter Milan'], // Derby della Madonnina
    ['AS Roma', 'SS Lazio'], // Derby della Capitale
    ['Juventus FC', 'Torino FC'], // Derby della Mole
    ['Napoli', 'AS Roma'], // Derby del Sole
  ],
  'FL1': [
    ['Paris Saint-Germain', 'Olympique de Marseille'], // Le Classique
    ['Olympique de Marseille', 'Olympique Lyonnais'], // Choc des Olympiques
    ['AS Monaco', 'Paris Saint-Germain'],
    ['AS Saint-Étienne', 'Olympique Lyonnais'], // Derby Rhône-Alpes
  ],
  'CL': [
    // Champions League derbileri lig derbilerinden alınır
  ],
};

// Takım isimlerini normalize et
function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .replace(/fc |cf |ac |as |ss |sc |afc |1\. /gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// İki takım arasında derbi var mı kontrol et
export function isDerbyMatch(homeTeam: string, awayTeam: string, league: string): boolean {
  const derbies = DERBIES[league] || [];
  const normalizedHome = normalizeTeamName(homeTeam);
  const normalizedAway = normalizeTeamName(awayTeam);
  
  return derbies.some(([team1, team2]) => {
    const norm1 = normalizeTeamName(team1);
    const norm2 = normalizeTeamName(team2);
    return (
      (normalizedHome.includes(norm1) || norm1.includes(normalizedHome)) &&
      (normalizedAway.includes(norm2) || norm2.includes(normalizedAway))
    ) || (
      (normalizedHome.includes(norm2) || norm2.includes(normalizedHome)) &&
      (normalizedAway.includes(norm1) || norm1.includes(normalizedAway))
    );
  });
}

// Derbi adını getir
export function getDerbyName(homeTeam: string, awayTeam: string, league: string): string | null {
  const derbyNames: Record<string, Record<string, string>> = {
    'PL': {
      'manchester': 'Manchester Derby',
      'liverpool-everton': 'Merseyside Derby',
      'arsenal-tottenham': 'North London Derby',
      'manchester-liverpool': 'Northwest Derby',
    },
    'PD': {
      'real madrid-barcelona': 'El Clásico',
      'real madrid-atletico': 'Madrid Derby',
    },
    'BL1': {
      'bayern-dortmund': 'Der Klassiker',
      'dortmund-schalke': 'Revierderby',
    },
    'SA': {
      'milan-inter': 'Derby della Madonnina',
      'roma-lazio': 'Derby della Capitale',
      'juventus-inter': "Derby d'Italia",
    },
    'FL1': {
      'paris-marseille': 'Le Classique',
    },
  };

  if (!isDerbyMatch(homeTeam, awayTeam, league)) return null;
  
  const leagueDerbies = derbyNames[league];
  if (!leagueDerbies) return 'Derbi Maçı';

  const combined = `${normalizeTeamName(homeTeam)}-${normalizeTeamName(awayTeam)}`;
  
  for (const [key, name] of Object.entries(leagueDerbies)) {
    if (combined.includes(key) || key.split('-').every(k => combined.includes(k))) {
      return name;
    }
  }
  
  return 'Derbi Maçı';
}

// Büyük takım mı kontrol et (Top 6 benzeri)
export const TOP_TEAMS: Record<string, string[]> = {
  'PL': ['Manchester City', 'Arsenal', 'Liverpool', 'Manchester United', 'Chelsea', 'Tottenham Hotspur'],
  'PD': ['Real Madrid CF', 'FC Barcelona', 'Atlético de Madrid', 'Sevilla FC'],
  'BL1': ['FC Bayern München', 'Borussia Dortmund', 'RB Leipzig', 'Bayer 04 Leverkusen'],
  'SA': ['Inter Milan', 'AC Milan', 'Juventus FC', 'Napoli'],
  'FL1': ['Paris Saint-Germain', 'Olympique de Marseille', 'AS Monaco', 'Olympique Lyonnais'],
};

export function isTopTeam(teamName: string, league: string): boolean {
  const topTeams = TOP_TEAMS[league] || [];
  const normalized = normalizeTeamName(teamName);
  return topTeams.some(t => normalizeTeamName(t).includes(normalized) || normalized.includes(normalizeTeamName(t)));
}

export function isTopSixClash(homeTeam: string, awayTeam: string, league: string): boolean {
  return isTopTeam(homeTeam, league) && isTopTeam(awayTeam, league);
}
