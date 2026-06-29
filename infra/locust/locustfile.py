"""
Locust canary validation — products-service
Goal: prove functional correctness during a rolling canary, not measure raw perf.

Traefik routes on Host('api.memoire.local'), so you CANNOT hit the node IP directly.
Choose one of these two approaches:

Option A — port-forward (recommended, no /etc/hosts needed):
  kubectl port-forward svc/api-gateway 8080:8080 -n memoire-app
  locust -f locustfile.py --host http://localhost:8080 \
         --users 5 --spawn-rate 1 --run-time 3m --headless

Option B — /etc/hosts + hostname:
  locust -f locustfile.py --host http://api.memoire.local \
         --users 5 --spawn-rate 1 --run-time 3m --headless

RATE LIMIT WARNING: the api-gateway allows 100 req/min per source IP.
Keep --users ≤ 5 to stay under that limit (5 users × ~15 req/min each ≈ 75 req/min).
Beyond 5 users from the same machine, expect 429 responses.
"""

import logging
import random
from locust import HttpUser, task, between, events

log = logging.getLogger("canary")

# Product IDs known to exist in the test dataset.
# Update this list if the seed data changes.
KNOWN_IDS = [1, 2, 3]


@events.test_start.add_listener
def on_test_start(environment, **_):
    log.info("Canary validation started — target: %s", environment.host)


class ProductsUser(HttpUser):
    """Simulates a read-only user browsing the products catalogue."""

    # 3-6s think time keeps total RPS well under the 100 req/min gateway limit
    # when running ≤ 5 concurrent users.
    wait_time = between(3, 6)

    def on_start(self):
        """Called once per simulated user at spawn time."""
        self._check_health()

    # ------------------------------------------------------------------
    # Tasks
    # ------------------------------------------------------------------

    @task(5)
    def list_products(self):
        """GET /api/products/ — most frequent real-world call."""
        with self.client.get(
            "/api/products/",
            name="/api/products/ [list]",
            catch_response=True,
        ) as resp:
            if resp.status_code != 200:
                resp.failure(f"Expected 200, got {resp.status_code}")
                return
            body = resp.json()
            if "results" not in body or "count" not in body:
                resp.failure(f"Unexpected payload shape: {list(body.keys())}")
            else:
                resp.success()

    @task(3)
    def get_product_detail(self):
        """GET /api/products/<id>/ — validates the detail endpoint."""
        pid = random.choice(KNOWN_IDS)
        with self.client.get(
            f"/api/products/{pid}/",
            name="/api/products/<id>/ [detail]",
            catch_response=True,
        ) as resp:
            if resp.status_code == 200:
                resp.success()
            elif resp.status_code == 404:
                resp.failure(f"Product {pid} not found — seed data missing?")
            else:
                resp.failure(f"Unexpected {resp.status_code} for product {pid}")

    @task(2)
    def health_check(self):
        """GET /api/products/health/ — confirms the canary pod is alive and
        logs the version field so we can see which build is responding."""
        with self.client.get(
            "/api/products/health/",
            name="/api/products/health/ [canary probe]",
            catch_response=True,
        ) as resp:
            if resp.status_code != 200:
                resp.failure(f"Health returned {resp.status_code}")
                return
            body = resp.json()
            version = body.get("version", "unknown")
            status = body.get("status", "unknown")
            if status != "ok":
                resp.failure(f"Health status={status}, version={version}")
            else:
                log.info("health ok — version=%s", version)
                resp.success()

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _check_health(self):
        """Eagerly verify the service is reachable before tasks start."""
        try:
            r = self.client.get("/api/products/health/", name="[startup health]")
            if r.status_code == 200:
                body = r.json()
                log.info(
                    "Service reachable — status=%s version=%s",
                    body.get("status"),
                    body.get("version"),
                )
            else:
                log.warning("Startup health check returned %s", r.status_code)
        except Exception as exc:
            log.error("Startup health check failed: %s", exc)