import unittest

from fastapi.testclient import TestClient

from app.main import app


class HealthTests(unittest.TestCase):
    def test_health_and_docs(self):
        with TestClient(app) as client:
            self.assertEqual(client.get("/health").json(), {"status": "ok"})
            self.assertEqual(client.get("/docs").status_code, 200)
            self.assertIn("/api/suggest-username", client.get("/openapi.json").json()["paths"])
