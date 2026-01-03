export interface Show {
  id?: number;
  identifier: string;
  date: string;
  venue: string;
  city: string;
  state: string;
  avgRating: number;
  numReviews: number;
  sourceType: 'sbd' | 'aud' | 'matrix' | null;
  taper: string | null;
  lastUpdated: string;
}

export interface ShowSearchParams {
  date?: string;
  year?: number;
  venue?: string;
  state?: string;
  minRating?: number;
  sourceType?: 'sbd' | 'aud' | 'matrix';
  limit?: number;
}