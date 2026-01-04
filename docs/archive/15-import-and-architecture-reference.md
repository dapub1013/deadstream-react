# Import and Architecture Reference

**Document Purpose:** Authoritative reference for file structure, import patterns, and package organization to prevent import errors and maintain consistency.

**Created:** December 29, 2024  
**Project Phase:** 8 (Settings Implementation)  
**Status:** Living document - update as structure changes

---

## Critical Import Facts

### 1. Project Root and Execution Context

**Working Directory:** Always `~/deadstream` (project root)

**Launch Pattern:**
```bash
# Standard launch (from project root)
cd ~/deadstream
python3 src/ui/main_window.py

# Test file launch
python3 src/ui/screens/settings_screen.py
python3 examples/test_settings_framework.py
```

**Python Path (sys.path) When Running:**
```
0: /Users/dave/deadstream/src/ui/screens
1: /Users/dave/deadstream
2: /Library/Developer/CommandLineTools/Library/Frameworks/Python3.framework/Versions/3.9/lib/python39.zip
3: /Library/Developer/CommandLineTools/Library/Frameworks/Python3.framework/Versions/3.9/lib/python3.9
4: /Library/Developer/CommandLineTools/Library/Frameworks/Python3.framework/Versions/3.9/lib/python3.9/lib-dynload
5: /Users/dave/deadstream/venv/lib/python3.9/site-packages
```

**Critical Insight:** Index 0 changes based on which file is executed. Index 1 is always project root.

---

## 2. Actual Directory Structure

**What EXISTS:**
```
~/deadstream/
├── src/
│   ├── __init__.py          # EMPTY
│   ├── api/
│   │   ├── __init__.py      # EMPTY
│   │   ├── archive_client.py
│   │   ├── helpers.py
│   │   ├── metadata.py
│   │   ├── rate_limiter.py
│   │   └── search.py
│   ├── audio/
│   │   ├── __init__.py      # EMPTY
│   │   ├── network_monitor.py
│   │   ├── playlist.py
│   │   ├── position_tracker.py
│   │   ├── resilient_player.py
│   │   └── vlc_player.py
│   ├── database/
│   │   ├── __init__.py      # EMPTY
│   │   ├── __main__.py
│   │   ├── queries.py
│   │   ├── schema.py
│   │   └── validation.py
│   ├── selection/
│   │   ├── __init__.py      # EMPTY
│   │   ├── analyze_quality_indicators.py
│   │   ├── override.py
│   │   ├── preferences.py
│   │   └── scoring.py
│   ├── ui/
│   │   ├── __init__.py      # EMPTY
│   │   ├── browse_screen.py
│   │   ├── keyboard_handler.py
│   │   ├── main_window.py
│   │   ├── player_screen.py
│   │   ├── screen_manager.py
│   │   ├── settings_screen.py
│   │   ├── transitions.py
│   │   ├── screens/         # SUBDIRECTORY (not a separate package)
│   │   │   ├── browse_screen.py
│   │   │   └── settings_screen.py
│   │   └── widgets/         # PACKAGE
│   │       ├── __init__.py  # 442 bytes - HAS EXPORTS
│   │       ├── date_browser.py
│   │       ├── network_settings_widget.py
│   │       ├── search_widget.py
│   │       ├── show_list.py
│   │       └── year_browser.py
│   └── utils/
│       └── __init__.py      # EMPTY
├── config/
├── data/
├── docs/
├── examples/
├── scripts/
└── tests/
```

**What DOES NOT EXIST:**
- ❌ `src/screens/` - This directory does NOT exist
- ❌ `src/ui/theme.py` - No centralized theme module
- ❌ `src/ui/color_button.py` - No separate color button module

---

## 3. Working Import Patterns

### Pattern A: Importing from Database
**✅ CORRECT:**
```python
from src.database.queries import (
    get_top_rated_shows, 
    get_most_played_venues,
    search_by_venue,
    get_show_by_date
)
```

