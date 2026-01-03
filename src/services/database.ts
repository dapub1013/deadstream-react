import Dexie, { type Table } from 'dexie';
import type { Show } from '../types/show';

class DeadStreamDatabase extends Dexie {
  shows!: Table<Show, number>;

  constructor() {
    super('DeadStreamDB');
    
    this.version(1).stores({
      shows: '++id, identifier, date, venue, state, avgRating, [date+avgRating]'
    });
  }
}

export const db = new DeadStreamDatabase();

// Helper functions
export async function addShow(show: Omit<Show, 'id'>): Promise<number> {
  return db.shows.add(show);
}

export async function getShowByIdentifier(identifier: string): Promise<Show | undefined> {
  return db.shows.where('identifier').equals(identifier).first();
}

export async function getShowsByDate(date: string): Promise<Show[]> {
  return db.shows.where('date').equals(date).toArray();
}

export async function getShowsByYear(year: number): Promise<Show[]> {
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;
  
  return db.shows
    .where('date')
    .between(startDate, endDate, true, true)
    .toArray();
}

export async function getTopRatedShows(limit = 10): Promise<Show[]> {
  return db.shows
    .where('avgRating')
    .above(0)
    .sortBy('avgRating')
    .then(shows => shows.reverse().slice(0, limit));
}

export async function searchByVenue(venueName: string): Promise<Show[]> {
  return db.shows
    .where('venue')
    .startsWithIgnoreCase(venueName)
    .toArray();
}

export async function getShowCount(): Promise<number> {
  return db.shows.count();
}

export async function clearAllShows(): Promise<void> {
  return db.shows.clear();
}