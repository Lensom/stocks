from __future__ import annotations

from pydantic import BaseModel, Field


class CategoryCreateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=64)


class CategoryResponse(BaseModel):
    id: int
    name: str
    slug: str


class SubcategoryCreateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=64)


class SubcategoryResponse(BaseModel):
    id: int
    category_id: int
    name: str
    slug: str