**Why it works:**
- `src/` is in sys.path (project root)
- `database/` is a package (has `__init__.py`)
- Direct module import

### Pattern B: Importing from Widgets Package
**✅ CORRECT:**
```python
from src.ui.widgets.show_list import ShowListWidget
from src.ui.widgets.date_browser import DateBrowser
from src.ui.widgets.year_browser import YearBrowser
from src.ui.widgets.search_widget import SearchWidget
```

**Why it works:**
- Full path from project root
- `widgets/` has `__init__.py` with exports
- Explicit class imports

**❌ INCORRECT:**
```python
from src.screens.browse_screen import BrowseScreen  # Wrong path!
from ui.widgets import DateBrowser                   # Missing 'src.'
from widgets.show_list import ShowListWidget         # Missing 'src.ui.'
```

### Pattern C: Importing UI Components
**✅ CORRECT (from same directory):**
```python
# When inside src/ui/main_window.py
from src.ui.player_screen import PlayerScreen
from src.ui.browse_screen import BrowseScreen
from src.ui.settings_screen import SettingsScreen
from src.ui.screen_manager import ScreenManager
```

**✅ CORRECT (from subdirectory):**
```python
# When inside src/ui/screens/settings_screen.py
from src.ui.widgets.network_settings_widget import NetworkSettingsWidget
from src.database.queries import get_show_count
```

### Pattern D: Path Manipulation for Standalone Tests
**✅ CORRECT (for files in subdirectories):**
```python
# At top of src/ui/screens/browse_screen.py
import sys
import os

# Add project root to path for imports
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

# Now can import normally
from src.database.queries import get_top_rated_shows
```

**Breakdown:**
- `__file__` = `/Users/dave/deadstream/src/ui/screens/browse_screen.py`
- `dirname(__file__)` = `/Users/dave/deadstream/src/ui/screens`
- `dirname(dirname(__file__))` = `/Users/dave/deadstream/src/ui`
- `dirname(dirname(dirname(__file__)))` = `/Users/dave/deadstream/src`
- `dirname(dirname(dirname(dirname(__file__))))` = `/Users/dave/deadstream` ✅

---

## 4. Package vs Directory

### Packages (have __init__.py)
- `src/` - Empty __init__.py
- `src/api/` - Empty __init__.py
- `src/audio/` - Empty __init__.py
- `src/database/` - Empty __init__.py
- `src/selection/` - Empty __init__.py
- `src/ui/` - Empty __init__.py
- `src/ui/widgets/` - **442 bytes - HAS EXPORTS**
- `src/utils/` - Empty __init__.py

### Directories (no __init__.py)
- `src/ui/screens/` - ❌ NOT a package, just a subdirectory for organization

**Implication:**
```python
# WRONG - screens is not a package
from src.ui.screens.settings_screen import SettingsScreen

# RIGHT - treat as separate files in ui directory
from src.ui.screens.settings_screen import SettingsScreen  # Still works via path manipulation
```

---

## 5. The widgets/__init__.py Exports

**File:** `src/ui/widgets/__init__.py` (442 bytes)

**ACTUAL CONTENTS (Verified Dec 29, 2024):**
```python
"""
UI Widgets Package for DeadStream
Reusable UI components for the application.
Current widgets:
- ShowListWidget: Scrollable list of show cards
- ShowCard: Individual show display card
Future widgets:
- DatePicker
- VenueFilter
- YearSelector
- PlaybackControls
- ProgressBar
"""
from .show_list import ShowListWidget, ShowCard
__all__ = ['ShowListWidget', 'ShowCard']
from .date_browser import DateBrowser
__all__ = ['DateBrowser']
```

**⚠️ BUG IDENTIFIED:**
Multiple `__all__` definitions means only the **last one** takes effect. Currently only `DateBrowser` is exported via `__all__`.

