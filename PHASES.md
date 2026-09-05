\# SEER — Development Phases



\## Project Development Roadmap



SEER is developed incrementally from initial repository setup to a production-ready Event Contract automation platform.



The architecture must preserve the following core pipeline throughout every phase:



```text

User / Market Event

&#x20;       ↓

Market Data

&#x20;       ↓

SEER Evaluation Engine

&#x20;       ↓

Structured Decision

&#x20;       ↓

Risk Validation

&#x20;       ↓

DreamDEX Bot Kit

&#x20;       ↓

Permissioned Operator

&#x20;       ↓

DreamDEX Event Contract

&#x20;       ↓

Somnia

&#x20;       ↓

Transaction / Position / Result

&#x20;       ↓

SEER Analytics

```



\---



\# Phase 0 — Project Initialization



\## Objective



Create a clean, reproducible development environment.



\## Tasks



\* Initialize Git repository.

\* Initialize Next.js with App Router.

\* Configure TypeScript strict mode.

\* Configure TailwindCSS.

\* Configure ESLint.

\* Configure Prettier.

\* Configure environment variables.

\* Create `.env.example`.

\* Configure `.gitignore`.

\* Create initial project directory structure.

\* Add basic application layout.

\* Verify local development server.



\## Structure



```text

app/

components/

hooks/

lib/

scripts/

public/

```



\## Acceptance Criteria



```text

✓ npm install works

✓ npm run dev works

✓ npm run build works

✓ TypeScript compiles

✓ ESLint works

✓ Secrets are excluded from Git

```



\---



\# Phase 1 — Somnia Testnet Connectivity



\## Objective



Establish reliable blockchain connectivity before implementing trading.



\## Tasks



\* Configure Somnia Testnet RPC.

\* Configure chain/network metadata required by the application.

\* Initialize the appropriate viem/ethers client.

\* Implement basic network health check.

\* Verify chain ID.

\* Verify RPC connectivity.

\* Verify wallet/account connectivity where required.



\## Architecture



```text

SEER Server

&#x20;   ↓

Blockchain Client

&#x20;   ↓

Somnia Testnet RPC

&#x20;   ↓

Somnia

```



\## Acceptance Criteria



```text

✓ RPC responds

✓ Correct Somnia Testnet detected

✓ Read operations work

✓ Errors are handled

✓ No private key exposed to frontend

```



\---



\# Phase 2 — DreamDEX Integration Foundation



\## Objective



Integrate DreamDEX using the official available APIs/SDK/Bot Kit rather than creating custom protocol abstractions.



\## Tasks



\* Install the required DreamDEX dependencies.

\* Inspect the installed DreamDEX Bot Kit/API interfaces.

\* Configure DreamDEX connection.

\* Implement market discovery.

\* Normalize DreamDEX market responses.

\* Identify supported BTC/ETH Event Contract markets.

\* Retrieve event state.

\* Retrieve available market/order-book information where supported.



\## Recommended Structure



```text

lib/

└── dreamdex/

&#x20;   ├── client.ts

&#x20;   ├── markets.ts

&#x20;   ├── event-contracts.ts

&#x20;   └── orderbook.ts

```



\## Important Rule



Never guess an SDK method or API endpoint.



If an interface is unavailable:



1\. Inspect the installed package.

2\. Check official documentation.

3\. Check the official example/template.

4\. Adapt the application to the actual interface.



\## Acceptance Criteria



```text

✓ DreamDEX connection works

✓ BTC/ETH Event Contract discovered

✓ Market data normalized

✓ Event expiry available

✓ Market status available

✓ Failures handled gracefully

```



\---



\# Phase 3 — Event Contract Domain Layer



\## Objective



Create a protocol-independent domain model around DreamDEX Event Contracts.



\## Tasks



Create strongly typed domain objects.



Example:



```ts

type EventAsset = "BTC" | "ETH";



type EventSide = "YES" | "NO";



type EventMarket = {

&#x20; id: string;

&#x20; asset: EventAsset;

&#x20; expiresAt: number;

&#x20; active: boolean;

&#x20; tradable: boolean;

};

```



Create services for:



\* market selection

\* event state

\* expiry validation

\* price normalization

\* order validation



\## Architecture



```text

DreamDEX Raw Data

&#x20;       ↓

Normalization

&#x20;       ↓

SEER Domain Model

&#x20;       ↓

Application

```



\## Acceptance Criteria



```text

✓ UI does not depend on raw DreamDEX responses

✓ Domain objects are strongly typed

✓ Expired markets can be rejected

✓ Invalid markets can be rejected

```



