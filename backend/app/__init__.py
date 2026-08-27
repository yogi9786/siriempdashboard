"""
Siri Samruddhi Gold Palace Management Dashboard Backend Application
"""
import sys
from pathlib import Path

# Automatically ensure workspace root and backend folder are in sys.path
_current_dir = Path(__file__).resolve().parent  # app
_backend_dir = _current_dir.parent  # backend
_root_dir = _backend_dir.parent  # workspace root

for _p in [str(_root_dir), str(_backend_dir)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

__version__ = "1.0.0"
