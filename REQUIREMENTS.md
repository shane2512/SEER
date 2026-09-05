\# SEER — Requirements Specification



\## 1. Purpose



This document defines the minimum technical and product requirements for SEER.



The project must remain small enough to complete within a five-day hackathon sprint.



\---



\# 2. Functional Requirements



\## FR-01 — Somnia Testnet



The application MUST operate against Somnia Testnet for the hackathon MVP.



The application MUST NOT require mainnet functionality.



\---



\## FR-02 — DreamDEX Integration



The application MUST integrate with DreamDEX.



The implementation MUST use the official DreamDEX tooling available for the project.



No simulated replacement may be used for the final demonstration.



\---



\## FR-03 — Event Contract Markets



SEER MUST support the available BTC and/or ETH Event Contract markets.



The UI MUST identify:



\* underlying asset

\* market/event

\* event direction

\* expiration

\* market status



\---



\## FR-04 — Market Data



The application MUST retrieve current market information through the appropriate DreamDEX integration.



The UI SHOULD expose:



\* best bid

\* best ask

\* market side

\* time remaining

\* relevant liquidity/volume information when available



\---



\## FR-05 — SEER Evaluation



SEER MUST produce a structured evaluation.



Required output:



```ts

type Decision = {

&#x20; marketId: string;

&#x20; direction: "BULLISH" | "BEARISH" | "NEUTRAL";

&#x20; confidence: number;

&#x20; rationale: string;

&#x20; timestamp: number;

};

```



\---



\## FR-06 — Determinism



Given the same normalized input, the decision pipeline SHOULD produce the same structured result.



The evaluation layer MUST be separated from transaction execution.



\---



\## FR-07 — Trade Validation



Every trade request MUST be validated before execution.



Minimum validation:



```text

Market exists

Market is active

Market is tradable

Event has not expired

Side is valid

Quantity is valid

Price is valid

Trade size is within configured limit

Operator is authorized

```



\---



\# 3. Bot Requirements



\## BR-01 — Official Bot Kit



Trading MUST use the official DreamDEX Bot Kit.



The project MUST NOT implement a replacement trading protocol.



\---



\## BR-02 — Permissioned Operator



The trading architecture SHOULD use the documented DreamDEX owner/operator model.



Conceptually:



```text

Owner/Fund Key

&#x20;      ↓

Grant Permission

&#x20;      ↓

Operator Key

&#x20;      ↓

Trade

```



\---



\## BR-03 — Key Isolation



The operator private key MUST remain server-side.



The frontend MUST NEVER receive:



\* operator private key

\* owner private key

\* seed phrase

\* signing credentials



\---



\## BR-04 — Owner Protection



The fund/owner account MUST remain separate from the hot operator process.



The operator SHOULD only possess the permissions required by the Bot Kit for trading.



\---



\# 4. Transaction Requirements



After submitting an order, SEER MUST expose:



```text

Transaction hash

Submission state

Confirmation state

Market

Side

Price

Quantity

Timestamp

```



Possible state machine:



```text

IDLE

&#x20;↓

VALIDATING

&#x20;↓

SUBMITTING

&#x20;↓

SUBMITTED

&#x20;↓

CONFIRMED

```



Failure state:



```text

FAILED

```



\---



\# 5. Frontend Requirements



\## UI-01 — Dashboard



The dashboard MUST contain:



```text

Market

Countdown

Market State

SEER Signal

Confidence

Rationale

Trade Action

Execution Status

Transaction

Position/Result

```



\---



\## UI-02 — Five-Second Hook



The first screen MUST communicate three things immediately:



```text

WHAT?

BTC/ETH Event Contract



WHAT DOES SEER THINK?

BULLISH / BEARISH / NEUTRAL



WHAT CAN I DO?

EXECUTE

```



\---



\## UI-03 — Reasoning Feed



The UI SHOULD expose structured evaluation steps such as:



```text

MARKET DETECTED

&#x20;     ↓

EVENT ACTIVE

&#x20;     ↓

SIGNAL GENERATED

&#x20;     ↓

RISK CHECK PASSED

&#x20;     ↓

ORDER SUBMITTED

&#x20;     ↓

TRANSACTION CONFIRMED

```



The application MUST NOT claim to expose private model chain-of-thought.



Only concise, user-facing rationales and structured decision metadata should be displayed.



\---



\# 6. API Requirements



API routes SHOULD be separated by responsibility.



Example:



