# Matching Module — Import/Export AI Matching Agent

**Owner:** Intern 3
**Status:** V1 functional, using mocked data, pending integration with the real database

---

## Description

This module computes a relevance score (0-100) between a listing (offer or request) and listings of the opposite type, by combining 5 weighted criteria: product/category, price/quantity, geo-logistics, partner reliability, and availability deadlines.

---

## File structure

```
app/
├── main.py              # FastAPI endpoint (/api/matching/find-matches)
├── models.py            # Pydantic models (Listing, ProfilEntreprise, DonneesLogistiques, MatchingCriteria, MatchResult)
├── scoring.py            # Scoring algorithm (5 criteria + weights + explanation)
├── mock_client.py        # Data access layer (currently mocked JSON files)
└── data/
    ├── mock_listings.json
    ├── mock_entreprises.json
    ├── mock_logistique.json
    └── match_history.json    # History of computed matches (for future ML)

docs/
├── MATCHING_ALGORITHM.md     # Detail of the 5 criteria, formulas, weights
├── INTEGRATION_GUIDE.md      # Guide for the Frontend (API format, error handling)
└── test_results.md           # Validation results on an extended test dataset

tests/
├── test_scoring.py           # Automated tests (pytest) for the scoring functions
└── manual_scenarios.py       # Manual test script covering 10 realistic scenarios
```

---

## Installation

```bash
python -m venv venv
venv\Scripts\Activate.ps1      # Windows
pip install fastapi uvicorn pydantic scikit-learn pandas numpy geopy rapidfuzz pytest
```

---

## Running the server

```bash
uvicorn app.main:app --reload
```

Interactive documentation: `http://127.0.0.1:8000/docs`

---

## Main endpoint

`POST /api/matching/find-matches`

```json
{
  "listing_id": "D001"
}
```

Optional query params: `limit`, `offset`, `top_n`, `score_min`, `pays`, `prix_max`.

Full response format and error handling details: see `docs/INTEGRATION_GUIDE.md`.

---

## Running the tests

```bash
pytest -v
```

Manually test several realistic scenarios:

```bash
python -m tests.manual_scenarios
```

---

## Known points to improve (see docs/test_results.md)

- The current weight of the product criterion (25%) may not be enough to exclude irrelevant candidates when their other criteria (price, logistics) are favorable — to be discussed further with the supervisor.
- Data is currently mocked (JSON); `mock_client.py` will need to be replaced with real calls to the database / to the Backend and Trust module APIs once available.

---

## Related documentation

- Detailed algorithm: [(../docs/MATCHING_ALGORITHM.md)](https://github.com/oumayma728/platform-import-export-/blob/stagiaire-3-tests-update/docs/MATCHING_ALGORITHM.md)
- Frontend integration guide:[(../docs/INTEGRATION_GUIDE.md)](https://github.com/oumayma728/platform-import-export-/blob/stagiaire-3-tests-update/docs/INTEGRATION_GUIDE.md)
- Validation results: [`docs/test_results.md`](../docs/test_results.md)