\---



\# Phase 4 — SEER Evaluation Engine



\## Objective



Build the core intelligence layer independently from trading execution.



\## Tasks



Create:



```text

lib/

└── seer/

&#x20;   ├── evaluator.ts

&#x20;   ├── decision.ts

&#x20;   └── validation.ts

```



The evaluator consumes normalized market/event information.



It produces a structured decision:



```ts

type Decision = {

&#x20; marketId: string;

&#x20; direction: "BULLISH" | "BEARISH" | "NEUTRAL";

&#x20; confidence: number;

&#x20; rationale: string;

&#x20; timestamp: number;

};

```



\## Critical Separation



The evaluator MUST NOT execute transactions.



Correct:



```text

Evaluation

&#x20;   ↓

Decision

&#x20;   ↓

Validation

&#x20;   ↓

Execution

```



Incorrect:



```text

Evaluation

&#x20;   ↓

Direct Wallet Transaction

```



\## Acceptance Criteria



```text

✓ Evaluation produces structured output

✓ Confidence is bounded

✓ Rationale is user-facing

✓ Same input produces predictable structured behavior

✓ Evaluation cannot directly execute trades

```



\---



\# Phase 5 — Risk \& Trade Validation



\## Objective



Prevent an evaluation from blindly becoming an order.



\## Tasks



Implement validation for:



\* market existence

\* market activity

\* market expiry

\* tradability

\* valid side

\* valid quantity

\* valid price

\* maximum order size

\* operator authorization

\* sufficient available trading resources where supported



\## Pipeline



```text

SEER Decision

&#x20;     ↓

Risk Validator

&#x20;     ↓

Approved / Rejected

```



Example:



```ts

type ValidationResult =

&#x20; | {

&#x20;     valid: true;

&#x20;   }

&#x20; | {

&#x20;     valid: false;

&#x20;     reason: string;

&#x20;   };

```



\## Acceptance Criteria



```text

✓ Invalid trades are rejected

✓ Expired markets are rejected

✓ Oversized orders are rejected

✓ Unauthorized execution is rejected

✓ Validation occurs before Bot Kit execution

```



\---



\# Phase 6 — DreamDEX Bot Kit Execution



\## Objective



Connect the validated SEER decision to real DreamDEX Event Contract execution on Somnia Testnet.



\## Tasks



\* Initialize the official DreamDEX Bot Kit.

\* Configure the documented wallet/operator model.

\* Configure permissions according to the Bot Kit.

\* Create server-side execution service.

\* Submit Event Contract orders.

\* Capture transaction/order identifiers.

\* Track execution status.

\* Handle rejected/reverted transactions.



\## Architecture



```text

SEER Decision

&#x20;     ↓

Risk Validator

&#x20;     ↓

Bot Execution Service

&#x20;     ↓

DreamDEX Bot Kit

&#x20;     ↓

Operator / Session Key

&#x20;     ↓

DreamDEX

&#x20;     ↓

Somnia Testnet

```



\## Security Rules



The browser must never possess:



```text

Owner Private Key

Operator Private Key

Seed Phrase

Signing Credentials

```



Only the server-side execution environment may access privileged credentials.



\## Acceptance Criteria



```text

✓ Bot Kit initializes

✓ Operator permissions work

✓ Testnet order can be submitted

✓ Transaction/order ID captured

✓ Confirmation state tracked

✓ Failure state handled

```



\---



\# Phase 7 — Application API Layer



\## Objective



Expose the SEER engine to the Next.js frontend through controlled server-side APIs.



\## Suggested Routes



```text

app/

└── api/

&#x20;   ├── markets/

&#x20;   │   └── route.ts

&#x20;   ├── evaluate/

&#x20;   │   └── route.ts

&#x20;   ├── trade/

&#x20;   │   └── route.ts

&#x20;   └── trade/

&#x20;       └── status/

&#x20;           └── route.ts

```



\## Responsibilities



\### `/api/markets`



Returns normalized Event Contract data.



\### `/api/evaluate`



Runs the SEER evaluation engine.



\### `/api/trade`



Validates and sends an approved trade to the Bot Kit.



\### `/api/trade/status`



Returns normalized execution state.



\## Security



Every endpoint must:



\* validate input

\* handle errors

\* return typed responses

\* avoid leaking credentials

\* avoid exposing internal stack traces



\---



\# Phase 8 — Frontend MVP



\## Objective



Create the minimum interface required to demonstrate the complete SEER workflow.



\## Components



