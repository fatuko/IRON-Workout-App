from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

REQUIRED = ["authors", "year", "title", "journal", "type", "access", "finding", "url"]


def test_public_no_auth_needed():
    assert client.get("/citations").status_code == 200


def test_shape_has_meta_and_citations():
    data = client.get("/citations").json()
    assert set(data) == {"meta", "citations"}
    assert "last_updated" in data["meta"]


def test_meta_key_not_listed_as_a_citation():
    citations = client.get("/citations").json()["citations"]
    assert "_meta" not in citations
    assert "meta" not in citations


def test_every_entry_has_the_required_fields():
    citations = client.get("/citations").json()["citations"]
    assert len(citations) > 0
    for key, entry in citations.items():
        for field in REQUIRED:
            assert field in entry, f"{key} missing {field}"


def test_known_keys_are_present():
    citations = client.get("/citations").json()["citations"]
    for key in ["pelland2026", "remmert2025", "robinson2024"]:
        assert key in citations


def test_superseded_by_points_to_a_real_key():
    citations = client.get("/citations").json()["citations"]
    for key, entry in citations.items():
        if "superseded_by" in entry:
            assert entry["superseded_by"] in citations, key


def test_missing_optional_fields_are_omitted_not_null():
    entry = client.get("/citations").json()["citations"]["schoenfeld2017"]
    assert "caveats" not in entry


def test_cache_header_is_set():
    r = client.get("/citations")
    assert r.headers["cache-control"] == "public, max-age=3600"