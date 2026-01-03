# Database Schema Documentation

**Created:** December 2025  
**Phase:** 3.1 - Database Schema Design  
**Version:** 1.0

---

## Overview

The DeadStream database uses SQLite to store information about Grateful Dead concerts from the Internet Archive. The schema is designed for:

- **Fast browsing** - Indexed queries for date, venue, year, state, rating
- **Minimal storage** - Only essential fields initially (lazy load the rest)
- **Simple maintenance** - Single table, clear structure, easy to understand
- **Future extensibility** - Can add tracks table in Phase 4

---

## Schema Design

### Shows Table

The `shows` table is the heart of the database. Each row represents one recording of a Grateful Dead show.

```sql
CREATE TABLE shows (
    identifier TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    venue TEXT,
    city TEXT,
    state TEXT,
    avg_rating REAL,
    num_reviews INTEGER,
    source_type TEXT,
    taper TEXT,
    last_updated TEXT
);
```

### Field Descriptions

#### identifier (TEXT, PRIMARY KEY)
- **Purpose:** Unique ID from Internet Archive
- **Example:** `gd1977-05-08.sbd.hicks.4982.sbeok.shnf`
- **Format:** Archive.org identifier string
- **Constraints:** PRIMARY KEY (must be unique, cannot be NULL)
- **Use:** Lookup shows, fetch metadata, build streaming URLs

**Why this is the primary key:**
- Guaranteed unique by Internet Archive
- Already in our API responses
- Never changes (immutable)
- Natural key (has meaning)

#### date (TEXT, NOT NULL)
- **Purpose:** Date of the show
- **Example:** `1977-05-08`
- **Format:** YYYY-MM-DD (ISO 8601)
- **Constraints:** NOT NULL (every show must have a date)
- **Use:** Browse by date, sort chronologically, "On This Day" feature

**Why TEXT instead of DATE:**
- SQLite doesn't have a native DATE type
- TEXT with YYYY-MM-DD format sorts correctly
- Easy to extract year: `substr(date, 1, 4)`
- Matches API response format directly

#### venue (TEXT)
- **Purpose:** Name of the venue where show was performed
- **Example:** `Barton Hall, Cornell University`
- **Format:** Free text, may include building and institution
- **Constraints:** Can be NULL (some shows missing venue info)
- **Use:** Browse by venue, display show information

**Note:** Venue names can vary (e.g., "Fillmore West" vs "The Fillmore West"). Normalization will be handled in browse queries.

#### city (TEXT)
- **Purpose:** City where show took place
- **Example:** `Ithaca`
- **Format:** City name only (no state)
- **Constraints:** Can be NULL
- **Use:** Display location, filter by city

**Populated from:** Parsed from API `coverage` field (format: "City, State")

#### state (TEXT)
- **Purpose:** State where show took place
- **Example:** `NY`
- **Format:** 2-letter state abbreviation
- **Constraints:** Can be NULL
- **Use:** Browse by state, filter by region

**Populated from:** Parsed from API `coverage` field

**Why separate city and state:**
- Enables "Browse by State" feature
- Can index state for fast lookups
- Easier filtering (all California shows, etc.)

#### avg_rating (REAL)
- **Purpose:** Average community rating for this show
- **Example:** `4.7`
- **Format:** Decimal number, typically 0.0 to 5.0
- **Constraints:** Can be NULL (shows with no ratings)
- **Use:** Sort top shows, display quality indicator

**REAL type:** SQLite's floating-point number type

#### num_reviews (INTEGER)
- **Purpose:** Number of community reviews
- **Example:** `42`
- **Format:** Integer count
- **Constraints:** Can be NULL
- **Use:** Indicate popularity, assess data reliability

**Why track this:**
- Shows with many reviews are more reliable
- Indicates popular/legendary shows
- Helps with show selection in Phase 5

#### source_type (TEXT)
- **Purpose:** Recording source type
- **Example:** `sbd` (soundboard), `aud` (audience), `matrix`
- **Format:** Short text code
- **Constraints:** Can be NULL
- **Use:** Show selection (prefer soundboard), display info

**Initially NULL:** Lazy loaded when needed in Phase 5 (show selection algorithm)

**Why lazy load:**
- Not in minimal API fields
- Requires parsing metadata
- Only needed when selecting best version
- Keeps initial download fast

#### taper (TEXT)
- **Purpose:** Name of person who recorded the show
- **Example:** `Charlie Miller`
- **Format:** Person's name
- **Constraints:** Can be NULL
- **Use:** Display recording info, quality assessment

