# DeadStream Project Guidelines for AI Assistance

**Last Updated:** December 23, 2025  
**Purpose:** Standards and best practices for AI-generated code and documentation

---

## Critical Rules for AI Assistance

### 1. Text Encoding - ASCII Only

**RULE:** All code, documentation, and test output must use ASCII characters only.

**Why:** Unicode characters (emojis, checkmarks, special symbols) cause syntax errors and display issues.

**Examples:**

❌ **WRONG:**
```python
print("✓ Test passed")
print("✗ Test failed")
if success:
    print("🎉 Success!")
```

✅ **CORRECT:**
```python
print("[PASS] Test passed")
print("[FAIL] Test failed")
if success:
    print("[SUCCESS] Operation complete!")
```

**Approved ASCII markers:**
- `[OK]`, `[PASS]`, `[SUCCESS]` for success
- `[FAIL]`, `[ERROR]` for failures
- `[WARN]`, `[INFO]` for informational messages
- `>>>`, `---`, `===` for visual separation

**Apply to:**
- Python code (all print statements, comments, docstrings)
- Markdown documentation
- Test output
- Log messages
- Error messages

---

### 2. Test URLs - Use Database, Not Hardcoded URLs

**PROBLEM:** Hardcoded Archive.org URLs become invalid over time (404 errors).

**SOLUTION:** Always get test URLs from the local database at runtime.

#### Standard Pattern for Test Scripts

**❌ WRONG - Hardcoded URL:**
```python
# This will break eventually!
test_url = "https://archive.org/download/gd77-05-08.sbd.hicks.4982.sbeok.shnf/track.mp3"
```

**✅ CORRECT - Dynamic URL from Database:**
```python
import sys
sys.path.insert(0, '/home/david/deadstream')

from src.database.queries import get_show_by_date, get_top_rated_shows
from src.api.metadata import get_metadata, extract_audio_files

def get_test_url():
    """Get a valid test URL from database"""
    # Try Cornell '77
    shows = get_show_by_date('1977-05-08')
    
    # Fallback to top-rated shows
    if not shows:
        shows = get_top_rated_shows(limit=3, min_reviews=5)
    
    # Try each show until we get valid audio
    for show in shows[:3]:
        try:
            metadata = get_metadata(show['identifier'])
            audio_files = extract_audio_files(metadata)
            
            if audio_files:
                url = f"https://archive.org/download/{show['identifier']}/{audio_files[0]['name']}"
                return url
        except:
            continue
    
    return None

# Use in tests
test_url = get_test_url()
if not test_url:
    print("[ERROR] Could not get valid test URL")
    sys.exit(1)

# Now use test_url for testing
```

#### Reference Implementation

Use `examples/get_test_url.py` as a template:

```bash
# Get a valid test URL
python examples/get_test_url.py

# Copy the URL it prints for manual testing
# OR import the function in your test scripts
```

#### When Creating New Test Scripts

**Every test script should:**

1. Import database query functions
2. Import API metadata functions
3. Define `get_test_url()` function (or import from common module)
4. Get URL at runtime, not hardcode it
5. Handle case where no valid URL is found

**Template for new tests:**
```python
#!/usr/bin/env python3
import sys
sys.path.insert(0, '/home/david/deadstream')

from src.database.queries import get_show_by_date
from src.api.metadata import get_metadata, extract_audio_files

def get_test_url():
    """Get valid test URL - see examples/get_test_url.py"""
    shows = get_show_by_date('1977-05-08')
    if not shows:
        return None
    
    try:
        metadata = get_metadata(shows[0]['identifier'])
        audio_files = extract_audio_files(metadata)
        if audio_files:
            return f"https://archive.org/download/{shows[0]['identifier']}/{audio_files[0]['name']}"
    except:
        pass
    
    return None

def main():
    test_url = get_test_url()
    if not test_url:
        print("[FAIL] No valid test URL")
        return 1
    
    # Your test code here
    print(f"Testing with: {test_url}")
    
if __name__ == '__main__':
    sys.exit(main())
```

