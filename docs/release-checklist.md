# Manual release checklist

## Repository gate
- [ ] GitHub main matches the tested commits; working tree clean.
- [ ] No environment files or secret values committed; inspect filenames and secret-scanner findings without displaying keys.
- [ ] `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm test`, `pnpm build` pass.
- [ ] README and architecture match the deployed code.

## Hosting gate — perform privately
- [ ] HINDSIGHT_BASE_URL set for the correct production service.
- [ ] HINDSIGHT_BANK_ID explicitly selected.
- [ ] HINDSIGHT_API_KEY set to a valid credential with no accidental quotes/whitespace.
- [ ] GROQ_API_KEY set to a valid credential.
- [ ] Redeploy Vercel after environment changes; verify the deployed commit.
- [ ] Deployment access protection and gateway rate limits cover UI and paid API routes. This application has no tenant authentication.
- [ ] Hosting function duration supports provider latency and bounded correction/retries; verify your plan's limits.
- [ ] `/api/health` returns only configuration booleans and app status.
- [ ] `/api/hindsight-test` succeeds as a **read-only** probe. Zero memories is valid for a clean bank.
- [ ] `/api/interactions` confirms one intentional fixture write.
- [ ] `/api/analyze-quote` returns grounded analysis from the chosen bank.

## Demo gate
- [ ] `pacttrace-demo` is clean and contains only intentional fixtures; do not erase a real-data bank.
- [ ] Choose CLI preparation OR live UI retention, avoiding duplicate interaction submissions.
- [ ] Dashboard loading, failure, empty and success states checked.
- [ ] Mobile and tablet layouts checked on the deployed site.
- [ ] Screenshots captured without provider settings or secret-bearing console output.
- [ ] Demo video recorded with genuine retain/recall responses.

## Publishing gate
- [ ] Article edited and published; no mention of the event prohibited by content rules.
- [ ] Technical social post published with final links; same content restriction.
- [ ] YouTube video public and playable without authentication.
- [ ] Submission form completed with repository, deployment and media URLs.

## Suggested order
1. Verify pushed source and check results.
2. Correct Vercel credentials privately and configure access protection.
3. Manually choose the demo bank and intentionally prepare it.
4. Redeploy; check health, recall, one retention and one analysis.
5. Review desktop/mobile and capture screenshots.
6. Record the live demo; publish the article, social post and video.
7. Complete the submission form and re-open all public links in a signed-out session.