**Initially NULL:** Lazy loaded when needed

**Why track taper:**
- Certain tapers known for quality (Miller, Healy, etc.)
- Useful for show selection algorithm
- Interesting to Deadheads

#### last_updated (TEXT)
- **Purpose:** When this show was last updated in our database
- **Example:** `2025-12-20T15:30:00`
- **Format:** ISO 8601 datetime (YYYY-MM-DDTHH:MM:SS)
- **Constraints:** Can be NULL initially
- **Use:** Database maintenance, update mechanism

**Why track this:**
- Know when data is stale
- Decide which shows to refresh
- Debug update mechanism

---

## Indexes

Indexes make queries fast. Without them, SQLite would scan every row. With them, SQLite jumps directly to matching rows.

### idx_date
```sql
CREATE INDEX idx_date ON shows(date);
```
**Purpose:** Fast date-based queries  
**Speeds up:**
- "Show me shows on 1977-05-08"
- "Shows in May 1977"
- Chronological sorting

### idx_venue
```sql
CREATE INDEX idx_venue ON shows(venue);
```
**Purpose:** Fast venue-based queries  
**Speeds up:**
- "Shows at Winterland"
- "All Fillmore shows"
- Venue browsing

### idx_rating
```sql
CREATE INDEX idx_rating ON shows(avg_rating);
```
**Purpose:** Fast rating-based sorting  
**Speeds up:**
- "Top 50 rated shows"
- "Shows rated > 4.5"
- Rating-based ordering

### idx_year
```sql
CREATE INDEX idx_year ON shows(substr(date, 1, 4));
```
**Purpose:** Fast year-based queries  
**Speeds up:**
- "All shows in 1977"
- "Browse by year"
- Year filtering

**How it works:** Extracts year from date using `substr(date, 1, 4)`
- `substr(date, 1, 4)` means "substring of date, starting at position 1, length 4"
- `1977-05-08` -> `1977`

### idx_state
```sql
CREATE INDEX idx_state ON shows(state);
```
**Purpose:** Fast state-based queries  
**Speeds up:**
- "All California shows"
- "Browse by state"
- Regional filtering

### idx_date_rating (Compound Index)
```sql
CREATE INDEX idx_date_rating ON shows(date, avg_rating DESC);
```
**Purpose:** Combined date + rating queries  
**Speeds up:**
- "Best shows of 1977"
- "Top shows of May 1977"
- Date-filtered rating sorts

**DESC:** Rating sorted descending (5.0 before 4.0)

---

## Why This Schema?

### Design Decisions

**1. Shows-Only Table (No Tracks Yet)**
- **Rationale:** Phase 3 is about browsing, not playing
- **Benefit:** Simpler, faster to populate
- **Future:** Add tracks table in Phase 4

**2. Minimal Fields Initially**
- **Rationale:** Lazy loading strategy
- **Benefit:** 15-30 minute initial download vs 1-2 hours
- **Future:** Fetch source_type/taper on-demand

**3. TEXT for Dates**
- **Rationale:** SQLite best practice
- **Benefit:** Sorts correctly, easy to parse
- **Tradeoff:** Can't do date arithmetic (not needed)

**4. Multiple Indexes**
- **Rationale:** Support all browse modes
- **Benefit:** Fast queries (<100ms target)
- **Tradeoff:** Slightly larger file (negligible)

**5. NULL-Friendly Design**
- **Rationale:** API data inconsistent
- **Benefit:** Handles missing data gracefully
- **Approach:** Always check for NULL in queries

### Alternative Approaches Considered

**Separate Venues Table:**
- **Rejected:** Over-engineered for Phase 3
- **Reason:** Venue names already normalized enough
- **Future:** Could add if needed

**Integer IDs for Primary Key:**
- **Rejected:** Archive.org identifier is natural key
- **Reason:** Identifier is unique, meaningful, stable
- **Future:** Won't change

**Normalized City/State Table:**
- **Rejected:** Overkill for 50 US states
- **Reason:** Simple TEXT fields sufficient
- **Future:** Won't change

---

## Performance Characteristics

### Query Performance Targets

With ~15,000 shows:
- **Simple lookup:** <10ms (e.g., get show by identifier)
- **Indexed search:** <50ms (e.g., shows in 1977)
- **Full table scan:** <100ms (e.g., shows without rating)
- **Complex query:** <200ms (e.g., top shows by state and year)

**Reality check:** SQLite is fast. 15,000 rows is tiny by database standards.

### Storage Estimates

