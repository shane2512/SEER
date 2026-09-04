\# CLAUDE.md



\## Project: SEER



SEER (Structured Event Evaluation \& Reasoning) is a Somnia Testnet application that combines DreamDEX Event Contracts, the DreamDEX Bot Kit, and a deterministic decision pipeline to evaluate BTC/ETH event markets and execute permissioned trades.



The primary objective is a \*\*reliable 5-day hackathon MVP\*\*, not a production-grade trading platform.



\---



\## 1. Core Development Rules



\### Non-negotiable constraints



\* Target network: \*\*Somnia Testnet only\*\*

\* Event markets: \*\*DreamDEX BTC/ETH Event Contracts only\*\*

\* Trading integration: \*\*official DreamDEX Bot Kit\*\*

\* Never invent DreamDEX SDK methods, API endpoints, contract addresses, or market symbols.

\* Verify all DreamDEX integration behavior against the installed Bot Kit/docs before implementation.

\* Never put private keys in frontend code.

\* Never expose `.env` secrets to the browser.

\* Do not build features that are not required for the core demo.

\* Prefer a working end-to-end flow over theoretical architectural sophistication.



\### Priority order



1\. Working DreamDEX Event Contract integration

2\. Working Somnia Testnet transactions

3\. Safe Bot Kit/session-key execution

4\. Clear market/event visualization

5\. Deterministic decision/reasoning display

6\. Polished UI

7\. Optional enhancements



If a feature threatens items 1–5, remove the feature.



\---



\## 2. Technology Stack



\* TypeScript

\* Node.js

\* Next.js App Router

\* React

\* TailwindCSS

\* viem and/or ethers.js where required by the existing integration

\* DreamDEX Bot Kit

\* Somnia Testnet

\* REST/WebSocket APIs only where officially provided by DreamDEX

\* No unnecessary backend framework



\---



\## 3. Architecture Principles



Separate the application into three major layers:



```text

UI Layer

&#x20;   ↓

Application / Server Layer

&#x20;   ↓

DreamDEX + Somnia Web3 Engine

```



\### UI Layer



Responsible for:



\* Market display

\* Countdown

\* Signal display

\* Reasoning visualization

\* Trade status

\* Transaction links

\* P\&L visualization



The UI must not contain private keys or directly execute privileged Bot Kit operations.



\### Application Layer



Responsible for:



\* Validating requests

\* Selecting markets

\* Running decision logic

\* Calling Bot Kit services

\* Normalizing DreamDEX data

\* Returning safe JSON responses



\### Web3 Engine



Responsible for:



\* Somnia RPC communication

\* DreamDEX market access

\* Event Contract data

\* Bot Kit execution

\* Session/operator key management

\* Transaction monitoring



\---



\# 4. Commands



\## Install



```bash

npm install

```



\## Development



```bash

npm run dev

```



\## Production build



```bash

npm run build

```



\## Production start



```bash

npm run start

```



\## Lint



```bash

npm run lint

```



\## Formatting



If Prettier is configured:



```bash

npm run format

```



Check formatting:



```bash

npm run format:check

```



\## Type checking



```bash

npx tsc --noEmit

```



\## Tests



If the test suite exists:



```bash

npm test

```



For a specific test:



```bash

npm test -- <test-name>

```



Before submission, at minimum run:



```bash

npm run lint

npx tsc --noEmit

npm run build

npm test

```



Skip unavailable commands rather than creating unnecessary infrastructure solely to satisfy the command.



\---



\# 5. Environment Variables



Use `.env.local` for local development.



Example structure:



```env

NEXT\_PUBLIC\_SOMNIA\_CHAIN\_ID=

NEXT\_PUBLIC\_SOMNIA\_RPC\_URL=



DREAMDEX\_API\_URL=



BOT\_OPERATOR\_PRIVATE\_KEY=

BOT\_OWNER\_ADDRESS=

```



Rules:



\* Variables prefixed with `NEXT\_PUBLIC\_` are safe for browser exposure only.

\* Private keys MUST NOT use `NEXT\_PUBLIC\_`.

\* Never commit `.env.local`.

\* Never print private keys.

\* Never log full authorization credentials.

\* Server-side Bot Kit execution must remain server-side.



\---



\# 6. TypeScript Rules



Use strict TypeScript.



```ts

const value: string = "example";

```



Avoid:



```ts

const value: any = something;

```



Do not use `any` unless there is no practical alternative and the reason is documented.



Prefer explicit domain types:



```ts

type EventSide = "YES" | "NO";



type MarketSignal = {

&#x20; marketId: string;

&#x20; side: EventSide;

&#x20; confidence: number;

&#x20; rationale: string;

};

```



Use discriminated unions when states have different behavior:



```ts

type TradeState =

&#x20; | { status: "idle" }

&#x20; | { status: "pending"; requestId: string }

&#x20; | { status: "submitted"; txHash: string }

&#x20; | { status: "confirmed"; txHash: string }

&#x20; | { status: "failed"; error: string };

```



\---



\# 7. Error Handling



Never silently swallow errors.



Bad:



```ts

try {

&#x20; await executeTrade();

} catch {}

```



Good:



```ts

try {

&#x20; await executeTrade();

} catch (error) {

&#x20; console.error("Trade execution failed", error);

&#x20; throw new Error("Unable to execute trade");

}

```



For API routes:



\* Validate input.

\* Catch expected errors.

\* Return useful HTTP status codes.

