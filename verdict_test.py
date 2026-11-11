"""Regression test for the framework-verdict persistence defect.

Bug (found 2026-11-11, agent/scoob): normalRecord() in app.js only accepted
the stale lowercase verdicts ['watch','research','pass'], so the form's
framework verdicts LEAN / PASS / VALUE GONE were silently rewritten to HOLD
on every save, load, and import. This test drives the REAL page over HTTP
(native localStorage, real navigation) at 390px and 1280px and proves the
verdict a user picks is the verdict that persists, reloads, and exports.

Run:  python verdict_test.py   (requires Playwright + Chromium)
Artifacts (screenshots/exports) go to /tmp, never into the repo.
"""
import json
import subprocess
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).parent
TMP = Path("/tmp/nba-prop-intel-verdict-test")
TMP.mkdir(exist_ok=True)


def build_import_payload():
    base = {
        "player": "Import Pass",
        "team": "BOS",
        "opponent": "NYK",
        "gameDate": "2026-11-11",
        "market": "Points",
        "side": "Over",
        "line": 24.5,
        "odds": -110,
        "sportsbook": "Test Book",
        "oddsCaptured": "2026-11-11T12:00:00.000Z",
        "oddsSource": "https://example.com/odds",
        "recentGames": [26, 24, 30, 22, 28, 25, 27, 23, 29, 24],
        "statSource": "https://example.com/stats",
        "roleNotes": "Import fixture.",
        "injuryStatus": "available",
        "injuryChecked": "2026-11-11T12:00:00.000Z",
        "injurySource": "https://official.nba.com/nba-injury-report-2026-27-season/",
        "matchupNotes": "Import fixture.",
        "reviewer": "QA agent",
        "reason": "Import fixture.",
        "reviews": [],
        "createdAt": "2026-11-11T12:00:00.000Z",
        "updatedAt": "2026-11-11T12:00:00.000Z",
    }
    rec_pass = dict(base, id="import-pass", verdict="PASS")
    rec_vg = dict(base, id="import-vg", player="Import Value Gone",
                  verdict="VALUE GONE")
    rec_legacy = dict(base, id="import-legacy", player="Import Legacy",
                      verdict="pass")  # pre-fix lowercase value
    return {"schema": "j-nba-prop-intel", "version": "0.1",
            "exportedAt": "2026-11-11T12:00:00.000Z",
            "records": [rec_pass, rec_vg, rec_legacy]}


def main():
    server = subprocess.Popen(
        ["python3", "-m", "http.server", "8137", "--bind", "127.0.0.1"],
        cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(0.8)
    import_path = TMP / "verdict-import.json"
    import_path.write_text(json.dumps(build_import_payload(), indent=2))
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(
                executable_path="/home/hatch/workspace/.pw-chromium/chrome-linux/chrome",
                headless=True, args=["--no-sandbox"])
            ctx = browser.new_context(viewport={"width": 390, "height": 844},
                                      accept_downloads=True)
            page = ctx.new_page()
            errs = []
            page.on("pageerror", lambda e: errs.append(str(e)))
            page.on("dialog", lambda d: d.accept())  # import/delete confirms

            # --- true HTTP page load, mobile width ---
            page.goto("http://127.0.0.1:8137/index.html",
                      wait_until="networkidle")
            assert page.locator("#totalMetric").inner_text() == "3"
            assert page.locator(".prop-card").count() == 3
            assert page.locator("body").evaluate(
                "(e) => e.scrollWidth <= window.innerWidth + 2"), \
                "Horizontal overflow on mobile"
            print("MOBILE LOAD PASS: 3 demo cards, no overflow")

            # --- add a record with verdict LEAN via the real form ---
            page.get_by_role("button", name="+ New prop").click()
            page.locator("#player").fill("Verdict Test Guard")
            page.locator("#gameDate").fill("2026-11-11")
            page.locator("#market").select_option("Points")
            page.locator("#side").select_option("Over")
            page.locator("#line").fill("24.5")
            page.locator("#odds").fill("-110")
            page.locator("#sportsbook").fill("Test Book")
            page.locator("#recentGames").fill(
                "26, 24, 30, 22, 28, 25, 27, 23, 29, 24")
            page.locator("#verdict").select_option("LEAN")
            page.locator("#reason").fill("LEAN unless the line moves.")
            page.get_by_role("button", name="Save research record").click()
            assert page.locator("#totalMetric").inner_text() == "4", \
                page.locator("#formFeedback").inner_text()
            print("ADD PASS: LEAN record saved, total 4")

            # --- real reload: native localStorage must keep the verdict ---
            page.reload(wait_until="networkidle")
            assert page.locator("#totalMetric").inner_text() == "4"
            page.locator("#searchInput").fill("Verdict Test Guard")
            assert page.locator(".prop-card").count() == 1
            page.locator(".inspect").click()
            assert page.locator("dialog").is_visible()
            detail = page.locator("#detailsContent").inner_text()
            assert detail.startswith("MARKET SNAPSHOT") or "LEAN" in detail
            assert "LEAN — LEAN unless the line moves." in detail, detail
            page.locator("#closeDialog").click()
            print("RELOAD+DETAIL PASS: LEAN survived reload and shows "
                  "in the research file")
            page.locator("#searchInput").fill("")

            # --- export must carry LEAN, not HOLD ---
            with page.expect_download() as dl:
                page.locator("#exportBtn").click()
            dl.value.save_as(str(TMP / "verdict-export.json"))
            obj = json.loads((TMP / "verdict-export.json").read_text())
            saved = [r for r in obj["records"]
                     if r["player"] == "Verdict Test Guard"][0]
            assert saved["verdict"] == "LEAN", saved["verdict"]
            print("EXPORT PASS: exported JSON verdict is LEAN")

            # --- import: PASS / VALUE GONE survive, legacy 'pass' -> PASS ---
            page.set_input_files("#importFile", str(import_path))
            page.wait_for_timeout(500)
            assert page.locator("#totalMetric").inner_text() == "3", \
                page.locator("#totalMetric").inner_text()
            with page.expect_download() as dl2:
                page.locator("#exportBtn").click()
            dl2.value.save_as(str(TMP / "verdict-reexport.json"))
            obj2 = json.loads((TMP / "verdict-reexport.json").read_text())
            by_id = {r["id"]: r["verdict"] for r in obj2["records"]}
            assert by_id == {"import-pass": "PASS",
                             "import-vg": "VALUE GONE",
                             "import-legacy": "PASS"}, by_id
            page.locator("#searchInput").fill("Import Value Gone")
            page.locator(".inspect").click()
            assert "VALUE GONE" in \
                page.locator("#detailsContent").inner_text()
            page.locator("#closeDialog").click()
            print("IMPORT PASS: PASS and VALUE GONE survive import; "
                  "legacy lowercase 'pass' migrates to PASS")

            # --- desktop width, same page/context (same storage) ---
            page.set_viewport_size({"width": 1280, "height": 800})
            page.reload(wait_until="networkidle")
            assert page.locator("#totalMetric").inner_text() == "3"
            assert page.locator(".prop-card").count() == 3
            assert page.locator("body").evaluate(
                "(e) => e.scrollWidth <= window.innerWidth + 2"), \
                "Horizontal overflow on desktop"
            print("DESKTOP PASS: 3 imported records, no overflow")

            assert not errs, errs
            print("VERDICT TEST PASS: no uncaught page exceptions; "
                  "verdicts persist across save/reload/export/import")
            browser.close()
    finally:
        server.terminate()
        server.wait()


if __name__ == "__main__":
    main()