```text

components/

├── dashboard/

│   ├── MarketCard.tsx

│   ├── SignalCard.tsx

│   ├── ReasoningFeed.tsx

│   ├── TradePanel.tsx

│   ├── PositionCard.tsx

│   └── PnLCard.tsx

│

└── markets/

&#x20;   ├── MarketList.tsx

&#x20;   ├── EventHeader.tsx

&#x20;   └── Countdown.tsx

```



\## User Flow



```text

Open Dashboard

&#x20;     ↓

Select BTC/ETH Event

&#x20;     ↓

View Market

&#x20;     ↓

Run SEER

&#x20;     ↓

View Signal

&#x20;     ↓

View Rationale

&#x20;     ↓

Execute

&#x20;     ↓

View Transaction

&#x20;     ↓

View Result

```



\## Acceptance Criteria



```text

✓ Judge understands product immediately

✓ Live Event Contract visible

✓ Signal visible

✓ Confidence visible

✓ Rationale visible

✓ Execution status visible

✓ Transaction visible

```



\---



\# Phase 9 — Reasoning \& Execution Telemetry



\## Objective



Make SEER's decision-to-execution pipeline observable.



\## UI State Machine



```text

IDLE

&#x20;↓

EVALUATING

&#x20;↓

DECISION\_READY

&#x20;↓

VALIDATING

&#x20;↓

EXECUTING

&#x20;↓

SUBMITTED

&#x20;↓

CONFIRMED

```



Failure:



```text

FAILED

```



\## Display



The frontend should show structured events:



```text

MARKET DETECTED

&#x20;     ↓

EVENT ACTIVE

&#x20;     ↓

SEER EVALUATION

&#x20;     ↓

BULLISH 82%

&#x20;     ↓

RISK CHECK PASSED

&#x20;     ↓

ORDER SUBMITTED

&#x20;     ↓

TX CONFIRMED

```



Do not expose or claim to expose private model chain-of-thought.



Display concise user-facing rationales and structured decision metadata instead.



\---



\# Phase 10 — Position \& P\&L Layer



\## Objective



Show what happened after execution.



\## Tasks



Track where supported:



\* entry price

\* current price

\* position size

\* side

\* event status

\* realized result

\* unrealized result

\* transaction hash

\* timestamps



\## Architecture



```text

Trade

&#x20; ↓

Execution

&#x20; ↓

Position

&#x20; ↓

Market State

&#x20; ↓

P\&L

```



\## Acceptance Criteria



```text

✓ Position state is visible

✓ Transaction is verifiable

✓ P\&L calculations use normalized values

✓ Loading/unknown states are handled

```



\---



\# Phase 11 — Reliability \& Testing



\## Objective



Ensure the critical path survives repeated execution.



\## Unit Tests



Test:



```text

Market normalization

Decision schema

Confidence validation

Trade validation

State transitions

P\&L calculations

```



\## Integration Tests



Test:



```text

Somnia RPC

DreamDEX connectivity

Market discovery

Event Contract retrieval

Bot Kit initialization

Trade submission

Transaction tracking

```



\## Critical Path Test



```text

Market

&#x20;↓

Evaluation

&#x20;↓

Validation

&#x20;↓

Bot

&#x20;↓

Transaction

&#x20;↓

Confirmation

&#x20;↓

UI

```



The critical path should be tested repeatedly on Somnia Testnet.



\---



\# Phase 12 — Security Hardening



\## Objective



Remove preventable security failures before public demonstration.



\## Checklist



```text

✓ No private key in frontend

✓ No private key in Git

✓ No secrets in logs

✓ .env.local ignored

✓ Server-side signing only

✓ Operator permissions minimized

✓ Trade size limited

✓ Input validation enabled

✓ Expired markets rejected

✓ Unsupported markets rejected

✓ Transaction failures handled

```



\## Additional Rules



Never allow arbitrary frontend input to become an unrestricted order.



Use:



```text

Frontend

&#x20;  ↓

Server Validation

&#x20;  ↓

SEER Decision

&#x20;  ↓

Risk Validation

&#x20;  ↓

Bot Kit

```



\---



\# Phase 13 — UX \& Demo Optimization



\## Objective



Optimize the product specifically for hackathon judging.



\## 5-Second Hook



The first screen should immediately communicate:



```text

BTC EVENT



UP      63%

DOWN    37%



01:42 REMAINING



SEER

BULLISH · 82%



\[ EXECUTE ]

```



After execution:



```text

ORDER CONFIRMED



BUY YES



DreamDEX

Somnia Testnet



TX

0x123...abc

```



\## Remove



Do not clutter the first screen with:



