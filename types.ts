
export type Continent = 'Africa' | 'Americas' | 'Asia' | 'Europe' | 'Oceania' | 'All';
export type Difficulty = 'Easy' | 'Normal' | 'Hard';
export type CountryType = 'Sovereign' | 'Territory';

export interface Country {
  name: string;
  code: string; // ISO 3166-1 alpha-2
  capital: string;
  lat: number;
  lng: number;
  continent: Continent;
  difficulty: Difficulty;
  type: CountryType;
}

export interface GameState {
  date: string;
  guesses: string[];
  isFinished: boolean;
  won: boolean;
}

export interface GameFilter {
  continent: Continent;
  difficulty: Difficulty | 'Mixed';
  type: CountryType | 'All';
}

export enum BlurLevel {
  LEVEL_0 = 'blur-[40px]',
  LEVEL_1 = 'blur-[30px]',
  LEVEL_2 = 'blur-[20px]',
  LEVEL_3 = 'blur-[12px]',
  LEVEL_4 = 'blur-[6px]',
  LEVEL_5 = 'blur-[3px]',
  NONE = 'blur-none',
}
