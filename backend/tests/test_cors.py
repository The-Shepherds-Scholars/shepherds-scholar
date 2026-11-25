import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.mark.parametrize(("origin", "allowed"), [
    ("https://shepherds-scholar.gjr6906.workers.dev", True),            # the live site
    ("https://708800b9-shepherds-scholar.gjr6906.workers.dev", True),   # a Cloudflare preview build
    ("https://main-shepherds-scholar.gjr6906.workers.dev", True),       # a branch preview
    ("http://localhost:5173", True),                                    # local development
    ("https://evil.example.com", False),
    ("https://shepherds-scholar.gjr6906.workers.dev.evil.com", False),
    ("https://x-shepherds-scholar-gjr6906.workers.dev", False),
])
def test_only_the_site_and_its_previews_may_call_the_api(origin, allowed):
    r = TestClient(app).options(
        "/api/v1/analytics", headers={"Origin": origin, "Access-Control-Request-Method": "POST"})
    assert (r.headers.get("access-control-allow-origin") == origin) is allowed
