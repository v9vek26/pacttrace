# LinkedIn draft

An AI agent can read a renewal quote. The harder question is whether it remembers what the vendor promised before.

I built PactTrace around Hindsight persistent memory:

• Groq extracts explicit commitments from vendor interactions.
• Hindsight retains the original interaction and natural-language commitments with vendor metadata.
• A later quote triggers semantic recall, followed by vendor filtering and a small ranked evidence payload.
• PactTrace validates exact evidence excerpts and condition states before showing a comparison.

The demonstration: a historical 15% renewal discount applies above 100 seats. A new 130-seat quote explicitly excludes a discount. With recalled history, PactTrace can identify a potential conflict and produce an evidence-backed negotiation recommendation.

Without memory: generic quote analysis. With memory: a comparison against the relationship's actual history.

The implementation also keeps uncertainty visible. Missing evidence is not a violation, financial impact is not guessed, and provider retries are bounded.

This is a demonstration with synthetic vendor data, not a production-customer or savings claim.

Repository: [insert final repository link]
Technical article: [insert published article link]
Live retain/recall video: [insert public video link]

#Hindsight #AgentMemory #TypeScript #NextJS
