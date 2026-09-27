# How Hindsight Made My Agent Remember Vendor Promises

A renewal quote rarely contains the whole story of a vendor relationship. It might list a price, a seat count, and a contract period while leaving out a concession negotiated in a meeting months earlier. An agent can summarize that quote perfectly and still miss the important question: does this document respect what the vendor previously promised?

That question led me to build PactTrace, a vendor intelligence application centered on Hindsight persistent memory. Its purpose is to connect past commitments with present decisions. Groq extracts and compares information, Hindsight retains and recalls the relationship history, and application code checks the resulting evidence before it reaches the user. The demonstration uses synthetic vendor data; it does not claim measured savings or production customers.

## The difference a memory makes

Consider a vendor called CloudNova. In an earlier interaction, CloudNova agreed to waive an onboarding fee and promised a 15% renewal discount if the account exceeded 100 seats. Later, a renewal quote arrives for 130 seats and explicitly says that no renewal discount is included.

Without the earlier interaction, the latest quote is simply a document describing a purchase. An agent might explain the price or suggest generic negotiation questions. It cannot reliably identify a missing promise that it has never seen. The absent context is not something better wording in the current prompt can recover.

With Hindsight, PactTrace can recall the historical discount commitment when the new quote arrives. The comparison now has two separate sources: a remembered promise and current quote evidence. The condition can be assessed against the stated seat count, and the output can identify a potential conflict. The useful change is not more fluent language. It is access to relevant history.

## Turning an interaction into durable context

The capture flow begins with a vendor name, interaction text, and source such as a meeting. A Next.js API route validates those fields before asking Groq for structured commitments. The schema includes a summary and a list of commitments, each with a type, description, value, condition, deadline, and status.

The extraction instructions are intentionally conservative. Missing values, conditions, or deadlines remain null. The model is asked to extract explicit or strongly supported commitments rather than invent plausible commercial terms. The returned JSON is validated again by Zod on the server; requesting structured output does not remove the need to inspect it.

PactTrace then sends a batch to Hindsight containing the original interaction and a natural-language representation of each extracted commitment. Retaining the original text preserves context beyond the structured fields. Keeping individual commitments as readable memories makes later semantic recall useful for questions about discounts, fee waivers, delivery promises, or other negotiated terms.

Each retained item carries metadata identifying its vendor, source, and memory type. Commitment items also identify their commitment type, and a shared interaction identifier links the group. PactTrace checks the batch acknowledgement before telling the interface that retention succeeded. If confirmation fails, the response acknowledges uncertainty because some data may already have been stored.

## Recall is part of the analysis, not a separate archive

When a user submits a new quote, PactTrace first asks Hindsight for previous commitments and negotiation history relevant to that vendor and quote. The application does not start by asking the model to guess what the relationship might contain. Historical evidence comes from the memory system.

The returned facts are filtered by vendor metadata. A vendor name inside the recall query is useful for retrieval, but it is not an isolation boundary by itself. Unlabelled facts and other-vendor results are excluded. Repeated facts are deduplicated conservatively while preserving original memory IDs and text for subsequent evidence checks.

PactTrace keeps Hindsight's relevance order and sends at most five selected memories to Groq. The payload contains only the vendor, current quote, and memory IDs with text. It excludes large score structures and redundant SDK metadata. This reduces context size without removing persistent recall from the product. The response distinguishes the recalled memory count from the number actually used for comparison.

## Evidence has to survive validation

The comparison uses a strict JSON schema. Each relevant finding contains historical commitment evidence, current quote evidence, a condition state, a status, severity, and an explanation. The available statuses are potential conflict, honored, and insufficient evidence. The model is not invited to declare a legal breach.

Historical excerpts must be exact substrings of the referenced recalled memory. Current evidence must be an exact excerpt from the supplied quote. Memory identifiers must point to memories that were actually included in the analysis. These checks reject invented evidence, unknown references, and paraphrases presented as quotations.

Condition states make uncertainty visible. A condition can be met, not met, unknown, or not applicable. Unknown or unmet conditions cannot support an asserted conflict under the application's consistency rules. An unconditional promise uses not applicable. The instructions distinguish an explicit statement that a discount is excluded from simple silence about whether a discount exists.

These controls improve provenance, but they do not prove every semantic interpretation correct. A model can quote authentic text and still misunderstand it. PactTrace therefore presents the evidence for human review instead of presenting an opaque verdict. Financial impact remains null because the repository does not yet contain a verified calculator for baseline amounts, currency, comparable periods, and applicable terms.

## Making the live path dependable

Provider limits matter in a real demonstration. Repeated requests can encounter rate limits even when memory recall succeeds. PactTrace uses a reusable retry helper for Groq, with at most two provider retries shared across the analysis and its structured-output correction path.

Short Retry-After instructions are honored. Without one, the fallback waits increase from one to two seconds. If the provider asks for a delay beyond the short request budget, the application fails safely instead of retrying too early. Selected transient server errors are retryable; ordinary invalid requests are not. Provider headers and raw exception bodies are never returned to the browser.

There is also one bounded correction attempt for invalid structured output or evidence. It asks the model to repair its response using the same supplied sources. The validator is not weakened to make a demonstration succeed. Offline tests cover these failure paths without consuming real provider quotas or writing memories.

## Showing what actually happened

The dashboard makes memory visible through a commitment ledger, historical and current evidence cards, a memory timeline, and a negotiation brief. A new page begins with empty session evidence rather than fabricated retained counts or an assumed healthy provider connection. Loading states disable conflicting actions while a request runs.

The timeline describes system events such as retention, recall, and completed analysis. It does not display hidden model reasoning. The negotiation brief uses the actual returned recommendation and evidence. Refreshing the page clears its transient view, while the historical information remains in Hindsight for a later request.

The repository also includes an intentional local seed command for a dedicated demonstration bank. Stable fixture document IDs make preparation repeatable without continually appending the same seed documents. Page loads never seed data, and the connectivity endpoint performs read-only recall. A separate health endpoint reports configuration booleans without making expensive provider calls.

## What comes next

PactTrace currently demonstrates a single-bank workflow, not a complete enterprise authorization model. Before using private procurement data, it needs organization identity, tenant-specific bank isolation, durable write idempotency, and access-controlled audit trails. Deployment protection and synthetic data are appropriate boundaries for the current demonstration.

The lesson from building it is concrete: long-term memory changes the evidence available to an agent. Hindsight lets a later request recover a promise made in an earlier interaction. Groq can then compare those sources, and PactTrace can make the comparison inspectable. Remembering the relationship is what turns an isolated quote into a meaningful negotiation question.

<!-- Before publication: add the final repository, deployment and public video links. Capture screenshots from a verified live run. -->