---

### 3. VLC Configuration - Use Verified Settings

**Standard VLC instance creation:**

```python
import vlc

# For Raspberry Pi with ALSA audio (headphones/speakers)
instance = vlc.Instance(
    '--aout=alsa',           # ALSA audio output
    '--no-video',            # Audio only
    '--quiet',               # Suppress output
    '--verbose=0',           # No error messages
    '--network-caching=8000' # 8 second buffer for streaming
)
```

**Do NOT use:**
- `--no-xlib` (breaks audio on Pi with headphones)
- Hardcoded audio devices like `hw:2,0` (not portable)

**Already verified and working** in:
- `src/audio/resilient_player.py`
- Use this as reference for all VLC code

---

### 4. Error Handling Standards

**Always include:**

```python
try:
    # Operation
    result = do_something()
except SpecificError as e:
    print(f"[ERROR] Specific issue: {e}")
    # Handle gracefully
except Exception as e:
    print(f"[ERROR] Unexpected error: {e}")
    # Fallback handling
```

**Never:**
- Bare `except:` clauses (too broad)
- Printing raw exception objects without context
- Letting exceptions crash the program silently

---

### 5. File Paths - Use Project Root Relative Paths

**Standard pattern:**

```python
import os
import sys

# Get project root
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

# Now imports work from anywhere
from src.database.queries import get_shows
```

**For database path:**
```python
# In src/database/schema.py
DB_PATH = os.path.join(
    os.path.dirname(__file__),  # src/database/
    '..',  # src/
    '..',  # deadstream/
    'data',
    'shows.db'
)
```

---

---

### 6. Import Patterns - Follow Established Structure

**CRITICAL:** The project has a specific file structure and import system. Always consult `08-import-and-architecture-reference.md` before creating new files or importing modules.

**Key Import Rules:**

1. **Always use full paths from `src/`:**
```python
   # CORRECT
   from src.database.queries import get_top_rated_shows
   from src.ui.widgets.show_list import ShowListWidget
   
   # WRONG
   from database.queries import get_top_rated_shows  # Missing 'src.'
   from widgets.show_list import ShowListWidget       # Missing 'src.ui.'
```

2. **Files in subdirectories need path manipulation:**
```python
   # For files in src/ui/screens/ or src/ui/widgets/
   import sys
   import os
   
   PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
   if PROJECT_ROOT not in sys.path:
       sys.path.insert(0, PROJECT_ROOT)
   
   # Now imports work normally
   from src.database.queries import get_shows
```

3. **Never assume files exist without checking:**
   - ❌ `src/screens/` - Does NOT exist
   - ❌ `src/ui/theme.py` - Does NOT exist  
   - ❌ `src/ui/color_button.py` - Does NOT exist
   - ✅ `src/ui/screens/` - Exists (subdirectory under ui/)
   - ✅ `src/ui/widgets/` - Exists (package with __init__.py)

4. **Common import errors:**
   - `ModuleNotFoundError: No module named 'screens'` → Use `src.ui.screens.module`
   - `ModuleNotFoundError: No module named 'src'` → Add path manipulation
   - `ModuleNotFoundError: No module named 'theme'` → File doesn't exist, define inline

**For detailed import patterns, error solutions, and quick reference cards:**
→ See `08-import-and-architecture-reference.md`

---

### 7. Cross-Platform Development - Platform-Aware VLC Configuration

**RULE:** Always use `create_vlc_instance()` from `src.audio.vlc_config` instead of creating VLC instances directly.

**Why:** Enables development on macOS while maintaining production compatibility with Raspberry Pi. Different platforms require different audio output configurations.

**Platform-Specific Requirements:**

| Platform | Audio System | VLC Configuration |
|----------|-------------|-------------------|
| macOS (development) | CoreAudio | Auto-detect (no `--aout` flag) |
| Linux/RPi (production) | ALSA | Force ALSA (`--aout=alsa`) |

