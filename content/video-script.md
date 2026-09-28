# Public technical video script

Use the three-minute timing in `docs/demo-script.md`. Record the actual app and genuine provider responses; keep credential pages off-screen.

**Opening:** “This renewal quote has 130 seats and no discount. An agent looking only at this document cannot know whether that is a problem. PactTrace gives the agent a memory of the vendor relationship.”

**Prepared-bank recording:** The release bank is already populated. Show genuine retention footage from an earlier run, then perform recall live in a fresh session. Label recorded footage honestly. If no retention footage was saved, record from scratch in a separate empty recording bank; do not re-submit the release fixture.

**Retain (fresh recording bank only):** “Here is a historical interaction: the vendor agreed to waive onboarding and promised a 15% renewal discount if the account exceeds 100 seats. Groq extracts those terms. Hindsight retains the original interaction and the individual commitments with vendor metadata.” Click Extract & Remember once and show the confirmed result.

**Recall:** “Now I submit a separate renewal quote. PactTrace asks Hindsight for relevant history, filters by vendor, and passes a small evidence set to Groq.” Click Analyze once and wait for the genuine result.

**Evidence:** “The historical condition and the current seat count are visible. The result is a potential conflict, not a claim that a legal violation has been established. The evidence fields must match the supplied quote and recalled memories.” Show both excerpts and condition status.

**Action:** “The timeline records system actions. The negotiation brief carries the same evidence into a practical recommendation. There is no invented savings figure.” Open the brief.

**Close:** “Hindsight changes what the agent can compare. The quote is no longer isolated from the promises that came before it.”

Before publishing, replace placeholders in the description with final repository/article URLs and verify public playback. Do not include environment variables, API keys, provider response headers, or private vendor records in the recording.

Repository: https://github.com/v9vek26/pacttrace
Live demo: https://pacttrace.vercel.app
