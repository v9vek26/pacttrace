# Submission copy

## Project description
PactTrace remembers vendor commitments and compares later quotes with recalled evidence, turning scattered relationship history into actionable negotiation context.

## Problem
Promises disappear across meetings, messages, staff changes and renewal cycles. Reviewing the newest quote alone cannot reveal which negotiated concessions were lost.

## Solution
Capture interactions, extract explicit commitments with Groq, retain them in Hindsight, and use vendor-specific semantic recall when a new quote arrives. Present historical evidence beside current quote evidence and a conservative recommendation.

## Innovation
Memory is part of the decision workflow rather than an archive beside it. Each comparison carries the recalled memory ID, exact excerpts, condition state and uncertainty. The interface shows the path from capture to retain, recall, comparison and negotiation brief.

## Hindsight use
PactTrace retains original interactions and individual commitments with vendor/source/type metadata. Later requests recall relevant facts from the configured persistent bank, reject other-vendor history, and select a small ranked subset for analysis.

## Technical implementation
Next.js App Router, TypeScript, Zod, Tailwind, lucide-react, Hindsight's JavaScript client, and Groq structured outputs. Server-side validation checks evidence provenance and consistent statuses. Provider retries and structured correction are separately bounded. The automated suite uses mock providers to test failure modes without consuming live quotas.

## Potential impact
Procurement teams could recover relationship context faster and enter renewals with better evidence. These are intended benefits, not measured savings or claims of production adoption.

## Roadmap
Tenant identity and bank isolation, durable interactive-write idempotency, multi-vendor persistent views, richer evidence linking, numerical exposure verification, and access-controlled audit trails.

## Release honesty
The repository supports a controlled demonstration. Production configuration, access protection, credential validity, published media and submission remain release gates. No customer deployments, benchmark scores or savings figures are claimed.

## Final links and publication

- Repository: https://github.com/v9vek26/pacttrace
- Live app: https://pacttrace.vercel.app
- [Content requirements review](content-review.md)
- Published articles, member social posts and the public team video: pending manual publication.
