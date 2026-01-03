# Grateful Dead Concert Player - API Analysis & Project Plan

## What I Think About the Internet Archive API

### The Good News ðŸ‘

**Rich, Well-Structured API:**
The Internet Archive has excellent APIs for this project. Here are the key strengths:

1. **Advanced Search API** - You can search the entire Grateful Dead collection programmatically:
   ```
   https://archive.org/advancedsearch.php?q=collection:GratefulDead+AND+date:1977-05-08
   &fl=identifier,title,date,venue,source,avg_rating
   &rows=100&output=json
   ```

2. **Metadata API** - For each concert identifier, you can get complete metadata:
   ```
   https://archive.org/metadata/{identifier}
   ```
   This returns extensive info including:
   - All available audio files (MP3, FLAC, OGG)
   - Recording source (Soundboard vs Audience)
   - Taper information
   - Venue, date, setlist
   - File formats and quality
   - User ratings and reviews

3. **Direct Streaming** - Audio files can be streamed directly:
   ```
   https://archive.org/download/{identifier}/{filename}.mp3
   ```

4. **No Authentication Required** for read-only access (perfect for your use case)

### The Challenges âš ï¸

1. **Soundboard Restriction**: Per the search results, soundboard recordings are "Stream Only" (not downloadable) at the band's request. However, this is actually PERFECT for your project since you want to stream anyway!

2. **Multiple Versions Per Show**: Shows typically have 5-15 different recordings/transfers. You'll need smart logic to pick the best one.

3. **Inconsistent Metadata**: Recording quality, source information, and completeness varies significantly between uploads.

4. **Network Requirements**: Your Raspberry Pi will need internet connectivity to stream.

## Recommended Technical Approach

### 1. Data Strategy

**Option A: Pre-built Database (RECOMMENDED)**
- Download a CSV of all shows once using Advanced Search
- Store locally on the Pi with key metadata
- Only query the API when user selects a specific show
- Faster, more reliable, works better on Pi hardware

**Option B: Live API Queries**
- Query API each time user browses
- More real-time but slower
- More network dependent

**My Recommendation:** Option A. Use the Advanced Search to get a master list of all shows with basic info, store it as a SQLite database on the Pi, then only query the full metadata API when the user actually selects a show to play.

### 2. Selection Cascading Logic

Here's how I'd implement your quality preferences:

```python
def select_best_recording(show_date):
    # 1. Search for all recordings of this date
    results = search_api(f"collection:GratefulDead AND date:{show_date}")
    
    # 2. Filter and score each recording
    scored = []
    for recording in results:
        score = 0
        metadata = get_metadata(recording['identifier'])
        
        # Prefer soundboard over audience
        if 'sbd' in recording['identifier'].lower():
            score += 100
        elif 'soundboard' in metadata.get('source', '').lower():
            score += 100
        elif 'matrix' in recording['identifier'].lower():
            score += 75
        elif 'aud' in recording['identifier'].lower():
            score += 25
            
        # Prefer higher ratings
        if metadata.get('avg_rating'):
            score += float(metadata['avg_rating']) * 10
            
        # Prefer certain tapers (charlie miller, etc)
        if 'miller' in recording['identifier'].lower():
            score += 20
            
        # Prefer FLAC > MP3
        has_flac = any('flac' in f['format'].lower() 
                      for f in metadata['files'])
        if has_flac:
            score += 15
            
        # Prefer complete shows
        if metadata.get('num_reviews', 0) > 10:
            score += 10
            
        scored.append((score, recording, metadata))
    
    # 3. Return highest scored
    best = max(scored, key=lambda x: x[0])
    return best[1], best[2]
```

### 3. Playback Implementation

**For Raspberry Pi:**
```python
import pygame
import requests

# Initialize pygame mixer for audio playback
pygame.mixer.init()

def play_show(identifier, metadata):
    # Find the MP3 files
    mp3_files = [f for f in metadata['files'] 
                 if f['format'] == 'VBR MP3']
    
    # Create playlist from tracks
    playlist = []
    for track in sorted(mp3_files, key=lambda x: x['name']):
        url = f"https://archive.org/download/{identifier}/{track['name']}"
        playlist.append(url)
    
    # Stream and play
    for track_url in playlist:
        pygame.mixer.music.load(requests.get(track_url, stream=True).raw)
        pygame.mixer.music.play()
        while pygame.mixer.music.get_busy():
            pygame.time.Clock().tick(10)
```