**Database file size:**
- **Empty database:** <100 KB (just schema)
- **With 15,000 shows:** 5-10 MB
- **Breakdown:**
  - Show data: ~4-8 MB
  - Indexes: ~1-2 MB
  - Overhead: <1 MB

**Per-show estimate:** ~300-600 bytes per record

---

## Migration Strategy

### Phase 4: Adding Tracks Table

When we need playback in Phase 4:

```sql
CREATE TABLE tracks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    show_identifier TEXT NOT NULL,
    track_number INTEGER NOT NULL,
    filename TEXT NOT NULL,
    title TEXT,
    duration REAL,
    format TEXT,
    size INTEGER,
    FOREIGN KEY (show_identifier) REFERENCES shows(identifier)
);

CREATE INDEX idx_tracks_show ON tracks(show_identifier);
```

**Migration approach:**
1. Add tracks table (doesn't affect existing shows table)
2. Populate tracks on first playback of each show
3. Cache for future plays
4. No need to migrate existing data

---

## Usage Examples

### Create Database
```python
import sqlite3
from src.database.schema import SCHEMA_SQL

conn = sqlite3.connect('data/shows.db')
cursor = conn.cursor()

for sql in SCHEMA_SQL:
    cursor.execute(sql)

conn.commit()
conn.close()
```

### Insert a Show
```python
show_data = {
    'identifier': 'gd1977-05-08.sbd.hicks.4982.sbeok.shnf',
    'date': '1977-05-08',
    'venue': 'Barton Hall, Cornell University',
    'city': 'Ithaca',
    'state': 'NY',
    'avg_rating': 4.8,
    'num_reviews': 156,
    'source_type': None,  # Lazy load later
    'taper': None,        # Lazy load later
    'last_updated': '2025-12-20T15:30:00'
}

cursor.execute("""
    INSERT OR IGNORE INTO shows 
    (identifier, date, venue, city, state, avg_rating, num_reviews, 
     source_type, taper, last_updated)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
""", tuple(show_data.values()))
```

### Query Shows
```python
# Get all shows from 1977
cursor.execute("SELECT * FROM shows WHERE date LIKE '1977-%'")
shows_1977 = cursor.fetchall()

# Get top rated shows
cursor.execute("""
    SELECT identifier, date, venue, avg_rating 
    FROM shows 
    WHERE avg_rating IS NOT NULL 
    ORDER BY avg_rating DESC 
    LIMIT 50
""")
top_shows = cursor.fetchall()

# Get shows in New York
cursor.execute("SELECT * FROM shows WHERE state = 'NY'")
ny_shows = cursor.fetchall()
```

---

## Validation Rules

Data going into the database must be validated:

### Required Fields
- **identifier:** Must not be empty
- **date:** Must match YYYY-MM-DD format

### Optional Fields
- All other fields can be NULL
- Empty strings converted to NULL

### Data Types
- **avg_rating:** 0.0 to 5.0 (validate before insert)
- **num_reviews:** Non-negative integer
- **state:** 2-letter abbreviation (if provided)
- **date:** Valid date (no future dates)

### Constraints Enforced by SQLite
- **PRIMARY KEY:** identifier must be unique
- **NOT NULL:** date cannot be NULL
- **Type affinity:** SQLite attempts type conversion

---

## Maintenance

### Database Backup
```bash
# Simple file copy (database is just a file)
cp data/shows.db data/shows.db.backup

# Or use SQLite backup command
sqlite3 data/shows.db ".backup data/shows.db.backup"
```

### Database Verification
```sql
-- Check for integrity issues
PRAGMA integrity_check;

-- Show table info
PRAGMA table_info(shows);

-- Show index info
PRAGMA index_list(shows);

-- Count shows
SELECT COUNT(*) FROM shows;

-- Show statistics
SELECT 
    COUNT(*) as total_shows,
    COUNT(avg_rating) as shows_with_ratings,
    AVG(avg_rating) as average_rating,
    MIN(date) as earliest_show,
    MAX(date) as latest_show
FROM shows;
```

---

## Summary

The DeadStream database schema is:
- **Simple** - Single table, clear structure
- **Fast** - Indexed for all browse patterns
- **Maintainable** - Well-documented, easy to understand
- **Extensible** - Can add tracks table in Phase 4

**Next Steps:**
- Phase 3.2: Create the database file
- Phase 3.3: Write population script
- Phase 3.4: Download all show data
- Phase 3.5: Implement query functions

---

**Schema Version:** 1.0  
**Last Updated:** December 2025  
**Status:** Production Ready
