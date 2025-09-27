# DataGuard — Privacy-Preserving Email Data Marketplace

ETHGlobal New Delhi 2025 Project

## Milestone 1: Extension MVP ✅ **COMPLETED**

### MVP Features
- Intercepts email data requests from third-party apps
- Applies user policy and redaction
- Returns filtered payload with payment processing

## Milestone 2: x402 Payment Integration (predefined price, WIP)

## Milestone 3: Agentic Negotiation

## Milestone 4: ZK Proof Integration with Circom/snarkjs (lower price) (out of scope for hackathon)

## 1 — One-line elevator pitch

**DataGuard**: transforms your inbox into a privacy-preserving marketplace where you get paid for email data access via x402 protocol while maintaining complete control over your data.

---

## 2 — Core goals (what I *intend* to deliver for hackathon)

* Build an end-to-end demo that proves the concept: extension negotiates payment via x402 protocol for email data access, applies user policy, returns filtered results with payment processing.
* Focus domain: **email** only with **decentralized storage integration**.
* Implement and demo **2 concrete predicates**: subscription acknowledgement & package delivery with **monetization**.
* Provide **AI agent negotiation** for automated pricing and **x402 payment processing** on Polygon testnet.
* Clear UI flow that shows payment negotiation, data access approval, and **user earnings**.

---

## 3 — Decided scope (what I am intentionally NOT building right now)

* No production Gmail OAuth integration in MVP — use **Dmail + IPFS** for decentralized email storage. ✅ **PLANNED**: Integration with Dmail Network for IPFS-stored emails.
* No complex ZK circuits for MVP — focus on **payment-for-data** model with basic privacy proofs.
* No full support for multiple data domains (photos, calendar, files) — email only.
* No mobile development — browser extension + web interface only.

---

## 4 — Primary use cases and predicates

### Core predicates to implement (MVP)

1. **Subscription Acknowledgement** 💰 **$0.10-0.50 per proof**
   * Predicate: "There exists an email from a recognized newsletter sender OR containing keyword `unsubscribe`/`subscription` in subject within the last X months."
   * Verifiable claim: boolean `has_subscription == true` or `count_subscriptions >= N`.
   * Demo value: AI training data, marketing intelligence, research analytics.

2. **Package Delivery** 💰 **$0.25-1.00 per proof**
   * Predicate: "There exists a delivery confirmation email from recognized carriers or ecommerce senders (Amazon, Flipkart, DHL) within the last X weeks."
   * Verifiable claim: `has_delivery == true` and optionally `count_deliveries >= N`.
   * Demo value: logistics analytics, consumer behavior research, targeted advertising.

### Additional predicate (nice-to-have)

3. **Proof of Purchase (count)** 💰 **$0.50-2.00 per proof**
   * Predicate: "Number of purchase-confirmation emails in the last M days ≥ K."
   * Verifiable claim: `count_purchases >= K`.
   * Demo value: financial services verification, loyalty program analytics, market research.

---

## 5 — High-level architecture

```
[Third-Party App / AI]  --request-->  [Browser Extension / Local Agent]
                                          |
                                          |--- reads local email store (mock)
                                          |--- applies user policy & redaction
                                          |--- runs predicate circuit -> generates ZK proof
                                          |--- returns filtered payload + proof -> to App

[Third-Party App] --verifies proof--> [On-chain Verifier Contract OR local JS verifier]
```

Components:

* **Browser extension**: intercepts outgoing data requests, presents UI prompt to user, forwards allowed queries to local agent.
* **Local agent**: small WASM or Node process (or BG script) that performs parsing, policy enforcement, and ZK proof generation.
* **Mock email store**: ✅ **COMPLETED** - JSON dataset with 21 realistic sample emails in `/mail-demo/src/data/sampleEmails.ts` with labeled types (purchase, subscription, delivery, general) and filtering functions.
* **ZK circuit**: simple circuit (e.g., count predicate) compiled with Circom/snarkjs or Noir; proof generated locally.
* **Verifier**: JS verifier for browser + optional on-chain verifier contract deployed on testnet (Holesky/Polygon testnet) to show on-chain verification.

---

## 6 — Technology stack (proposed)

* **Extension**: Chrome extension (MV3) using React for popup UI (or vanilla if time-constrained).
* **Local agent**: Node.js background process or extension background service worker. If proof generation needs it, run via WASM compiled circuits in-browser or call a local worker endpoint.
* **ZK**: Use **Circom + SnarkJS** or **Noir** depending on developer familiarity. (Question: which ZK stack are we most comfortable with?)
* **On-chain verification**: Solidity verifier from SnarkJS compiled for a testnet (Holesky or Polygon zk testnet). (Question: which testnet to deploy to for submission?)
* **Mock email store**: ✅ **COMPLETED** - TypeScript files in `/mail-demo/src/data/sampleEmails.ts` with varied realistic senders/domains (Amazon, DHL, GitHub, Netflix, etc.).
* **Optional payments**: Polygon x402 integration (later) — use Polygon Amoy or testnet.

---

## 7 — UX / Demo flow (exact judge demo script)

1. **Setup**: show the mock inbox (in the extension dev UI) — ✅ **COMPLETED**: 21 labeled emails available in `/mail-demo` with filtering by type (subscription, delivery, purchase, unread).
2. **Third-party request**: simulate an AI app requesting "Provide proof of package delivery in last 30 days."
3. **Agent prompt**: extension popup shows request, explains privacy implications, displays policy (auto-allow filtered data & generate proof / deny full access).
4. **User approves**: agent filters emails (returns subject + sender for matched emails but redacts bodies), generates ZK proof for `has_delivery == true`.
5. **Verification**: the third-party app runs JS verifier or verifies via on-chain call; verifier confirms proof valid without seeing other emails.
6. **UI confirmation**: extension shows what was revealed and shows proof verification status.

---

## 8 — ZK circuit design (initial plan)

* **Input**: hash commitments of email metadata (subject hashes, sender hashes, timestamp buckets) and a witness set describing which emails match predicate.
* **Predicate**: `count(matches) >= K`.
* **Output / public signals**: `K`, `count >= K` boolean (or exact count), root commitment or aggregator hash to bind proof to specific inbox snapshot.
* **Commitment strategy**: Emails hashed and combined into a Merkle root or aggregated commitment to prevent changing data after proof.
