# Visitor statistics setup

Status: prepared, not activated. No statistics are collected until the owner supplies a GoatCounter account.

1. Owner signs up at https://www.goatcounter.com/signup with their own email and password.
2. Use site domain https://kkw-web.github.io/Korean-Test-Archive/ and Asia/Seoul timezone.
3. Enable “Allow adding visitor counts on your website” in GoatCounter settings. Keep Sessions enabled.
4. Set `account` in visitor-stats.js to the assigned subdomain (no credentials or API key required).
5. Verify both public counter requests and collection in the owner dashboard before merging this branch to main.

Common/elective modes share one canonical counter path. Offline HTML and preview environments do not send requests. Query strings, search keywords and selected questions are not sent. Counts use GoatCounter's session-based visit definition, not a guaranteed one-person-per-day identity. Public counts may be cached up to four hours. Errors display an em dash rather than a fabricated zero.
