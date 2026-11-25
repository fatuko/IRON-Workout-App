"""
Response models for GET /citations.

These mirror docs/citations-endpoint-contract.md. If the contract
changes, change that doc first, then this file.
"""

from pydantic import BaseModel


class Citation(BaseModel):
    authors: str
    year: int
    title: str
    journal: str
    type: str
    access: str
    finding: str
    url: str
    # Optional: omitted from the response when an entry doesn't have them.
    doi: str | None = None
    volume: str | None = None
    pages: str | None = None
    caveats: str | None = None
    superseded_by: str | None = None
    data_url: str | None = None
    alt_url: str | None = None
    formula: str | None = None
    language: str | None = None
    note: str | None = None


class CitationsMeta(BaseModel):
    description: str
    last_updated: str


class CitationsResponse(BaseModel):
    meta: CitationsMeta
    citations: dict[str, Citation]