# PROJECT OVERVIEW — NBA Prop Intelligence
**Original owner request (2026-11-11):** Create a continuously improvable, other-agent handoff for an NBA player-prop guide or webapp, making key props easy to see and properly researched. User subsequently authorized integration with the existing J Command Hub *if it improves the system*.

## Accepted user intent
- Phone-first UX, rapid scan of key NBA player props, high-integrity source-backed research.
- Multiple agents can iteratively improve the tool without losing prior work or inventing verified data.
- Integrate as an optional, isolated J Command Hub research module, not a new competing life command center.

## Original v0.1 experience
A source-first manual research board. See a filterable set of player prop records and historical sample hit rates at the exact quoted line; open a research detail; add real sourced information and append independent agent reviews; back up/import in JSON. Demo records are conspicuously synthetic.

## Existing canonical research method
The user’s `/J_Sports_Prop_Framework.md` (ChatGPT Library; original Oct 22, 2026) is the **standing sports-prop analysis rule set**. This app implements presentation/review mechanics and must reference, not duplicate, that rule set. It requires low/base/high minutes scenarios, separation of opportunities from conversion, accurate lineup/role verification, actual defenders, combined-stat joint distributions, adversarial checks and `HOLD / LEAN / PASS / VALUE GONE` verdicts. Historic slate snapshots in that file are not live data.

## Non-negotiables
- Real lines, prices, statuses and game logs have real origin links and capture times; unavailable data remains unavailable.
- No invented win probabilities, "lock" claims, automatic bets or implied betting profits.
- Scrutinize denominator, pushes, minutes/role, injuries, freshness, exact book/market/side and game date.
- Preserve original/stable/current versions per owner app-continuity skill. Make changes on branches and keep an accurate handoff.
- Never transfer money/legal/family/private Hub records into this sports lab; use read-only minimal Hub project metadata when integrated.

## Success criterion for first production release
In under 15 seconds, owner can locate a specific upcoming game's key prop and read source-supported line/price/time, last-10 outcome table, injury/rotation risk, independent agent assessments, and the strongest reason *not* to trust the thesis. The system must gracefully say "unavailable" on feed failure.

## Deliberate exclusions
No bet placement, affiliate links, automated staking, sports account connection or pushing sports alerts into the primary family/finance-oriented Today priorities without opt-in. v0.1 is not connected to live data.