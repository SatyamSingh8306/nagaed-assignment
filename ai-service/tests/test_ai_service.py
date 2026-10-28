import unittest
from unittest.mock import AsyncMock, patch

import httpx
from fastapi.testclient import TestClient
from groq import APIConnectionError, AuthenticationError

from app.core.config import Settings
from app.main import app
from app.providers.groq import GroqProvider
from app.schemas.chat import Suggestions
from app.services.ai_service import AIService, get_ai_service
from app.utils.retries import retry_transient

NAMES = {"suggestions": ["MusicFox", "TuneTrail", "RhythmOak"]}


class RouteTests(unittest.TestCase):
    def setUp(self):
        self.provider = AsyncMock()
        self.provider.suggest.return_value = Suggestions(**NAMES)
        app.dependency_overrides[get_ai_service] = lambda: AIService(self.provider)
        self.client = TestClient(app)

    def tearDown(self):
        app.dependency_overrides.clear()
        get_ai_service.cache_clear()

    def test_success(self):
        result = self.client.post("/api/suggest-username", json={"interests": ["music"]})
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result.json(), NAMES)
        self.provider.suggest.assert_awaited_once_with(["music"])

    def test_bad_inputs(self):
        for body in (
            {},
            {"interests": []},
            {"interests": [" "]},
            {"interests": "music"},
            {"interests": [1]},
            {"interests": ["a"] * 11},
            {"interests": ["a" * 51]},
        ):
            self.assertEqual(self.client.post("/api/suggest-username", json=body).status_code, 422)
        self.provider.suggest.assert_not_awaited()

    def test_provider_failure(self):
        self.provider.suggest.side_effect = APIConnectionError(
            request=httpx.Request("POST", "https://example.test")
        )
        result = self.client.post("/api/suggest-username", json={"interests": ["music"]})
        self.assertEqual(result.status_code, 502)
        self.assertIn("unavailable", result.json()["error"]["message"])

    def test_invalid_output(self):
        for values in (
            ["Same", "same", "Other"],
            ["bad name", "NameTwo", "NameThree"],
            ["OnlyOne"],
        ):
            self.provider.suggest.return_value = {"suggestions": values}
            self.assertEqual(
                self.client.post(
                    "/api/suggest-username", json={"interests": ["music"]}
                ).status_code,
                502,
            )

    def test_missing_key(self):
        app.dependency_overrides.clear()
        get_ai_service.cache_clear()
        with patch(
            "app.services.ai_service.get_settings",
            return_value=Settings(groq_api_key="", _env_file=None),
        ):
            result = self.client.post("/api/suggest-username", json={"interests": ["music"]})
        self.assertEqual(result.status_code, 503)


class ProviderTests(unittest.IsolatedAsyncioTestCase):
    async def test_langchain_groq_structured_output(self):
        with patch("app.providers.groq.ChatGroq") as model:
            chain = model.return_value.with_structured_output.return_value
            chain.ainvoke = AsyncMock(return_value=Suggestions(**NAMES))
            provider = GroqProvider(Settings(groq_api_key="test-only", _env_file=None))
            result = await provider.suggest(["music"])
            self.assertEqual(result.suggestions, NAMES["suggestions"])
            model.return_value.with_structured_output.assert_called_once_with(
                Suggestions, method="json_mode"
            )
            self.assertIn("music", chain.ainvoke.call_args.args[0][1][1])

    async def test_retry_only_transient_failures(self):
        error = APIConnectionError(request=httpx.Request("POST", "https://example.test"))
        operation = AsyncMock(side_effect=[error, "ok"])
        with patch("app.utils.retries.asyncio.sleep", new_callable=AsyncMock):
            self.assertEqual(await retry_transient(operation), "ok")
        self.assertEqual(operation.await_count, 2)
        invalid = AsyncMock(side_effect=ValueError("bad data"))
        with self.assertRaises(ValueError):
            await retry_transient(invalid)
        self.assertEqual(invalid.await_count, 1)

    async def test_no_retry_for_authentication(self):
        response = httpx.Response(401, request=httpx.Request("POST", "https://example.test"))
        operation = AsyncMock(
            side_effect=AuthenticationError("invalid key", response=response, body=None)
        )
        with self.assertRaises(AuthenticationError):
            await retry_transient(operation)
        self.assertEqual(operation.await_count, 1)