**Examples:**

❌ **WRONG - Hardcoded Platform:**
```python
import vlc

# This ONLY works on Linux!
instance = vlc.Instance('--aout=alsa', '--no-video')

# This FAILS on Linux (missing ALSA)!
instance = vlc.Instance('--no-video')
```

✅ **CORRECT - Platform-Aware:**
```python
from src.audio.vlc_config import create_vlc_instance

# Works on BOTH macOS AND Linux automatically
instance = create_vlc_instance()
player = instance.media_player_new()
```

**With Debug Mode:**
```python
# Enable verbose output to see VLC configuration
instance = create_vlc_instance(debug=True)

# Output shows:
# [INFO] Platform: macOS
# [INFO] Audio output: Auto-detect (CoreAudio)
# [INFO] VLC instance created with args: ['--no-video', '--network-caching=8000', '--quiet', '--verbose=0']
```

**How It Works:**
1. Detects platform using `platform.system()`
2. On macOS: Lets VLC auto-detect CoreAudio
3. On Linux: Forces ALSA for Raspberry Pi headphone jack
4. Same codebase, different backend configuration

**Already Platform-Aware:**
- ✅ `src/audio/resilient_player.py` - Uses `create_vlc_instance()`
- ✅ `examples/test_cross_platform_audio.py` - Tests both platforms

**Testing Your Code:**
```bash
# Test on macOS (development)
python examples/test_cross_platform_audio.py

# Test on Raspberry Pi (production)
ssh pi@deadstream
python examples/test_cross_platform_audio.py
```

**Key Benefits:**
- Develop on macOS with immediate audio feedback
- No SSH needed for audio testing during development
- Zero code changes when deploying to Pi
- Fast iteration cycle
- Single codebase for all platforms

---

## Quick Reference Checklist

Before generating code, verify:

- [ ] No emojis, checkmarks, or unicode symbols
- [ ] Test URLs come from database, not hardcoded
- [ ] VLC uses `--aout=alsa` configuration
- [ ] Error handling includes try/except
- [ ] File paths are relative to project root
- [ ] Print statements use `[PASS]`, `[FAIL]`, `[INFO]` markers
- [ ] Import paths follow structure in `08-import-and-architecture-reference.md`
- [ ] No imports reference non-existent files (theme.py, src/screens/, etc.)
- [ ] Path manipulation added for files in subdirectories

---

## Common Issues and Solutions

### Issue: "SyntaxError: unterminated string literal"
**Cause:** Unicode character in string  
**Fix:** Use ASCII only (`[OK]` instead of ✓)

### Issue: "Archive.org returns 404"
**Cause:** Hardcoded URL is outdated  
**Fix:** Use `get_test_url()` from database

### Issue: "VLC playback immediately ends"
**Cause:** Wrong VLC configuration  
**Fix:** Use `--aout=alsa` configuration

### Issue: "ModuleNotFoundError" 
**Cause:** Import paths not set correctly  
**Fix:** Add `sys.path.insert(0, PROJECT_ROOT)` at top of script

### Issue: "ModuleNotFoundError: No module named 'X'"
**Cause:** Import path doesn't match actual file structure  
**Fix:** Consult `08-import-and-architecture-reference.md` for correct import patterns

### Issue: "No audio on macOS during development"
**Cause:** Using Linux-specific `--aout=alsa` flag  
**Fix:** Use `create_vlc_instance()` for automatic platform detection

### Issue: "No audio on Raspberry Pi with headphones"
**Cause:** Missing `--aout=alsa` flag on Linux  
**Fix:** Use `create_vlc_instance()` - automatically adds ALSA on Linux

### Issue: "Architecture mismatch error on Apple Silicon Mac"
**Cause:** Intel (x86_64) VLC installed on ARM Mac  
**Fix:** `brew uninstall vlc && brew install --cask vlc` (installs ARM version)