```text

/api/markets

/api/evaluate

/api/trade

/api/trade/status

```



Each endpoint MUST:



\* validate inputs

\* handle asynchronous errors

\* return structured responses

\* avoid exposing secrets

\* avoid leaking internal stack traces



\---



\# 7. Type Requirements



TypeScript MUST run in strict mode.



Avoid:



```ts

any

```



Prefer:



```ts

unknown

```



with explicit validation where necessary.



All external DreamDEX responses SHOULD be normalized into application-specific types before being consumed by UI components.



\---



\# 8. Error Requirements



The application MUST handle:



\### Market errors



```text

Market unavailable

Market expired

Market not tradable

```



\### Network errors



```text

RPC unavailable

API unavailable

Timeout

```



\### Trading errors



```text

Unauthorized operator

Invalid order

Insufficient balance

Transaction reverted

```



\### UI errors



```text

Loading state

Empty state

Error state

Retry state

```



\---



\# 9. Security Requirements



MUST:



\* Keep private keys server-side.

\* Keep secrets out of Git.

\* Use `.env.local`.

\* Add `.env\*` secrets to `.gitignore` as appropriate.

\* Never print private keys.

\* Never return private keys through API routes.

\* Restrict trade sizes.

\* Validate all trade parameters.

\* Use Somnia Testnet only.



\---



\# 10. Performance Requirements



The application should avoid unnecessary blockchain calls.



Preferred:



```text

Market data

&#x20;   ↓

Cache / normalized state

&#x20;   ↓

UI

```



rather than every component independently querying the chain.



Use polling or WebSocket updates only where supported and useful.



Do not build an elaborate indexing system for the MVP.



\---



\# 11. Non-Functional Requirements



\## NFR-01 — Reliability



The primary demo path must work repeatedly.



\---



\## NFR-02 — Maintainability



Web3 logic MUST NOT be embedded directly inside presentation components.



\---



\## NFR-03 — Modularity



Recommended boundaries:



```text

UI

&#x20;↓

Hooks

&#x20;↓

Application API

&#x20;↓

Domain logic

&#x20;↓

DreamDEX/Bot Kit

&#x20;↓

Somnia

```



\---



\## NFR-04 — Observability



Important events should be logged:



```text

market\_loaded

evaluation\_started

evaluation\_completed

trade\_validation\_started

trade\_submitted

trade\_confirmed

trade\_failed

```



Logs MUST NOT contain secrets.



\---



\# 12. Out-of-Scope Requirements



The following are explicitly excluded from the 5-day MVP:



```text

Multi-chain support

Production custody

DAO

Token

Governance

Social graph

Copy trading network

Complex user authentication

Mobile application

Advanced portfolio management

Custom matching engine

Custom blockchain

Complex database architecture

Multi-agent orchestration

Autonomous strategy marketplace

Production-grade oracle system

```



\---



\# 13. Acceptance Criteria



SEER is considered MVP-complete when all of the following are true:



\### Market



```text

\[✓] BTC/ETH Event Contract visible

\[✓] Market data visible

\[✓] Expiration visible

```



\### Evaluation



```text

\[✓] Decision generated

\[✓] Direction displayed

\[✓] Confidence displayed

\[✓] Rationale displayed

```



\### Execution



```text

\[✓] Bot Kit initialized

\[✓] Operator permissions validated

\[✓] Event Contract order submitted

\[✓] Transaction hash captured

\[✓] Transaction confirmed

```



\### UX



```text

\[✓] Judge understands product within 5 seconds

\[✓] Execution state is obvious

\[✓] Blockchain proof is visible

\[✓] No fake final-demo trading data

```



\### Engineering



```text

\[✓] TypeScript passes

\[✓] Lint passes

\[✓] Production build passes

\[✓] Secrets are protected

\[✓] Testnet-only configuration verified

```



\---



\# 14. Definition of Done



The project is \*\*DONE\*\* when a fresh user can perform:



```text

Open SEER

&#x20;  ↓

Select BTC/ETH Event

&#x20;  ↓

See live event state

&#x20;  ↓

Run SEER evaluation

&#x20;  ↓

See BULLISH/BEARISH/NEUTRAL

&#x20;  ↓

Read rationale

&#x20;  ↓

Execute

&#x20;  ↓

DreamDEX Bot Kit submits order

&#x20;  ↓

Somnia confirms transaction

&#x20;  ↓

SEER displays TX + result

```



Anything that does not strengthen this loop is secondary to submission readiness.