\* Never return secrets or private implementation details.

\* Log server-side diagnostic information only.



For blockchain operations:



1\. Validate parameters.

2\. Submit transaction.

3\. Capture transaction hash.

4\. Wait for the appropriate confirmation/receipt mechanism.

5\. Return a normalized result.

6\. Handle reverted transactions explicitly.



\---



\# 8. React / State Management



Keep server state and UI state separate.



Prefer:



```text

Server/API

&#x20;   ↓

Normalized domain object

&#x20;   ↓

React component

```



Do not put DreamDEX SDK logic directly into large UI components.



Components should consume hooks/services such as:



```ts

useMarket()

useMarketSignal()

useTrade()

useTradeStatus()

```



Keep hooks focused on application state.



Do not create a global state store unless the application genuinely requires it.



\---



\# 9. Web3 Safety Rules



\### Private keys



Private keys belong exclusively on the server.



Never:



```ts

"use client";



const wallet = new Wallet(process.env.BOT\_OPERATOR\_PRIVATE\_KEY);

```



Never expose a private key through:



\* React props

\* API responses

\* browser storage

\* URL parameters

\* logs

\* client-side environment variables



\### Wallet architecture



SEER does not hold or sign with any trading private key on the server. Every visitor connects their own wallet (an injected browser provider — MetaMask or similar — via wagmi) and every order is signed by that wallet directly, through the SDK's `walletClient` signing mode. The server's only role in a trade is guardrail validation (`POST /api/trade/validate`) — it never sees, holds, or transmits a private key.



Do not reintroduce a server-held trading key. If a future feature genuinely needs one (e.g. an automated/unattended strategy), it must be a separate, clearly-scoped addition — not a fallback bolted onto the visitor-facing trade path.



\---



\# 10. DreamDEX Integration Rules



DreamDEX integration must be isolated.



Recommended structure:



```text

src/

├── lib/

│   ├── dreamdex/

│   │   ├── markets.ts

│   │   ├── event-contracts.ts

│   │   ├── orderbook.ts

│   │   └── client.ts

│   └── bot/

│       ├── context.ts

│       ├── execution.ts

│       └── permissions.ts

```



Do not spread DreamDEX calls across React components.



If a Bot Kit method is not present in the installed version, do not guess the method name.



Inspect:



```bash

node\_modules/

```



and the official Bot Kit documentation/source before implementation.



\---



\# 11. Deterministic Decision Engine



The decision engine must produce structured output.



Example:



```ts

type Decision = {

&#x20; direction: "BULLISH" | "BEARISH" | "NEUTRAL";

&#x20; confidence: number;

&#x20; rationale: string;

&#x20; marketId: string;

&#x20; timestamp: number;

};

```



The engine must never directly execute a trade.



Use:



```text

Input

&#x20;↓

Evaluation

&#x20;↓

Decision

&#x20;↓

Risk validation

&#x20;↓

Trade request

&#x20;↓

Bot Kit

```



Never:



```text

LLM/AI

&#x20;↓

Direct transaction

```



\---



\# 12. Trading Guardrails



The MVP should use hard limits.



Examples:



```ts

const MAX\_ORDER\_SIZE = ...;

const MAX\_PRICE\_DEVIATION = ...;

```



Before every trade:



\* Verify market exists.

\* Verify market is tradable.

\* Verify event has not expired.

\* Verify side is valid.

\* Verify quantity is within the demo limit.

\* Verify price is within configured bounds.

\* Verify operator is authorized.

\* Reject malformed requests.



No automatic unlimited trading.



\---



\# 13. Logging



Useful:



```text

\[MARKET] BTC event loaded

\[SIGNAL] BULLISH confidence=0.82

\[TRADE] order submitted

\[TRADE] tx=0x...

\[TRADE] confirmed

```



Never log:



```text

PRIVATE\_KEY=...

SEED\_PHRASE=...

```



\---



\# 14. UI Rules



Use TailwindCSS.



Prioritize:



\* readable typography

\* strong visual hierarchy

\* clear market state

\* obvious countdown

\* obvious signal

\* obvious transaction status



Avoid:



\* unnecessary animations

\* complicated dashboards

\* excessive gradients

\* decorative components with no information value



The judge must understand the product within five seconds.



\---



\# 15. Testing Strategy



Focus testing on the critical path.



Minimum tests:



```text

Market parsing

Decision generation

Trade validation

API request validation

Trade state transitions

```



For blockchain integration, prefer a small number of deterministic integration checks over a large artificial test suite.



Before submission verify:



```text

Somnia RPC

&#x20;       ↓

DreamDEX market discovery

&#x20;       ↓

Event Contract market

&#x20;       ↓

Bot Kit initialization

&#x20;       ↓

Session/operator permission

&#x20;       ↓

Order submission

&#x20;       ↓

Transaction confirmation

&#x20;       ↓

UI telemetry

```



\---



\# 16. Five-Day Rule



Every implementation decision must answer:



> "Does this increase the probability that the judge sees a working end-to-end DreamDEX Event Contract product?"



If no, defer it.



Do not add:



\* complex authentication

\* databases unless necessary

\* multi-chain support

\* mobile applications

\* advanced AI memory

\* autonomous multi-strategy trading

\* custom matching engines

\* unnecessary smart contracts

\* unnecessary tokenomics

\* production-grade infrastructure



The objective is a \*\*small, demonstrably real, technically credible MVP\*\*.



