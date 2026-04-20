from __future__ import annotations

import re
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from psycopg import Connection

from app.auth.router import get_current_user, get_conn
from app.auth.schemas import UserResponse
from app.categories.schemas import (
    CategoryCreateRequest,
    CategoryResponse,
    SubcategoryCreateRequest,
    SubcategoryResponse,
)


router = APIRouter(prefix="/categories", tags=["categories"])


_slug_re = re.compile(r"[^a-z0-9]+")


def slugify(name: str) -> str:
    base = name.strip().lower()
    base = _slug_re.sub("-", base).strip("-")
    return base or "category"


@router.get("", response_model=list[CategoryResponse])
def list_categories(
    user: Annotated[UserResponse, Depends(get_current_user)],
    conn: Annotated[Connection, Depends(get_conn)],
):
    rows = conn.execute(
        "SELECT id, name, slug FROM categories WHERE user_id = %s ORDER BY created_at DESC",
        (user.id,),
    ).fetchall()
    return [CategoryResponse(id=int(r[0]), name=r[1], slug=r[2]) for r in rows]


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    payload: CategoryCreateRequest,
    user: Annotated[UserResponse, Depends(get_current_user)],
    conn: Annotated[Connection, Depends(get_conn)],
):
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Name is required")

    base_slug = slugify(name)
    slug = base_slug

    # Simple unique slug per user.
    for i in range(0, 25):
        try:
            row = conn.execute(
                "INSERT INTO categories(user_id, name, slug) VALUES(%s, %s, %s) RETURNING id",
                (user.id, name, slug),
            ).fetchone()
            conn.commit()
            return CategoryResponse(id=int(row[0]), name=name, slug=slug)
        except Exception:
            conn.rollback()
            slug = f"{base_slug}-{i+2}"

    raise HTTPException(status_code=409, detail="Could not create category (slug conflict)")


def _require_category_owner(conn: Connection, *, user_id: int, category_id: int) -> None:
    row = conn.execute(
        "SELECT 1 FROM categories WHERE id = %s AND user_id = %s",
        (category_id, user_id),
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Category not found")


def _ensure_investing_defaults(conn: Connection, *, user_id: int, category_id: int) -> None:
    category = conn.execute(
        "SELECT slug FROM categories WHERE id = %s AND user_id = %s",
        (category_id, user_id),
    ).fetchone()
    if not category or category[0] != "investing":
        return

    # Keep Activities always visible in Investing navigation.
    conn.execute(
        """
        INSERT INTO subcategories(user_id, category_id, name, slug)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (category_id, slug) DO NOTHING
        """,
        (user_id, category_id, "Activities", "activities"),
    )
    conn.commit()


@router.get("/{category_id}/subcategories", response_model=list[SubcategoryResponse])
def list_subcategories(
    category_id: int,
    user: Annotated[UserResponse, Depends(get_current_user)],
    conn: Annotated[Connection, Depends(get_conn)],
):
    _require_category_owner(conn, user_id=user.id, category_id=category_id)
    _ensure_investing_defaults(conn, user_id=user.id, category_id=category_id)
    rows = conn.execute(
        """
        SELECT id, category_id, name, slug
        FROM subcategories
        WHERE user_id = %s AND category_id = %s
        ORDER BY created_at DESC
        """,
        (user.id, category_id),
    ).fetchall()
    return [SubcategoryResponse(id=int(r[0]), category_id=int(r[1]), name=r[2], slug=r[3]) for r in rows]


@router.post("/{category_id}/subcategories", response_model=SubcategoryResponse, status_code=status.HTTP_201_CREATED)
def create_subcategory(
    category_id: int,
    payload: SubcategoryCreateRequest,
    user: Annotated[UserResponse, Depends(get_current_user)],
    conn: Annotated[Connection, Depends(get_conn)],
):
    _require_category_owner(conn, user_id=user.id, category_id=category_id)
    name = payload.name.strip()
    base_slug = slugify(name)
    slug = base_slug

    for i in range(0, 25):
        try:
            row = conn.execute(
                "INSERT INTO subcategories(user_id, category_id, name, slug) VALUES(%s, %s, %s, %s) RETURNING id",
                (user.id, category_id, name, slug),
            ).fetchone()
            conn.commit()
            return SubcategoryResponse(id=int(row[0]), category_id=category_id, name=name, slug=slug)
        except Exception:
            conn.rollback()
            slug = f"{base_slug}-{i+2}"

    raise HTTPException(status_code=409, detail="Could not create subcategory (slug conflict)")