**Why Imports Still Work:**
Explicit imports still work because the modules are imported:
```python
# These work despite __all__ bug
from src.ui.widgets.show_list import ShowListWidget  # Direct import
from src.ui.widgets.date_browser import DateBrowser  # Direct import
from src.ui.widgets.year_browser import YearBrowser  # Direct import
```

**SHOULD BE (Recommended Fix for Future):**
```python
"""
UI Widgets Package for DeadStream
Reusable UI components for the application.
"""
from .show_list import ShowListWidget, ShowCard
from .date_browser import DateBrowser
from .year_browser import YearBrowser
from .search_widget import SearchWidget
from .network_settings_widget import NetworkSettingsWidget

__all__ = [
    'ShowListWidget',
    'ShowCard',
    'DateBrowser',
    'YearBrowser',
    'SearchWidget',
    'NetworkSettingsWidget'
]
```

**Note:** Not urgent to fix since we use explicit imports (`from src.ui.widgets.module import Class`), but should be addressed during Phase 9 polish.

---

## 6. Common Import Errors and Solutions

### Error 1: ModuleNotFoundError: No module named 'screens'
```python
# WRONG
from screens.browse_screen import BrowseScreen
```

**Fix:** Use full path from src/
```python
# RIGHT
from src.ui.screens.browse_screen import BrowseScreen
```

### Error 2: ModuleNotFoundError: No module named 'theme'
```python
# WRONG - theme.py doesn't exist
from src.ui.theme import COLORS
```

**Fix:** Define colors inline or create the file
```python
# RIGHT - define in same file
COLORS = {
    'network': '#3b82f6',
    'audio': '#10b981',
    'display': '#a855f7',
    # ...
}
```

### Error 3: ModuleNotFoundError: No module named 'src'
```python
# File: src/ui/screens/settings_screen.py
from src.database.queries import get_show_count  # Fails!
```

**Fix:** Add path manipulation at top of file
```python
import sys
import os

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

# Now works
from src.database.queries import get_show_count
```

### Error 4: Relative import beyond top-level package
```python
# WRONG - in src/ui/screens/settings_screen.py
from ...database.queries import get_show_count
```

**Fix:** Use absolute imports with path manipulation (see Error 3)

---

## 7. File Location Reference

### Screen Files
**Main Screens (in src/ui/):**
- `player_screen.py` - Player controls and display
- `browse_screen.py` - Browse interface (top-level)
- `settings_screen.py` - Settings interface (top-level)

**Screen Implementations (in src/ui/screens/):**
- `browse_screen.py` - Full browse implementation with all widgets
- `settings_screen.py` - Full settings implementation with categories

### Widget Files (in src/ui/widgets/)
- `show_list.py` - Show list display widget
- `date_browser.py` - Calendar-based date browser
- `year_browser.py` - Year selection grid
- `search_widget.py` - Search interface
- `network_settings_widget.py` - Network configuration UI

### Support Files (in src/ui/)
- `main_window.py` - Application window and screen container
- `screen_manager.py` - Screen switching logic
- `transitions.py` - Screen transition animations
- `keyboard_handler.py` - Keyboard input handling

---

## 8. Import Strategy by File Location

### Files in src/ui/
**Example:** `src/ui/main_window.py`

```python
# Standard imports - project root already in path
from src.ui.player_screen import PlayerScreen
from src.ui.browse_screen import BrowseScreen
from src.ui.settings_screen import SettingsScreen
from src.ui.screen_manager import ScreenManager
from src.database.queries import get_show_count
from src.audio.vlc_player import VLCPlayer
```

### Files in src/ui/screens/
**Example:** `src/ui/screens/settings_screen.py`

```python
import sys
import os

# REQUIRED: Add project root to path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

# Now can use standard imports
from PyQt5.QtWidgets import QWidget, QVBoxLayout
from src.database.queries import get_show_count
from src.ui.widgets.network_settings_widget import NetworkSettingsWidget
```

### Files in examples/
**Example:** `examples/test_settings_framework.py`

