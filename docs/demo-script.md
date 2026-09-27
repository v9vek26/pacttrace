# Three-minute demonstration

Use synthetic data only. Keep provider dashboards, environment settings and terminal history containing credentials out of the recording. Rehearse after completing the release checklist. Do not claim an error screen is a successful recall.

| Time | Screen and narration |
| --- | --- |
| 0:00–0:20 | Show the quote alone. “A vendor renewal can look reasonable while silently losing a promise made months earlier. That promise may be buried in a call, email, or another employee's notes.” |
| 0:20–0:40 | Show PactTrace. “PactTrace turns vendor interactions into institutional memory. Groq extracts the promise; Hindsight remembers it across sessions.” |
| 0:40–1:10 | Submit the CloudNova interaction with **Extract & Remember** once. “This message promises a fee waiver and a 15% renewal discount if the account exceeds 100 seats.” Wait for real extraction and confirmed retention. |
| 1:10–1:30 | Show retained item count and the ledger. “The original interaction and commitments are stored as natural-language memories with vendor metadata. This is persistent Hindsight storage, not a hardcoded browser answer.” |
| 1:30–2:00 | Submit the 130-seat quote with no renewal discount. “Now the renewal is a separate request. PactTrace recalls this vendor's history before evaluating it.” Show loading and the real response. |
| 2:00–2:25 | Show both evidence excerpts and condition status. “The historical condition is over 100 seats; this quote says 130. The omitted discount is a potential conflict, not a legal breach determination.” |
| 2:25–2:45 | Open **Prepare negotiation brief** and scroll to the timeline. “The brief uses the actual recalled promise and current evidence. These timeline entries are system actions, not hidden model reasoning.” |
| 2:45–3:00 | “Without memory, this is generic quote analysis. With Hindsight, the agent can bring the relationship's actual history into the next decision.” |

## Preparation

Manually select `pacttrace-demo` in your environment and restart or redeploy. Choose either the guarded CLI seed for an analysis-only rehearsal or live UI retention for the full recording. Do not do both repeatedly. The CLI is safe to rerun against its fixed documents, but UI submissions create new interactions. Keep provider limits in mind; one rehearsal is more useful than five rapid requests.

## If something fails

Show the honest error, stop the recording, and inspect configuration privately. A 429 can mean the provider needs more time than the bounded request allows. A successful `/api/health` response is not proof of provider authentication. Never paste keys into the recording or screenshots. Do not invent a fallback analysis.