## UI Recommendations

### Browse Modes

1. **By Date** - Calendar style picker
   - Jump to specific date
   - See which dates have shows
   
2. **By Year** - List years, then shows within
   - Great for era browsing (60s, 70s, 80s, 90s)
   
3. **By Venue** - Favorite venues
   - Fillmore, Winterland, Cornell, etc.
   
4. **Random** - Surprise me!
   - Weight by ratings optionally

5. **Top Rated** - Best shows according to community
   - Filter by era/year

### Playback Screen

**Essential Info:**
- Date and Venue (large, prominent)
- Current track name
- Set indicator (Set I, Set II, Encore)
- Playback progress bar
- Recording source badge (SBD/AUD/Matrix)

**Controls:**
- Play/Pause
- Skip track forward/back
- Volume
- Return to browse

**Nice to Have:**
- Setlist view
- Recording info (taper, lineage)
- Community rating

### Screen Size Considerations

For a **3.5" touchscreen** (common Pi size):
- Keep text large and readable
- Use icons for common actions
- Minimize typing (use lists/buttons)
- Vertical scrolling only
- High contrast colors

For a **7" tablet screen**:
- Can show more info simultaneously
- Split view possible (playlist + player)
- Richer graphics/album art

## Hardware Recommendations

### Raspberry Pi Model
- **Pi 4 (2GB+)**: Best performance, smooth UI
- **Pi 3B+**: Adequate, might be slightly slower
- **Pi Zero 2 W**: Possible but tight on resources

### Screen Options
1. **Official 7" Touchscreen** - Great quality, well-supported
2. **Waveshare 3.5" or 4" HDMI** - Compact, good for portable build
3. **Hyperpixel 4.0"** - Beautiful square display option

### Audio Output
- USB DAC for better sound quality (optional)
- 3.5mm jack works fine
- Bluetooth speaker support

### Power
- Official Pi power supply (critical for stability)
- Battery pack if making it portable

## Software Stack Recommendation

```
Operating System: Raspberry Pi OS Lite
Programming Language: Python 3
UI Framework: PyQt5 or Kivy
Audio Playback: pygame or vlc (python-vlc)
Data Storage: SQLite
HTTP Requests: requests library
```

## Development Phases

### Phase 1: Core Functionality
1. Set up API interaction
2. Build show database
3. Implement selection algorithm
4. Basic playback working

### Phase 2: UI Development  
5. Design screens
6. Implement navigation
7. Touch controls
8. Playback controls

### Phase 3: Polish
9. Optimize performance
10. Add animations/transitions
11. Error handling
12. Settings/preferences

### Phase 4: Physical Build
13. 3D print case
14. Assembly
15. Final testing

## Example API Calls You'll Use

### Get all shows from 1977
```
https://archive.org/advancedsearch.php?
  q=collection:GratefulDead+AND+year:1977
  &fl=identifier,title,date,venue,avg_rating
  &rows=200
  &sort=date+asc
  &output=json
```

### Get metadata for Cornell '77
```
https://archive.org/metadata/gd77-05-08.sbd.hicks.4982.sbeok.shnf
```

### Stream a specific track
```
https://archive.org/download/gd77-05-08.sbd.hicks.4982.sbeok.shnf/gd77-05-08d1t01.mp3
```

## Potential Enhancements

- **Offline Mode**: Cache favorite shows locally
- **Now Playing Stats**: Show play counts, add to favorites
- **Social Features**: Share what you're listening to
- **Discovery Mode**: "Shows like this one"
- **Era Presets**: "Summer '77", "Europe '72", etc.
- **Setlist Search**: "Shows with Dark Star > Drums > Space"
- **Historical Info**: "On this day in Dead history"

## Updating the Master List

### The Good News: It's Actually Pretty Easy!

The Internet Archive provides all the tools needed to efficiently check for updates without re-downloading everything.

### Update Strategy Options

**Option 1: Simple Date-Based Update (RECOMMENDED)**
- Store the last update timestamp
- Query for items added/modified since that date
- Merge new results into your database

