"""Account refills for seeding. Full history lives in `refills_seed.json`."""

from __future__ import annotations

import json
from pathlib import Path

_JSON = Path(__file__).with_name("refills_seed.json")
DEFAULT_REFILL_ROWS: list[dict[str, str]] = json.loads(_JSON.read_text(encoding="utf-8"))

DEFAULT_OPERATING_EXPENSES_USD = "643.79"
