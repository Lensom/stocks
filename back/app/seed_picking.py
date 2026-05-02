"""Load default picking rows for a user. Run from `back/` with venv activated:

  python -m app.seed_picking user@example.com
  python -m app.seed_picking user@example.com --force

`--force` replaces existing picking data. Without it, seed runs only if the user has no picking row yet.
"""

from __future__ import annotations

import sys

from psycopg import connect
from psycopg.types.json import Json
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.investing.default_picking_data import DEFAULT_PICKING_ROWS


class _Env(BaseSettings):
    database_url: str = ""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


def main() -> None:
    args = [a for a in sys.argv[1:] if a]
    force = "--force" in args
    args = [a for a in args if a != "--force"]
    if not args:
        print("Usage: python -m app.seed_picking <email> [--force]", file=sys.stderr)
        sys.exit(1)
    email = args[0].lower().strip()

    settings = _Env()
    if not settings.database_url:
        print("DATABASE_URL missing (.env)", file=sys.stderr)
        sys.exit(1)

    with connect(settings.database_url) as conn:
        row = conn.execute("SELECT id FROM users WHERE email = %s", (email,)).fetchone()
        if not row:
            print(f"No user with email {email}", file=sys.stderr)
            sys.exit(1)
        user_id = int(row[0])

        exists = conn.execute(
            "SELECT 1 FROM investing_picking WHERE user_id = %s",
            (user_id,),
        ).fetchone()
        if exists and not force:
            print("Picking already exists; pass --force to replace.")
            sys.exit(0)

        conn.execute(
            """
            INSERT INTO investing_picking(user_id, rows, updated_at)
            VALUES (%s, %s, NOW())
            ON CONFLICT (user_id)
            DO UPDATE SET rows = EXCLUDED.rows, updated_at = NOW()
            """,
            (user_id, Json(DEFAULT_PICKING_ROWS)),
        )
        conn.commit()
        print(f"Seeded picking for {email} ({len(DEFAULT_PICKING_ROWS)} rows).")


if __name__ == "__main__":
    main()