---

# Addition to 07-project-guidelines.md

## Testing Guidelines

**Reference:** See `09-testing-lessons-learned.md` for detailed testing insights from Phase 8.

### Quick Testing Rules

1. **PyQt5 Animations Need Time**
   ```python
   # WRONG
   window.show_screen('settings')
   QApplication.processEvents()  # Not enough!
   
   # RIGHT
   window.show_screen('settings')
   QTest.qWait(600)  # Wait for animation
   ```

2. **Verify Architecture First**
   ```python
   # Before writing tests, run diagnostics
   # Check actual attribute names, don't assume
   ```

3. **Use Informative Error Messages**
   ```python
   # BAD
   assert condition
   
   # GOOD
   if not condition:
       print(f"[FAIL] Expected X but got Y")
       print(f"[INFO] Check Z for more details")
       return False
   ```

4. **Integration Tests Are Essential**
   - Run before declaring phase complete
   - Test component interactions
   - Document issues found
   - Distinguish critical bugs from polish items

### Common Testing Patterns in DeadStream

**Screen Transitions:**
```python
from PyQt5.QtTest import QTest

def wait_for_transition(ms=600):
    """Wait for screen animation to complete."""
    QTest.qWait(ms)

# Usage
window.screen_manager.show_screen('settings')
wait_for_transition()
current = window.screen_manager.currentWidget()
```

**Settings Screen Attributes:**
- Buttons: `settings_screen.category_buttons['network']` (not `settings_screen.network_button`)
- Widgets: `settings_screen.network_widget` (attribute)
- Stack: `settings_screen.content_stack` (not `details_stack`)

**Screen References:**
- Stored on MainWindow: `window.player_screen`, `window.browse_screen`, `window.settings_screen`
- NOT on ScreenManager: `window.screen_manager.screens` dictionary has them

### Test File Organization

```
deadstream/
├── test_*.py              # Integration tests (project root)
├── *_test_launcher.py     # Test runners
├── examples/
│   └── test_*.py          # Example/demo scripts
└── src/
    └── module/
        └── tests/         # Unit tests (future)
```

**For detailed testing guidelines, examples, and lessons learned:**  
→ See `09-testing-lessons-learned.md`

---

## Working with Claude Code

### When to Use Claude Code vs. Claude Chat
- **Claude Code**: File creation, code implementation, refactoring, debugging
- **Claude Chat**: Planning, architecture decisions, documentation, learning concepts

### Handoff Protocol
When transitioning work to Claude Code:
1. Provide clear task description with acceptance criteria
2. Reference relevant project files (especially this guidelines doc)
3. Specify which standards to follow (PEP 8, git workflow, etc.)
4. Request commit messages that follow project conventions

### Context Files for Claude Code
Always include in Claude Code workspace:
- `/mnt/project/07-project-guidelines.md`
- `/mnt/project/05-technical-decisions.md`
- `/mnt/project/08-import-and-architecture-reference.md`
- Current phase plan document

---

# For AI Assistants

When generating code for this project:

1. **Check existing code first** - `src/audio/resilient_player.py` has working platform-aware config
2. **Use platform-aware VLC** - Always `from src.audio.vlc_config import create_vlc_instance`
3. **Never hardcode audio output** - Let platform detection handle macOS vs Linux
4. **Use database for URLs** - Never hardcode Archive.org URLs
5. **ASCII only** - No emojis or unicode in any output
6. **Verify file structure** - Check `08-import-and-architecture-reference.md` before importing
7. **Test before sharing** - Verify code would actually run
8. **Follow established patterns** - Match existing code style
9. **No assumptions** - Don't assume files exist (theme.py, src/screens/, etc.)
---

## Document History

- 2025-12-29: Added import patterns section, referenced 08-import-and-architecture-reference.md
- 2025-12-23: Created - ASCII and URL standards
- Future updates: Add here

---

**These are non-negotiable project standards.**  
All code must follow these guidelines.
