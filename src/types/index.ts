export interface Person {
  id: string;
  name: string;
  budget: number;
  preferences: {
    location: string;
    state: string;
    bedrooms: number;
    amenities: string[];
    mustHave: string[];
    dealBreakers: string[];
  };
}

export interface Listing {
  id: string;
  title: string;
  address: string;
  neighborhood: string;
  city: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  amenities: string[];
  images: string[];
  description: string;
  available: string;
  petFriendly: boolean;
  parking: boolean;
  laundry: 'in-unit' | 'shared' | 'none';
  type: 'apartment' | 'house' | 'condo' | 'townhouse';
}

export interface MatchResult {
  listing: Listing;
  score: number;
  matchSummary: string;
  perPersonBudgetShare: number;
  pros: string[];
  cons: string[];
}

export type AppStep = 'welcome' | 'setup' | 'results';