**Option 2: Full Re-Scan with Smart Comparison**
- Download fresh list of all identifiers
- Compare against your local database
- Only fetch metadata for new identifiers

**Option 3: Use the Changes API**
- Archive.org has a Changes API specifically for this
- Returns items modified since a given date
- More complex but most efficient

### Implementation: Simple & Effective

Here's a straightforward update function:

```python
import sqlite3
import requests
from datetime import datetime, timedelta
import json

def update_show_database():
    """
    Check for new shows added to Internet Archive and update local database.
    Returns: (number_of_new_shows, number_of_updated_shows)
    """
    
    # Connect to local database
    conn = sqlite3.connect('grateful_dead_shows.db')
    cursor = conn.cursor()
    
    # Get the last update timestamp
    cursor.execute("SELECT MAX(last_updated) FROM shows")
    last_update = cursor.fetchone()[0]
    
    if last_update is None:
        # First run - do full download
        print("First run detected - downloading all shows...")
        return download_all_shows()
    
    # Convert to date format for API query
    last_update_date = datetime.fromisoformat(last_update)
    search_date = last_update_date.strftime('%Y-%m-%d')
    
    print(f"Checking for shows added/updated since {search_date}...")
    
    # Query API for items added since last update
    # Note: Archive.org indexes by 'addeddate' and 'publicdate'
    search_url = "https://archive.org/advancedsearch.php"
    params = {
        'q': f'collection:GratefulDead AND publicdate:[{search_date} TO null]',
        'fl': 'identifier,title,date,venue,avg_rating,publicdate,addeddate',
        'rows': 1000,  # Max per request
        'sort': 'publicdate asc',
        'output': 'json'
    }
    
    response = requests.get(search_url, params=params)
    results = response.json()
    
    new_shows = 0
    updated_shows = 0
    
    # Process each result
    for doc in results['response']['docs']:
        identifier = doc['identifier']
        
        # Check if this show already exists in our database
        cursor.execute("SELECT identifier FROM shows WHERE identifier = ?", 
                      (identifier,))
        exists = cursor.fetchone()
        
        if exists:
            # Update existing show
            cursor.execute("""
                UPDATE shows 
                SET title = ?, date = ?, venue = ?, 
                    avg_rating = ?, last_updated = ?
                WHERE identifier = ?
            """, (
                doc.get('title', ''),
                doc.get('date', ''),
                doc.get('venue', ''),
                doc.get('avg_rating', 0),
                datetime.now().isoformat(),
                identifier
            ))
            updated_shows += 1
        else:
            # Add new show
            cursor.execute("""
                INSERT INTO shows 
                (identifier, title, date, venue, avg_rating, last_updated)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                identifier,
                doc.get('title', ''),
                doc.get('date', ''),
                doc.get('venue', ''),
                doc.get('avg_rating', 0),
                datetime.now().isoformat()
            ))
            new_shows += 1
    
    conn.commit()
    conn.close()
    
    print(f"Update complete: {new_shows} new shows, {updated_shows} updated")
    return new_shows, updated_shows


def check_for_new_versions(show_date):
    """
    For a specific show date, check if new recordings/sources have been added.
    This is useful when a user is browsing a show they've played before.
    """
    
    search_url = "https://archive.org/advancedsearch.php"
    params = {
        'q': f'collection:GratefulDead AND date:{show_date}',
        'fl': 'identifier,publicdate',
        'rows': 100,
        'sort': 'publicdate desc',  # Newest first
        'output': 'json'
    }
    
    response = requests.get(search_url, params=params)
    results = response.json()
    
    # Get identifiers from database for this date
    conn = sqlite3.connect('grateful_dead_shows.db')
    cursor = conn.cursor()
    cursor.execute("""
        SELECT identifier FROM shows WHERE date = ?
    """, (show_date,))
    
    local_identifiers = set(row[0] for row in cursor.fetchall())
    api_identifiers = set(doc['identifier'] 
                         for doc in results['response']['docs'])
    
    # Find new recordings not in our database
    new_recordings = api_identifiers - local_identifiers
    
    conn.close()
    
    return list(new_recordings)


def auto_update_scheduler():
    """
    Run this in a background thread to check for updates periodically.
    Could be triggered daily, weekly, or when device connects to WiFi.
    """
    import schedule
    import time
    
    # Check for updates once per week
    schedule.every().sunday.at("03:00").do(update_show_database)
    
    # Or check daily at 3 AM
    # schedule.every().day.at("03:00").do(update_show_database)
    
    while True:
        schedule.run_pending()
        time.sleep(3600)  # Check every hour if it's time
```

