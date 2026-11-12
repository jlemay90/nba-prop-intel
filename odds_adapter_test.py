"""Odds adapter tests — real browser over HTTP, native localStorage.

Covers the mock-first, key-gated Odds API adapter (odds-adapter.js):
mock happy path, no-market -> UNAVAILABLE, stale -> HOLD,
quota-exhausted -> UNAVAILABLE, no key -> live mode refuses,
key never rendered, committed fixture loads, single-file build carries
the same panel. No live API key is used anywhere; all "live" calls are
stubbed with page.route.

Run: python odds_adapter_test.py
Serves the repo over HTTP on 127.0.0.1:8138.
"""
import functools
import http.server
import json
import os
import threading
from datetime import datetime, timedelta, timezone
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent
PORT = 8138
BASE = f"http://127.0.0.1:{PORT}"
CHROME = "/home/hatch/workspace/.pw-chromium/chrome-linux/chrome"
TMP = Path("/tmp/nba-prop-intel-odds-test")
TMP.mkdir(parents=True, exist_ok=True)


def iso(dt):
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def fixture_json(last_update_ok, last_update_stale):
    def book(key, last_update, markets):
        return {"key": key, "title": key.capitalize(), "last_update": last_update, "markets": markets}

    points = {"key": "player_points", "outcomes": [
        {"name": "Jayson Tatum", "description": "Over", "price": -110, "point": 26.5},
        {"name": "Jayson Tatum", "description": "Under", "price": -110, "point": 26.5}]}
    rebounds = {"key": "player_rebounds", "outcomes": [
        {"name": "Jayson Tatum", "description": "Over", "price": -115, "point": 8.5}]}

    def event(bookmakers):
        return {"id": "mock-event-1", "sport_key": "basketball_nba", "sport_title": "NBA",
                "commence_time": "2026-11-12T23:00:00Z", "home_team": "Boston Celtics",
                "away_team": "New York Knicks", "bookmakers": bookmakers}

    return {"provider": "the-odds-api", "scenarios": {
        "ok": event([book("draftkings", last_update_ok, [points]),
                     book("fanduel", last_update_ok, [rebounds])]),
        "noMarket": event([book("draftkings", last_update_ok, [rebounds])]),
        "stale": event([book("draftkings", last_update_stale, [points])])}}


def serve():
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT))
    httpd = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd


def fetch_mock(page, scenario):
    page.select_option("#oddsMode", "mock")
    page.select_option("#oddsScenario", scenario)
    # Clear the previous result first: otherwise wait_for_selector returns
    # immediately on the stale content before the new fetch lands.
    page.evaluate("document.getElementById('oddsResult').innerHTML=''")
    page.click("#oddsFetchBtn")
    page.wait_for_selector("#oddsResult .odds-status, #oddsResult .odds-row", timeout=5000)


