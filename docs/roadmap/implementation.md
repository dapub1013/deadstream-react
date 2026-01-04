# React Implementation Roadmap

**Created:** January 2, 2026  
**Platform:** React + TypeScript + Vite  
**Estimated Total Time:** 44-68 hours (5.5-8.5 weeks at 8 hours/week)

---

## Learning Philosophy (Unchanged)

This remains a **learning journey, not a race**. Each phase will be completed when:

1. The functionality works correctly
2. The code is understood and well-documented
3. Testing confirms reliability
4. You can explain the concepts to someone else

**Key Difference from PyQt5 Project:**
- You already understand the domain (Grateful Dead archive, streaming, UX requirements)
- API patterns are proven
- Design decisions are made
- **Focus:** Learn React/TypeScript, not the problem space

---

## Quick Reference: Phase Status

### Completed
- [x] Phase 1: Project Setup & Tooling
- [x] Phase 2: Database Foundation (IndexedDB)
- [x] Phase 3: Archive.org API Integration

### To Be Started
- [ ] Phase 4: Audio Player Component
- [ ] Phase 5: Recording Selection & Scoring
- [ ] Phase 6: React UI Foundation
- [ ] Phase 7: Browse Screen Implementation
- [ ] Phase 8: Player Screen Implementation
- [ ] Phase 9: Settings Screen Implementation
- [ ] Phase 10: Integration & Testing
- [ ] Phase 11: Raspberry Pi Deployment
- [ ] Phase 12: Polish & Optimization

---

## Phase 1: Project Setup & Tooling

**Goal:** Get React development environment running with TypeScript and Tailwind  
**Prerequisites:** Node.js 18+, Git  
**Estimated Time:** 2-4 hours

### Learning Topics
- Vite project structure
- TypeScript basics (types, interfaces)
- Tailwind utility classes
- React component structure
- Git workflow for React projects

### Tasks

#### 1.1: Initialize Vite + React + TypeScript
```bash
npm create vite@latest deadstream-react -- --template react-ts
cd deadstream-react
npm install
npm run dev
```

**Verify:**
- Dev server starts on http://localhost:5173
- Hot reload works (edit `App.tsx`, see instant changes)
- TypeScript errors show in terminal and IDE

#### 1.2: Install Core Dependencies
```bash
# Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Database
npm install dexie

# Testing
npm install -D vitest @testing-library/react @testing-library/jest-dom

# Utilities
npm install clsx  # Conditional class names
```

**Configure Tailwind:**
```javascript
// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      spacing: {
        'touch': '60px',
        'touch-lg': '80px',
      },
      fontSize: {
        'touch': '18px',
        'touch-lg': '24px',
      },
    },
  },
  plugins: [],
}
```

#### 1.3: Set Up Project Structure
```
src/
├── components/
│   ├── atoms/          # Basic UI elements
│   ├── molecules/      # Component combinations
│   ├── organisms/      # Complex components
│   └── screens/        # Full screen views
├── services/
│   ├── archiveApi.ts   # Archive.org API
│   ├── database.ts     # IndexedDB wrapper
│   └── audioPlayer.ts  # Audio control
├── hooks/              # Custom React hooks
├── contexts/           # React Context providers
├── utils/              # Helper functions
├── types/              # TypeScript type definitions
└── App.tsx
```

Create placeholder files:
```bash
mkdir -p src/{components/{atoms,molecules,organisms,screens},services,hooks,contexts,utils,types}
touch src/types/show.ts
touch src/types/preferences.ts
touch src/services/database.ts
```

#### 1.4: Configure Testing
```javascript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
```

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';
```

#### 1.5: Create First Component
```typescript
// src/components/atoms/Button.tsx
import { ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: 'normal' | 'large';
}