\* configuration panels

\* developer logs

\* complicated charts

\* unnecessary navigation

\* technical documentation

\* unused statistics



Technical depth belongs behind the primary experience.



\---



\# Phase 14 — Hackathon MVP Freeze



\## Objective



Create the final submission version.



At this point the following must work:



```text

DreamDEX Event

&#x20;      ↓

SEER Evaluation

&#x20;      ↓

Signal

&#x20;      ↓

Risk Check

&#x20;      ↓

Bot Kit

&#x20;      ↓

Testnet Execution

&#x20;      ↓

Transaction

&#x20;      ↓

Result

```



\## Freeze Rule



No new major features after MVP freeze.



Only:



```text

Bug fixes

Performance improvements

Security fixes

UX improvements

Demo reliability

Documentation

```



\---



\# Phase 15 — Production Architecture Preparation



\## Objective



Prepare the codebase for a future production deployment without adding production complexity to the hackathon MVP.



\## Potential Improvements



\* persistent database

\* authenticated users

\* encrypted secret management

\* dedicated bot workers

\* monitoring

\* structured logging

\* retry queues

\* rate limiting

\* durable execution state

\* historical trade database

\* analytics pipeline

\* automated alerting



These should NOT be introduced during the five-day sprint unless required by the working MVP.



\---



\# Phase 16 — Production Deployment



\## Objective



Deploy SEER as a reliable application.



\## Production Architecture



```text

&#x20;                   ┌──────────────────┐

&#x20;                   │   Next.js App    │

&#x20;                   │     Frontend     │

&#x20;                   └────────┬─────────┘

&#x20;                            │

&#x20;                            ▼

&#x20;                   ┌──────────────────┐

&#x20;                   │   API / Server   │

&#x20;                   └────────┬─────────┘

&#x20;                            │

&#x20;            ┌───────────────┼────────────────┐

&#x20;            ▼               ▼                ▼

&#x20;     ┌─────────────┐ ┌─────────────┐ ┌──────────────┐

&#x20;     │ SEER Engine │ │ DreamDEX    │ │ Persistence  │

&#x20;     │             │ │ Integration │ │ / Analytics  │

&#x20;     └─────────────┘ └──────┬──────┘ └──────────────┘

&#x20;                            │

&#x20;                            ▼

&#x20;                    ┌──────────────┐

&#x20;                    │ DreamDEX     │

&#x20;                    │ Bot Kit      │

&#x20;                    └──────┬───────┘

&#x20;                           │

&#x20;                           ▼

&#x20;                    ┌──────────────┐

&#x20;                    │ Somnia       │

&#x20;                    │ Network      │

&#x20;                    └──────────────┘

```



\## Production Requirements



Before real production deployment:



\* dedicated secret management

\* secure key storage

\* access control

\* monitoring

\* rate limiting

\* transaction retry strategy

\* failure recovery

\* persistent execution history

\* comprehensive integration tests

\* operational alerts

\* explicit risk controls

\* production network configuration



\---



\# Phase 17 — Future Product Expansion



Only after the core system is stable.



Potential extensions:



```text

Multi-Agent Evaluation

&#x20;       ↓

Strategy Comparison

&#x20;       ↓

Historical Performance

&#x20;       ↓

Risk-Adjusted Strategy Ranking

&#x20;       ↓

Social Trading

&#x20;       ↓

Strategy Reputation

&#x20;       ↓

Automated Portfolio Management

```



Potential future features:



\* multiple evaluation strategies

\* strategy backtesting

\* historical market analytics

\* trader/strategy reputation

\* social signals

\* copy strategies

\* configurable risk profiles

\* automated strategy selection



These are future product directions, not hackathon MVP requirements.



\---



\# Phase Completion Model



Every phase must satisfy:



```text

IMPLEMENT

&#x20;   ↓

TEST

&#x20;   ↓

VERIFY

&#x20;   ↓

DOCUMENT

&#x20;   ↓

ONLY THEN MOVE FORWARD

```



A phase is incomplete if its acceptance criteria are not satisfied.



\---



\# Critical Path



The entire project can be reduced to one invariant:



```text

REAL DREAMDEX EVENT

&#x20;       ↓

REAL SEER DECISION

&#x20;       ↓

REAL VALIDATION

&#x20;       ↓

REAL BOT KIT EXECUTION

&#x20;       ↓

REAL SOMNIA TESTNET TRANSACTION

&#x20;       ↓

REAL UI TELEMETRY

```



If this path works reliably, SEER has a valid hackathon MVP.



Everything else is an extension of this path.