```python
import sys
import os

# REQUIRED: Add project root to path
PROJECT_ROOT = os.path.dirname(os.path.dirname(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

# Now can use standard imports
from PyQt5.QtWidgets import QApplication
from src.ui.screens.settings_screen import SettingsScreen
```

---

## 9. Testing Import Patterns

### Standalone Screen Test
```python
#!/usr/bin/env python3
"""
Test file for settings_screen.py
Location: examples/test_settings_framework.py
"""

import sys
import os

# Add project root to path
PROJECT_ROOT = os.path.dirname(os.path.dirname(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from PyQt5.QtWidgets import QApplication
from src.ui.screens.settings_screen import SettingsScreen

if __name__ == "__main__":
    app = QApplication(sys.argv)
    
    screen = SettingsScreen()
    screen.setWindowTitle("Settings Test")
    screen.setGeometry(100, 100, 1280, 720)
    screen.show()
    
    sys.exit(app.exec_())
```

---

## 10. Quick Reference Card

**When writing a new file, ask:**

1. **Where is this file located?**
   - `src/ui/` → No path manipulation needed
   - `src/ui/screens/` → Need path manipulation (4 levels up)
   - `src/ui/widgets/` → Need path manipulation (4 levels up)
   - `examples/` → Need path manipulation (1 level up)

2. **What am I importing?**
   - Database queries → `from src.database.queries import ...`
   - UI widgets → `from src.ui.widgets.widget_name import ...`
   - Audio components → `from src.audio.module_name import ...`
   - Other screens → `from src.ui.screen_name import ...`

3. **Can this file run standalone?**
   - YES → Add path manipulation at top
   - NO → Just use standard imports

**Universal Import Template for Subdirectories:**
```python
import sys
import os

# Calculate path levels based on depth
# 1 level: dirname(__file__)
# 2 levels: dirname(dirname(__file__))
# 3 levels: dirname(dirname(dirname(__file__)))
# 4 levels: dirname(dirname(dirname(dirname(__file__))))

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

# Now import normally from src.*
```

---

## 11. Phase 8 Specific Considerations

### Settings Screen Framework (Task 8.1 Complete)
**Location:** `src/ui/screens/settings_screen.py`

**Working Imports:**
```python
import sys
import os

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from PyQt5.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel,
    QPushButton, QFrame, QStackedWidget
)
from PyQt5.QtCore import Qt
from PyQt5.QtGui import QFont

from src.database.queries import get_show_count
```

### Network Settings Widget (Task 8.2)
**Location:** `src/ui/widgets/network_settings_widget.py`

**Import Requirements:**
- Must be importable from settings_screen.py
- Must be importable from main_window.py
- Must have path manipulation for standalone testing

**Template:**
```python
import sys
import os

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from PyQt5.QtWidgets import QWidget, QVBoxLayout
# Add other imports as needed
```

---

## 12. Update History

**v1.1 (Dec 29, 2024):**
- Verified `src/ui/widgets/__init__.py` contents (Section 5)
- Identified `__all__` bug (multiple definitions)
- Noted bug as non-urgent (Phase 9 polish item)

**v1.0 (Dec 29, 2024):**
- Initial document creation
- Documented actual file structure from Phase 8
- Captured working import patterns from Phases 6-7
- Identified common errors and solutions
- Created quick reference guides

**To Update This Document:**
1. Add new files to section 2 (Directory Structure)
2. Document new import patterns in section 3
3. Add new errors to section 6
4. Update version history here

---

## 13. Verification Checklist

Before creating a new file, verify:

- [ ] I know the exact file location (which directory)
- [ ] I've added path manipulation if needed (subdirectories)
- [ ] I'm using full `from src.module.file import Class` syntax
- [ ] I've tested the file runs standalone (if applicable)
- [ ] No imports reference non-existent files (theme.py, color_button.py)
- [ ] No imports assume wrong paths (src/screens/ doesn't exist)

---

**End of Document**
