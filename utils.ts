
import { COUNTRIES } from './constants';
import { Country, GameFilter } from './types';

// The "Day Zero" for the game - Jan 1st, 2024 at Midnight London Time
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Returns a Date object represented in the London timezone "wall clock"
 */
export const getLondonNow = (): Date => {
  const now = new Date();
  const londonStr = now.toLocaleString('en-US', { timeZone: 'Europe/London' });
  return new Date(londonStr);
};

/**
 * Returns the current date string in YYYY-MM-DD format for London Time
 */
export const getLondonDateString = (): string => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
};

/**
 * Returns the number of days since the Epoch based on London Time
 */
export const getDayNumber = (): number => {
  const londonDate = getLondonDateString();
  const start = new Date('2024-01-01');
  const current = new Date(londonDate);
  const diffTime = Math.abs(current.getTime() - start.getTime());
  return Math.floor(diffTime / MS_PER_DAY);
};

/**
 * Returns the country of the day based on London Time rollover.
 * Strictly picks from Sovereign states for the Daily Challenge.
 */
export const getDailyCountry = (): Country => {
  const dayNumber = getDayNumber();
  const sovereignPool = COUNTRIES.filter(c => c.type === 'Sovereign');
  const index = dayNumber % sovereignPool.length;
  return sovereignPool[index];
};

/**
 * Returns a filtered random country based on specific game settings
 */
export const getRandomCountryFiltered = (filter: GameFilter, excludeCode?: string): Country => {
  let pool = COUNTRIES;

  if (filter.continent !== 'All') {
    pool = pool.filter(c => c.continent === filter.continent);
  }

  if (filter.difficulty !== 'Mixed') {
    pool = pool.filter(c => c.difficulty === filter.difficulty);
  }

  if (filter.type !== 'All') {
    pool = pool.filter(c => c.type === filter.type);
  }

  if (excludeCode) {
    pool = pool.filter(c => c.code !== excludeCode);
  }

  // Fallback to full pool if filter results in empty list
  if (pool.length === 0) {
    return COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
  }

  return pool[Math.floor(Math.random() * pool.length)];
};

/**
 * Helper to convert degrees to radians
 */
const deg2rad = (deg: number) => deg * (Math.PI / 180);

/**
 * Calculates distance between two coordinates in KM (Haversine)
 */
export const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

/**
 * Calculates direction arrow from one coordinate to another
 */
export const getDirectionArrow = (lat1: number, lon1: number, lat2: number, lon2: number): string => {
  const y = Math.sin(deg2rad(lon2 - lon1)) * Math.cos(deg2rad(lat2));
  const x = Math.cos(deg2rad(lat1)) * Math.sin(deg2rad(lat2)) -
    Math.sin(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.cos(deg2rad(lon2 - lon1));
  const brng = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;

  if (brng >= 337.5 || brng < 22.5) return '⬆️';
  if (brng >= 22.5 && brng < 67.5) return '↗️';
  if (brng >= 67.5 && brng < 112.5) return '➡️';
  if (brng >= 112.5 && brng < 157.5) return '↘️';
  if (brng >= 157.5 && brng < 202.5) return '⬇️';
  if (brng >= 202.5 && brng < 247.5) return '↙️';
  if (brng >= 247.5 && brng < 292.5) return '⬅️';
  if (brng >= 292.5 && brng < 337.5) return '↖️';
  return '⬆️';
};

/**
 * Generates the emoji grid for sharing results
 */
export const generateShareGrid = (guesses: string[], correctCountry: string, isWin: boolean, isInfinite: boolean): string => {
  const dayNumber = getDayNumber();
  const count = isWin ? guesses.length : 'X';
  
  let message = isInfinite ? `🌍 Shapely (Infinite Mode) 📍\n` : `🌍 Shapely No. ${dayNumber} 📍\n`;
  
  if (isWin) {
    message += `Wow! 🌈 I guessed the right country in ${count}/6 tries! 🏆✨\n\n`;
  } else {
    message += `Ouch! 😅 Today's shape was a real mystery! X/6 💨☁️\n\n`;
  }

  guesses.forEach((guess) => {
    if (guess.toLowerCase() === correctCountry.toLowerCase()) {
      message += '🟩🟩🟩🟩🟩\n';
    } else {
      message += '🟥🟥🟥🟥🟥\n';
    }
  });

  message += `\nCome play this game too! 🗺️⚡🚀\nhttps://geoshapely.netlify.app/`;

  return message;
};

/**
 * Calculates time remaining until 00:00 London Time
 */
export const getTimeUntilNextDay = (): string => {
  const londonNow = getLondonNow();
  const tomorrowLondon = new Date(londonNow);
  tomorrowLondon.setDate(londonNow.getDate() + 1);
  tomorrowLondon.setHours(0, 0, 0, 0);

  const diff = tomorrowLondon.getTime() - londonNow.getTime();
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};