def main():
    httpd = serve()
    errors = []
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
            ctx = browser.new_context(viewport={"width": 1280, "height": 800}, accept_downloads=True)
            page = ctx.new_page()
            page.on("pageerror", lambda e: errors.append(str(e)))

            now = datetime.now(timezone.utc)
            fresh = iso(now - timedelta(minutes=10))
            stale = iso(now - timedelta(hours=3))
            live_fixture = fixture_json(fresh, stale)

            # Fresh fixture served for every mock scenario so timestamps are deterministic.
            page.route("**/fixtures/odds-api-mock.json",
                       lambda route: route.fulfill(status=200, content_type="application/json",
                                                   body=json.dumps(live_fixture)))

            page.goto(f"{BASE}/index.html", wait_until="networkidle")
            assert page.locator("#oddsPanel").is_visible(), "odds panel missing"
            assert page.evaluate("typeof window.OddsAdapter") == "object", "OddsAdapter missing"

            # --- 1. Mock happy path ---
            fetch_mock(page, "ok")
            result = page.locator("#oddsResult").inner_text()
            assert "MOCK" in result, "mock badge missing"
            assert "OK" in result, f"expected OK, got: {result}"
            for needle in ["Jayson Tatum", "26.5", "-110", "draftkings", "player_points",
                           "fixtures/odds-api-mock.json#ok"]:
                assert needle in result, f"missing {needle} in: {result}"
            print("MOCK OK PASS: fresh fixture row renders with exact contract fields")

            # --- 2. No market -> UNAVAILABLE ---
            fetch_mock(page, "noMarket")
            result = page.locator("#oddsResult").inner_text()
            assert "UNAVAILABLE" in result and "No line posted yet" in result, f"got: {result}"
            print("NO-MARKET PASS: UNAVAILABLE, no fabricated line")

            # --- 3. Stale -> HOLD ---
            fetch_mock(page, "stale")
            result = page.locator("#oddsResult").inner_text()
            assert "HOLD" in result and "stale" in result.lower(), f"got: {result}"
            assert "Jayson Tatum" in result, "stale row still shows its fields"
            print("STALE PASS: HOLD with stale reason, row still shown")

            # --- 4. Live mode without a key refuses, no network call ---
            api_calls = []
            page.on("request", lambda r: api_calls.append(r.url) if "the-odds-api" in r.url else None)
            page.evaluate("localStorage.clear()")
            page.reload(wait_until="networkidle")
            page.select_option("#oddsMode", "live")
            page.fill("#oddsEventId", "mock-event-1")
            page.evaluate("document.getElementById('oddsResult').innerHTML=''")
            page.click("#oddsFetchBtn")
            page.wait_for_selector("#oddsResult .odds-status", timeout=5000)
            result = page.locator("#oddsResult").inner_text()
            assert "NO_KEY" in result, f"got: {result}"
            assert not api_calls, f"live call made without a key: {api_calls}"
            print("NO-KEY PASS: live mode refuses, zero API calls")

            # --- 5. Quota exhausted (stubbed 429) -> UNAVAILABLE, key never rendered ---
            page.route("**/api.the-odds-api.com/**",
                       lambda route: route.fulfill(status=429, body=""))
            page.fill("#oddsKey", "test-key-123")
            page.fill("#oddsEventId", "mock-event-1")
            page.evaluate("document.getElementById('oddsResult').innerHTML=''")
            page.click("#oddsFetchBtn")
            page.wait_for_selector("#oddsResult .odds-status", timeout=5000)
            result = page.locator("#oddsResult").inner_text()
            assert "UNAVAILABLE" in result and "quota" in result.lower(), f"got: {result}"
            body_text = page.locator("body").inner_text()
            assert "test-key-123" not in body_text, "API key leaked into page text"
            assert "test-key-123" not in result, "API key leaked into result"
            print("QUOTA PASS: 429 -> UNAVAILABLE, key never rendered")

            # --- 6. Committed fixture loads as-is (status OK or HOLD by age, mock flagged) ---
            page.unroute("**/fixtures/odds-api-mock.json")
            page.unroute("**/api.the-odds-api.com/**")
            page.evaluate("localStorage.clear()")
            page.reload(wait_until="networkidle")
            fetch_mock(page, "ok")
            result = page.locator("#oddsResult").inner_text()
            assert "MOCK" in result and ("OK" in result or "HOLD" in result), f"got: {result}"
            assert "Jayson Tatum" in result
            print("COMMITTED FIXTURE PASS: real fixture file loads, mock flagged, fail-closed by age")

            # --- 7. Single-file build carries the panel and adapter ---
            page.goto(f"{BASE}/nba-prop-intel.html", wait_until="networkidle")
            assert page.locator("#oddsPanel").is_visible(), "panel missing in single-file build"
            assert page.evaluate("typeof window.OddsAdapter") == "object", "adapter missing in single-file build"
            print("SINGLE-FILE PASS: panel + adapter present")

            assert not errors, f"page errors: {errors}"
            print("ODDS ADAPTER TEST PASS: mock/no-market/stale/no-key/quota/fixture/single-file, zero page errors")
            browser.close()
    finally:
        httpd.shutdown()


if __name__ == "__main__":
    main()