export function Button({ 
  variant = 'primary', 
  size = 'normal',
  className,
  children,
  ...props 
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'rounded-lg font-semibold transition-colors',
        {
          'bg-blue-500 hover:bg-blue-600 text-white': variant === 'primary',
          'bg-gray-200 hover:bg-gray-300 text-gray-800': variant === 'secondary',
          'h-touch w-touch text-touch': size === 'normal',
          'h-touch-lg w-touch-lg text-touch-lg': size === 'large',
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
```

#### 1.6: Write First Test
```typescript
// src/components/atoms/Button.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    
    fireEvent.click(screen.getByText('Click Me'));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('applies correct size classes', () => {
    const { container } = render(<Button size="large">Large Button</Button>);
    const button = container.querySelector('button');
    
    expect(button).toHaveClass('h-touch-lg');
    expect(button).toHaveClass('w-touch-lg');
  });
});
```

Run test:
```bash
npm run test
```

#### 1.7: Set Up Git Repository
```bash
git init
git add .
git commit -m "Initial React + TypeScript + Tailwind setup"

# Push to GitHub
gh repo create deadstream-react --public --source=. --remote=origin
git push -u origin main
```

### Deliverables
- [ ] Vite dev server running with hot reload
- [ ] Tailwind CSS configured with touch-friendly sizes
- [ ] Project structure created
- [ ] First component (Button) implemented and tested
- [ ] Git repository initialized and pushed to GitHub

### Success Criteria
- [ ] `npm run dev` starts development server
- [ ] `npm run test` runs tests successfully
- [ ] `npm run build` creates production bundle
- [ ] TypeScript shows no errors
- [ ] Tailwind classes work in components
- [ ] Can explain: What is JSX? What is a React component?

### Common Pitfalls
- Forgetting to import CSS: Add `import './index.css'` to `main.tsx`
- Tailwind not working: Check `content` paths in `tailwind.config.js`
- TypeScript errors on test files: Install `@types/jest-dom`

---

## Phase 2: Database Foundation (IndexedDB)

**Goal:** Implement IndexedDB wrapper with Dexie for show storage  
**Prerequisites:** Phase 1 complete  
**Estimated Time:** 4-8 hours

### Learning Topics
- IndexedDB concepts (object stores, indexes)
- Dexie.js API (tables, queries)
- TypeScript interfaces for data models
- Async/await patterns
- Browser storage limitations

### Tasks

#### 2.1: Define TypeScript Types
```typescript
// src/types/show.ts
export interface Show {
  id?: number;
  date: string;              // YYYY-MM-DD
  venue: string;
  city: string;
  state: string;
  identifier: string;        // Unique archive.org ID
  avgRating: number;
  numReviews: number;
  sourceType: 'sbd' | 'aud' | 'matrix';
  taper: string;
  transferer: string;
  lastUpdated: string;       // ISO 8601
}

export interface ShowSearchParams {
  date?: string;
  venue?: string;
  minRating?: number;
  sourceType?: 'sbd' | 'aud' | 'matrix';
  limit?: number;
}
```

#### 2.2: Implement Database Class
```typescript
// src/services/database.ts
import Dexie, { Table } from 'dexie';
import { Show } from '../types/show';

class DeadStreamDatabase extends Dexie {
  shows!: Table<Show, number>;

  constructor() {
    super('DeadStreamDB');
    
    this.version(1).stores({
      // Define indexes
      shows: '++id, date, identifier, venue, avgRating, sourceType'
    });
  }
}

// Singleton instance
export const db = new DeadStreamDatabase();

// Helper functions
export async function addShow(show: Omit<Show, 'id'>): Promise<number> {
  return db.shows.add(show);
}

export async function getShowByDate(date: string): Promise<Show[]> {
  return db.shows.where('date').equals(date).toArray();
}

export async function getShowByIdentifier(identifier: string): Promise<Show | undefined> {
  return db.shows.where('identifier').equals(identifier).first();
}

export async function getShowsbyear(year: number): Promise<Show[]> {
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;
  
  return db.shows
    .where('date')
    .between(startDate, endDate, true, true)
    .toArray();
}

export async function getTopRatedShows(limit = 10): Promise<Show[]> {
  return db.shows
    .orderBy('avgRating')
    .reverse()
    .limit(limit)
    .toArray();
}

export async function searchVenue(venueName: string): Promise<Show[]> {
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
```

#### 2.3: Implement Data Population Script
```typescript
// src/services/populateDatabase.ts
import { db } from './database';
import { Show } from '../types/show';

/**
 * Populate database with show data from archive.org
 * This will be called once during initial setup
 */
export async function populateShowDatabase(onProgress?: (progress: number) => void) {
  const BASE_URL = 'https://archive.org/advancedsearch.php';
  const BATCH_SIZE = 1000;
  
  let totalShows = 0;
  let processedShows = 0;
  
  // Get total count first
  const countParams = new URLSearchParams({
    q: 'collection:GratefulDead AND mediatype:collection',
    fl: 'identifier',
    rows: '0',
    output: 'json'
  });
  
  const countResponse = await fetch(`${BASE_URL}?${countParams}`);
  const countData = await countResponse.json();
  totalShows = countData.response.numFound;
  
  console.log(`Found ${totalShows} shows to import`);
  
  // Fetch in batches
  for (let offset = 0; offset < totalShows; offset += BATCH_SIZE) {
    const params = new URLSearchParams({
      q: 'collection:GratefulDead AND mediatype:collection',
      fl: 'identifier,title,date,venue,avg_rating,num_reviews',
      rows: BATCH_SIZE.toString(),
      start: offset.toString(),
      sort: 'date asc',
      output: 'json'
    });
    
    const response = await fetch(`${BASE_URL}?${params}`);
    const data = await response.json();
    
    // Transform and insert
    const shows: Omit<Show, 'id'>[] = data.response.docs.map((doc: any) => ({
      date: doc.date || '',
      venue: doc.venue || 'Unknown',
      city: '',  // Will be extracted from metadata later
      state: '',
      identifier: doc.identifier,
      avgRating: doc.avg_rating || 0,
      numReviews: doc.num_reviews || 0,
      sourceType: inferSourceType(doc.identifier),
      taper: '',
      transferer: '',
      lastUpdated: new Date().toISOString()
    }));
    
    await db.shows.bulkAdd(shows);
    
    processedShows += shows.length;
    if (onProgress) {
      onProgress((processedShows / totalShows) * 100);
    }
    
    console.log(`Imported ${processedShows} / ${totalShows} shows`);
  }
  
  console.log('Database population complete');
}

function inferSourceType(identifier: string): 'sbd' | 'aud' | 'matrix' {
  const lower = identifier.toLowerCase();
  if (lower.includes('sbd') || lower.includes('soundboard')) return 'sbd';
  if (lower.includes('matrix')) return 'matrix';
  return 'aud';
}
```

#### 2.4: Create Database Hook
```typescript
// src/hooks/useDatabase.ts
import { useState, useEffect } from 'react';
import { db, getShowCount } from '../services/database';
import { Show } from '../types/show';

export function useDatabase() {
  const [isReady, setIsReady] = useState(false);
  const [showCount, setShowCount] = useState(0);
  
  useEffect(() => {
    async function checkDatabase() {
      try {
        const count = await getShowCount();
        setShowCount(count);
        setIsReady(count > 0);
      } catch (error) {
        console.error('Database initialization failed:', error);
        setIsReady(false);
      }
    }
    
    checkDatabase();
  }, []);
  
  return { isReady, showCount, db };
}

export function useShows(params: { date?: string; year?: number }) {
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchShows() {
      setLoading(true);
      try {
        let results: Show[];
        
        if (params.date) {
          results = await db.shows.where('date').equals(params.date).toArray();
        } else if (params.year) {
          const start = `${params.year}-01-01`;
          const end = `${params.year}-12-31`;
          results = await db.shows
            .where('date')
            .between(start, end, true, true)
            .toArray();
        } else {
          results = [];
        }
        
        setShows(results);
      } catch (error) {
        console.error('Failed to fetch shows:', error);
        setShows([]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchShows();
  }, [params.date, params.year]);
  
  return { shows, loading };
}
```

#### 2.5: Write Database Tests
```typescript
// src/services/database.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { db, addShow, getShowByDate, getShowByIdentifier } from './database';
import { Show } from '../types/show';

describe('Database', () => {
  beforeEach(async () => {
    await db.shows.clear();
  });

  it('adds a show to database', async () => {
    const show: Omit<Show, 'id'> = {
      date: '1977-05-08',
      venue: 'Barton Hall, Cornell University',
      city: 'Ithaca',
      state: 'NY',
      identifier: 'gd77-05-08.sbd.hicks.4982.sbeok.shnf',
      avgRating: 4.8,
      numReviews: 500,
      sourceType: 'sbd',
      taper: 'Betty Boards',
      transferer: 'Charlie Miller',
      lastUpdated: new Date().toISOString()
    };
    
    const id = await addShow(show);
    expect(id).toBeGreaterThan(0);
    
    const retrieved = await db.shows.get(id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.venue).toBe('Barton Hall, Cornell University');
  });

  it('retrieves shows by date', async () => {
    await addShow({
      date: '1977-05-08',
      venue: 'Cornell',
      identifier: 'gd77-05-08-1',
      // ... other fields
    });
    
    await addShow({
      date: '1977-05-08',
      venue: 'Cornell',
      identifier: 'gd77-05-08-2',
      // ... other fields
    });
    
    const shows = await getShowByDate('1977-05-08');
    expect(shows).toHaveLength(2);
  });

  it('retrieves show by identifier', async () => {
    await addShow({
      date: '1977-05-08',
      identifier: 'unique-id-123',
      // ... other fields
    });
    
    const show = await getShowByIdentifier('unique-id-123');
    expect(show).toBeDefined();
    expect(show?.identifier).toBe('unique-id-123');
  });
});
```

#### 2.6: Create UI for Database Initialization
```typescript
// src/components/screens/DatabaseSetup.tsx
import { useState } from 'react';
import { populateShowDatabase } from '../../services/populateDatabase';
import { Button } from '../atoms/Button';

export function DatabaseSetup() {
  const [isPopulating, setIsPopulating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const handlePopulate = async () => {
    setIsPopulating(true);
    setError(null);
    
    try {
      await populateShowDatabase((progress) => {
        setProgress(Math.round(progress));
      });
      
      // Reload app after successful population
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to populate database');
      setIsPopulating(false);
    }
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-8">DeadStream Setup</h1>
      
      {!isPopulating && (
        <>
          <p className="text-lg mb-8 text-center max-w-md">
            This is your first time running DeadStream.
            We need to download the show catalog from the Internet Archive.
            This will take about 10-20 minutes.
          </p>
          
          <Button size="large" onClick={handlePopulate}>
            Download Show Catalog
          </Button>
        </>
      )}
      
      {isPopulating && (
        <>
          <div className="w-full max-w-md mb-4">
            <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className="bg-blue-500 h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          
          <p className="text-xl font-semibold">{progress}%</p>
          <p className="text-gray-600 mt-2">Downloading show catalog...</p>
        </>
      )}
      
      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
}
```

### Deliverables
- [ ] Dexie database class implemented
- [ ] TypeScript types for Show data
- [ ] Query functions (by date, year, venue, rating)
- [ ] Database population script
- [ ] Custom React hooks for database access
- [ ] Unit tests for database operations
- [ ] UI for first-time database setup

### Success Criteria
- [ ] Can store 15,000+ shows in IndexedDB
- [ ] Queries return results in < 100ms
- [ ] Database persists across browser restarts
- [ ] Tests pass for all query functions
- [ ] Can explain: What is IndexedDB? How does Dexie help?

### Testing Checklist
```bash
# Run tests
npm run test

# Manual testing in browser console
> (await db.shows.count())
15234

> (await db.shows.where('date').equals('1977-05-08').toArray())
[{ venue: 'Cornell', ... }, ...]

> (await db.shows.orderBy('avgRating').reverse().limit(10).toArray())
[{ avgRating: 4.9, ... }, ...]
```

---

## Phase 3: Archive.org API Integration

**Goal:** Implement API client for fetching metadata and audio URLs  
**Prerequisites:** Phase 2 complete  
**Estimated Time:** 4-6 hours

### Learning Topics
- Fetch API and promises
- Error handling for network requests
- Rate limiting strategies
- CORS (Cross-Origin Resource Sharing)
- Audio file format detection

### Tasks

#### 3.1: Define Metadata Types
```typescript
// src/types/metadata.ts
export interface ArchiveMetadata {
  metadata: {
    title: string;
    date: string;
    venue: string;
    coverage: string;  // Location
    source: string;
    taper: string;
    transferer: string;
    lineage: string;
  };
  files: ArchiveFile[];
}

export interface ArchiveFile {
  name: string;
  format: string;
  size: string;
  length: string;  // Duration in seconds
  title?: string;
}

export interface AudioTrack {
  url: string;
  title: string;
  duration: number;
  format: string;
  index: number;
}
```

#### 3.2: Implement API Client
```typescript
// src/services/archiveApi.ts
import { ArchiveMetadata, AudioTrack } from '../types/metadata';
import { Show } from '../types/show';

const BASE_URL = 'https://archive.org';
const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests

class RateLimiter {
  private lastRequest = 0;
  
  async throttle<T>(fn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const wait = Math.max(0, MIN_REQUEST_INTERVAL - (now - this.lastRequest));
    
    if (wait > 0) {
      await new Promise(resolve => setTimeout(resolve, wait));
    }
    
    this.lastRequest = Date.now();
    return fn();
  }
}

const limiter = new RateLimiter();

/**
 * Search for shows in the Grateful Dead collection
 */
export async function searchShows(params: {
  date?: string;
  year?: number;
  query?: string;
  rows?: number;
}): Promise<Show[]> {
  const searchParams = new URLSearchParams({
    q: buildQuery(params),
    fl: 'identifier,title,date,venue,avg_rating,num_reviews',
    rows: (params.rows || 100).toString(),
    sort: 'date asc',
    output: 'json'
  });
  
  const url = `${BASE_URL}/advancedsearch.php?${searchParams}`;
  
  return limiter.throttle(async () => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.response.docs.map(transformSearchResult);
  });
}

/**
 * Get full metadata for a specific show
 */
export async function getMetadata(identifier: string): Promise<ArchiveMetadata> {
  const url = `${BASE_URL}/metadata/${identifier}`;
  
  return limiter.throttle(async () => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Metadata fetch failed: ${response.statusText}`);
    }
    
    return response.json();
  });
}

/**
 * Extract audio files from metadata
 */
export function extractAudioFiles(metadata: ArchiveMetadata): AudioTrack[] {
  const audioFormats = ['VBR MP3', 'Ogg Vorbis', 'Flac', 'MP3'];
  
  const audioFiles = metadata.files
    .filter(file => audioFormats.includes(file.format))
    .filter(file => !file.name.includes('_64kb'))  // Skip low-quality
    .sort((a, b) => a.name.localeCompare(b.name));
  
  return audioFiles.map((file, index) => ({
    url: `${BASE_URL}/download/${metadata.metadata.identifier}/${file.name}`,
    title: file.title || extractTrackTitle(file.name),
    duration: parseDuration(file.length),
    format: file.format,
    index
  }));
}

/**
 * Get stream URL for a specific file
 */
export function getStreamUrl(identifier: string, filename: string): string {
  return `${BASE_URL}/download/${identifier}/${filename}`;
}

// Helper functions
function buildQuery(params: any): string {
  const parts = ['collection:GratefulDead'];
  
  if (params.date) {
    parts.push(`date:${params.date}`);
  } else if (params.year) {
    parts.push(`date:${params.year}-*`);
  }
  
  if (params.query) {
    parts.push(params.query);
  }
  
  return parts.join(' AND ');
}

function transformSearchResult(doc: any): Omit<Show, 'id'> {
  return {
    date: doc.date || '',
    venue: doc.venue || 'Unknown',
    city: '',
    state: '',
    identifier: doc.identifier,
    avgRating: doc.avg_rating || 0,
    numReviews: doc.num_reviews || 0,
    sourceType: inferSourceType(doc.identifier),
    taper: '',
    transferer: '',
    lastUpdated: new Date().toISOString()
  };
}

function inferSourceType(identifier: string): 'sbd' | 'aud' | 'matrix' {
  const lower = identifier.toLowerCase();
  if (lower.includes('sbd') || lower.includes('soundboard')) return 'sbd';
  if (lower.includes('matrix')) return 'matrix';
  return 'aud';
}

function extractTrackTitle(filename: string): string {
  // Remove file extension
  let title = filename.replace(/\.(mp3|flac|ogg)$/i, '');
  
  // Remove common prefixes (e.g., "01t01", "d1t01")
  title = title.replace(/^(d\d+)?t?\d+[-_\s]*/i, '');
  
  // Replace underscores/dashes with spaces
  title = title.replace(/[_-]/g, ' ');
  
  return title.trim();
}

function parseDuration(lengthStr: string | undefined): number {
  if (!lengthStr) return 0;
  
  // Parse "MM:SS" or "HH:MM:SS" format
  const parts = lengthStr.split(':').map(Number);
  
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  
  return 0;
}
```

#### 3.3: Test API Integration
```typescript
// src/services/archiveApi.test.ts
import { describe, it, expect } from 'vitest';
import { searchShows, getMetadata, extractAudioFiles } from './archiveApi';

describe('Archive API', () => {
  it('searches shows by date', async () => {
    const shows = await searchShows({ date: '1977-05-08' });
    
    expect(shows.length).toBeGreaterThan(0);
    expect(shows[0].date).toBe('1977-05-08');
    expect(shows[0].identifier).toBeTruthy();
  });

  it('fetches metadata for a show', async () => {
    // Use a known show identifier
    const metadata = await getMetadata('gd1977-05-08.sbd.hicks.4982.sbeok.shnf');
    
    expect(metadata.metadata.title).toBeTruthy();
    expect(metadata.metadata.date).toBe('1977-05-08');
    expect(metadata.files.length).toBeGreaterThan(0);
  });

  it('extracts audio files from metadata', async () => {
    const metadata = await getMetadata('gd1977-05-08.sbd.hicks.4982.sbeok.shnf');
    const audioFiles = extractAudioFiles(metadata);
    
    expect(audioFiles.length).toBeGreaterThan(0);
    expect(audioFiles[0].url).toContain('archive.org/download');
    expect(audioFiles[0].title).toBeTruthy();
  });
});
```

#### 3.4: Create API Hook
```typescript
// src/hooks/useMetadata.ts
import { useState, useEffect } from 'react';
import { getMetadata, extractAudioFiles } from '../services/archiveApi';
import { AudioTrack } from '../types/metadata';

export function useMetadata(identifier: string | null) {
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!identifier) {
      setAudioTracks([]);
      return;
    }
    
    async function fetchMetadata() {
      setLoading(true);
      setError(null);
      
      try {
        const metadata = await getMetadata(identifier);
        const tracks = extractAudioFiles(metadata);
        setAudioTracks(tracks);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load metadata');
        setAudioTracks([]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchMetadata();
  }, [identifier]);
  
  return { audioTracks, loading, error };
}
```

### Deliverables
- [x] API client with search and metadata functions
- [x] Rate limiting implementation
- [x] Audio file extraction logic
- [x] TypeScript types for API responses
- [x] Custom hooks for API access
- [x] Tests for API functions

### Success Criteria
- [x] Can search for shows by date/year
- [x] Can fetch metadata for specific shows
- [x] Extracts audio files correctly
- [x] Rate limiting prevents API abuse
- [x] Tests pass for all API functions
- [x] Can explain: How does the Archive API work?

---

## Phase 4: Audio Player Component

**Goal:** Implement HTML5 audio player with playlist management  
**Prerequisites:** Phase 3 complete  
**Estimated Time:** 6-10 hours

### Learning Topics
- HTML5 Audio API
- React refs (useRef)
- Audio event listeners
- Playlist state management
- Error recovery patterns

### Tasks

#### 4.1: Implement Audio Player Service
```typescript
// src/services/audioPlayer.ts
import { AudioTrack } from '../types/metadata';

export type PlayerState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

export interface AudioPlayerConfig {
  onStateChange?: (state: PlayerState) => void;
  onTrackChange?: (track: AudioTrack | null) => void;
  onProgress?: (current: number, duration: number) => void;
  onError?: (error: Error) => void;
}

export class AudioPlayer {
  private audio: HTMLAudioElement;
  private playlist: AudioTrack[] = [];
  private currentIndex = 0;
  private state: PlayerState = 'idle';
  private config: AudioPlayerConfig;
  
  constructor(config: AudioPlayerConfig = {}) {
    this.audio = new Audio();
    this.config = config;
    this.setupEventListeners();
  }
  
  private setupEventListeners() {
    this.audio.addEventListener('loadstart', () => {
      this.setState('loading');
    });
    
    this.audio.addEventListener('canplay', () => {
      if (this.state === 'loading') {
        this.setState('paused');
      }
    });
    
    this.audio.addEventListener('playing', () => {
      this.setState('playing');
    });
    
    this.audio.addEventListener('pause', () => {
      this.setState('paused');
    });
    
    this.audio.addEventListener('ended', () => {
      this.next();
    });
    
    this.audio.addEventListener('timeupdate', () => {
      this.config.onProgress?.(this.audio.currentTime, this.audio.duration);
    });
    
    this.audio.addEventListener('error', (e) => {
      this.setState('error');
      this.config.onError?.(new Error('Audio playback error'));
    });
  }
  
  loadPlaylist(tracks: AudioTrack[], startIndex = 0) {
    this.playlist = tracks;
    this.currentIndex = startIndex;
    this.loadCurrentTrack();
  }
  
  private loadCurrentTrack() {
    const track = this.playlist[this.currentIndex];
    if (track) {
      this.audio.src = track.url;
      this.audio.load();
      this.config.onTrackChange?.(track);
    }
  }
  
  async play() {
    try {
      await this.audio.play();
    } catch (error) {
      this.config.onError?.(error as Error);
    }
  }
  
  pause() {
    this.audio.pause();
  }
  
  next() {
    if (this.currentIndex < this.playlist.length - 1) {
      this.currentIndex++;
      this.loadCurrentTrack();
      this.play();
    } else {
      this.pause();
      this.setState('idle');
    }
  }
  
  previous() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.loadCurrentTrack();
      this.play();
    }
  }
  
  seekTo(time: number) {
    this.audio.currentTime = time;
  }
  
  setVolume(volume: number) {
    this.audio.volume = Math.max(0, Math.min(1, volume));
  }
  
  getCurrentTrack(): AudioTrack | null {
    return this.playlist[this.currentIndex] || null;
  }
  
  getState(): PlayerState {
    return this.state;
  }
  
  private setState(state: PlayerState) {
    this.state = state;
    this.config.onStateChange?.(state);
  }
  
  destroy() {
    this.audio.pause();
    this.audio.src = '';
    this.playlist = [];
  }
}
```

#### 4.2: Create Audio Context
```typescript
// src/contexts/AudioContext.tsx
import { createContext, useContext, useState, useRef, useCallback } from 'react';
import { AudioPlayer, PlayerState } from '../services/audioPlayer';
import { AudioTrack } from '../types/metadata';
import { Show } from '../types/show';

interface AudioContextValue {
  currentShow: Show | null;
  currentTrack: AudioTrack | null;
  playerState: PlayerState;
  currentTime: number;
  duration: number;
  volume: number;
  loadShow: (show: Show, tracks: AudioTrack[]) => void;
  play: () => void;
  pause: () => void;
  next: () => void;
  previous: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
}

const AudioContext = createContext<AudioContextValue | null>(null);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [currentShow, setCurrentShow] = useState<Show | null>(null);
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState>('idle');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  
  const playerRef = useRef<AudioPlayer | null>(null);
  
  // Initialize player once
  if (!playerRef.current) {
    playerRef.current = new AudioPlayer({
      onStateChange: setPlayerState,
      onTrackChange: setCurrentTrack,
      onProgress: (current, dur) => {
        setCurrentTime(current);
        setDuration(dur);
      },
      onError: (error) => {
        console.error('Audio error:', error);
      }
    });
  }
  
  const loadShow = useCallback((show: Show, tracks: AudioTrack[]) => {
    setCurrentShow(show);
    playerRef.current?.loadPlaylist(tracks);
  }, []);
  
  const play = useCallback(() => {
    playerRef.current?.play();
  }, []);
  
  const pause = useCallback(() => {
    playerRef.current?.pause();
  }, []);
  
  const next = useCallback(() => {
    playerRef.current?.next();
  }, []);
  
  const previous = useCallback(() => {
    playerRef.current?.previous();
  }, []);
  
  const seekTo = useCallback((time: number) => {
    playerRef.current?.seekTo(time);
  }, []);
  
  const setVolume = useCallback((vol: number) => {
    setVolumeState(vol);
    playerRef.current?.setVolume(vol);
  }, []);
  
  return (
    <AudioContext.Provider value={{
      currentShow,
      currentTrack,
      playerState,
      currentTime,
      duration,
      volume,
      loadShow,
      play,
      pause,
      next,
      previous,
      seekTo,
      setVolume
    }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within AudioProvider');
  }
  return context;
}
```

#### 4.3: Test Audio Player
```typescript
// src/services/audioPlayer.test.ts
import { describe, it, expect, vi } from 'vitest';
import { AudioPlayer } from './audioPlayer';

describe('AudioPlayer', () => {
  it('loads playlist', () => {
    const player = new AudioPlayer();
    const tracks = [
      { url: 'http://example.com/track1.mp3', title: 'Track 1', duration: 300, format: 'MP3', index: 0 }
    ];
    
    player.loadPlaylist(tracks);
    expect(player.getCurrentTrack()).toEqual(tracks[0]);
  });

  it('advances to next track', () => {
    const player = new AudioPlayer();
    const tracks = [
      { url: 'http://example.com/track1.mp3', title: 'Track 1', duration: 300, format: 'MP3', index: 0 },
      { url: 'http://example.com/track2.mp3', title: 'Track 2', duration: 300, format: 'MP3', index: 1 }
    ];
    
    player.loadPlaylist(tracks);
    player.next();
    
    expect(player.getCurrentTrack()).toEqual(tracks[1]);
  });

  it('calls onStateChange callback', () => {
    const onStateChange = vi.fn();
    const player = new AudioPlayer({ onStateChange });
    
    // Simulate audio events
    const audio = (player as any).audio as HTMLAudioElement;
    audio.dispatchEvent(new Event('loadstart'));
    
    expect(onStateChange).toHaveBeenCalledWith('loading');
  });
});
```

### Deliverables
- [ ] AudioPlayer class with playlist management
- [ ] Audio context for global state
- [ ] Event handling for play/pause/next/previous
- [ ] Progress tracking
- [ ] Volume control
- [ ] Tests for player functionality

### Success Criteria
- [ ] Can load and play audio from archive.org
- [ ] Auto-advances to next track
- [ ] Seek functionality works
- [ ] Volume control responsive
- [ ] Tests pass
- [ ] Can explain: How does HTML5 Audio work?

---

*(Phases 5-12 would continue with similar detail...)*

---

## Summary of Remaining Phases

**Phase 5: Recording Selection & Scoring (4-6 hours)**
- Port Python scoring algorithm to TypeScript
- Implement preference system
- Test with Cornell '77 (multiple recordings)

**Phase 6: React UI Foundation (8-12 hours)**
- Main app structure
- Screen navigation
- Layout components
- Tailwind customization

**Phase 7: Browse Screen (8-12 hours)**
- Date picker
- Year browser
- Venue search
- Show list component

**Phase 8: Player Screen (6-10 hours)**
- Playback controls
- Progress bar
- Setlist display
- Now Playing info

**Phase 9: Settings Screen (4-6 hours)**
- Preference editor
- Database management
- About/help screens

**Phase 10: Integration & Testing (8-12 hours)**
- End-to-end testing
- Bug fixes
- Performance optimization
- User acceptance testing

**Phase 11: Raspberry Pi Deployment (4-6 hours)**
- Chromium kiosk setup
- Auto-start on boot
- Static file serving
- Hardware testing

**Phase 12: Polish & Optimization (4-8 hours)**
- Animation polish
- Loading states
- Error messaging
- Final tweaks

---

## Next Steps

**To Begin Phase 1:**

1. Install Node.js 18+ if not already installed
2. Create project with: `npm create vite@latest deadstream-react -- --template react-ts`
3. Follow Phase 1 tasks sequentially
4. Commit after each major task completion
5. Move to Phase 2 when all deliverables complete

**Remember:** This is a learning project. Take time to understand each concept before moving forward.