### Smart Update Frequency

**How often should you check?**
- New shows are added relatively infrequently (fan transfers of old shows)
- Weekly or monthly checks are probably sufficient
- Could also check on-demand when user connects to WiFi

**Trigger Options:**
1. **Scheduled**: Weekly on Sunday at 3 AM
2. **On-demand**: User presses "Check for Updates" button
3. **WiFi-triggered**: Auto-check when device connects to network
4. **Hybrid**: Daily check, but only if WiFi is connected

### Bandwidth Considerations

**Initial Download:**
- ~15,000 shows Ã— 500 bytes metadata â‰ˆ 7.5 MB
- One-time download, very manageable

**Weekly Updates:**
- Typically 0-10 new shows per week
- ~5 KB per update check
- Negligible bandwidth

**Display Update Status:**
```python
def show_update_ui():
    """
    Display update status to user
    """
    return {
        'last_checked': '2025-11-15 03:00',
        'last_update': '2025-11-15',
        'shows_in_database': 14823,
        'new_shows_found': 3,
        'next_check': '2025-11-22 03:00'
    }
```

### Handling New Sources for Existing Shows

Here's the interesting part: a single show date might have 10+ different recordings. You'll want to track:

```python
# Database schema for tracking multiple versions
"""
CREATE TABLE recordings (
    id INTEGER PRIMARY KEY,
    show_date TEXT,
    identifier TEXT UNIQUE,
    source_type TEXT,  -- 'sbd', 'aud', 'matrix'
    taper TEXT,
    quality_score REAL,
    added_date TEXT,
    last_checked TEXT
)
"""

def notify_better_version_available(show_date):
    """
    Check if a higher-quality recording is now available
    for shows the user has recently played
    """
    # Get user's play history
    recent_shows = get_recent_plays(days=30)
    
    improvements = []
    for show in recent_shows:
        new_versions = check_for_new_versions(show['date'])
        
        for new_id in new_versions:
            # Fetch metadata for new recording
            new_metadata = get_show_metadata(new_id)
            new_score = calculate_quality_score(new_metadata)
            
            # Compare to what user previously heard
            if new_score > show['quality_score']:
                improvements.append({
                    'date': show['date'],
                    'improvement': 'New soundboard available!',
                    'new_identifier': new_id
                })
    
    return improvements
```

### UI Notifications

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  âœ“ Database Updated             â”‚
â”‚                                 â”‚
â”‚  3 new shows added:             â”‚
â”‚  â€¢ 1967-10-15 (Winterland)     â”‚
â”‚  â€¢ 1973-11-11 (Winterland)     â”‚
â”‚  â€¢ 1989-07-17 (Alpine Valley)  â”‚
â”‚                                 â”‚
â”‚  1 better recording found:      â”‚
â”‚  â€¢ 1977-05-08 (Cornell)        â”‚
â”‚    New Charlie Miller SBD!      â”‚
â”‚                                 â”‚
â”‚         [OK]    [View Shows]    â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Error Handling

```python
def safe_update():
    """
    Robust update with error handling
    """
    try:
        new, updated = update_show_database()
        return {
            'success': True,
            'new_shows': new,
            'updated_shows': updated
        }
    except requests.exceptions.ConnectionError:
        return {
            'success': False,
            'error': 'No internet connection'
        }
    except requests.exceptions.Timeout:
        return {
            'success': False,
            'error': 'Update timed out - will retry later'
        }
    except Exception as e:
        return {
            'success': False,
            'error': f'Update failed: {str(e)}'
        }
```

## Bottom Line

The Internet Archive API is **perfect** for this project. It's well-documented, comprehensive, and designed for exactly this type of use case. The main work will be:

1. Building smart selection logic to pick the best version
2. Creating an intuitive UI for the small screen
3. Handling network reliability gracefully
4. Making the case look cool!
