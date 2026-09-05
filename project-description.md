\# SEER — Project Description



\## 1. Project Name



\*\*SEER\*\*



\### Structured Event Evaluation \& Reasoning



\---



\## 2. One-Sentence Description



SEER is an explainable trading agent for DreamDEX Event Contracts that evaluates BTC/ETH short-horizon events, produces a structured market decision, and executes the selected outcome through a permissioned DreamDEX Bot Kit operator on Somnia Testnet.



\---



\# 3. The Problem



Event Contracts simplify trading into binary questions such as:



> Will BTC move UP or DOWN before the event expires?



However, automated trading systems create a transparency problem.



A user can see:



```text

BUY YES

```



but may not understand:



```text

Why was YES selected?

What market state triggered it?

What confidence did the system have?

Who actually executed the order?

What happened afterward?

```



SEER addresses this by making the evaluation-to-execution pipeline visible.



\---



\# 4. The Solution



SEER creates an observable decision pipeline:



```text

DreamDEX Event

&#x20;      ↓

Market Evaluation

&#x20;      ↓

Structured Signal

&#x20;      ↓

Confidence

&#x20;      ↓

Rationale

&#x20;      ↓

Risk Validation

&#x20;      ↓

Bot Kit

&#x20;      ↓

Permissioned Operator

&#x20;      ↓

DreamDEX Event Contract

&#x20;      ↓

Somnia Testnet

&#x20;      ↓

Execution Result

```



Instead of hiding the automated trading process behind a single button, SEER exposes the important state transitions.



\---



\# 5. Core Product Experience



A user selects a BTC or ETH Event Contract.



SEER evaluates it and produces:



```text

Direction:

BULLISH



Confidence:

82%



Rationale:

Structured evaluation favors the UP outcome.



Action:

BUY YES

```



The user can then execute the decision.



The official DreamDEX Bot Kit handles the permissioned trading operation.



The interface displays:



```text

Evaluation

&#x20;     ↓

Execution

&#x20;     ↓

Transaction

&#x20;     ↓

Position

&#x20;     ↓

Result

```



\---



\# 6. Why DreamDEX Event Contracts?



DreamDEX provides an ideal environment for SEER because the product is designed around short-duration binary outcomes.



The Event Contract interface makes the decision understandable immediately:



```text

BTC

UP vs DOWN

15-minute event

```



This creates a strong hackathon demonstration.



The judge does not need to understand a complicated derivatives protocol before understanding the product.



\---



\# 7. Why Somnia?



SEER is designed specifically around Somnia Testnet and DreamDEX.



The project demonstrates:



\* on-chain execution

\* high-frequency market interaction

\* automated trading infrastructure

\* permissioned bot execution

\* transparent transaction state



Somnia therefore becomes part of the product architecture rather than simply being the deployment network.



\---



\# 8. Technical Differentiator



SEER is not positioned as:



> "An AI that trades crypto."



Instead:



> \*\*SEER is an observable decision engine for Event Contracts.\*\*



The differentiation is the combination of:



```text

Event Contract

\+

Structured Evaluation

\+

Explainability

\+

Permissioned Automation

\+

On-chain Verification

```



\---



\# 9. MVP



The MVP contains only the components required to demonstrate the complete loop.



\### Required



\* BTC/ETH Event Contract market discovery

\* Market data

\* Countdown

\* Structured evaluation

\* Signal

\* Confidence

\* Rationale

\* Trade validation

\* DreamDEX Bot Kit execution

\* Operator/session-key architecture

\* Transaction hash

\* Execution state

\* Basic P\&L/result display



\---



\# 10. Target User



The primary user is:



> A DeFi trader who wants automated Event Contract execution without blindly trusting an opaque trading bot.



Secondary users:



\* DeFi researchers

\* Bot developers

\* Prediction-market traders

\* Hackathon judges/developers exploring DreamDEX



\---



\# 11. Hackathon Demonstration



The complete demonstration should show:



```text

1\. Live BTC/ETH event

2\. Market state

3\. SEER evaluation

4\. Decision

5\. Rationale

6\. Bot execution

7\. Transaction hash

8\. Updated position/result

```



The entire experience should be understandable within approximately one minute.



\---



\# 12. Future Vision



The hackathon MVP can eventually evolve into:



\* multi-agent market evaluation

\* historical strategy performance

\* automated strategy backtesting

\* richer market signals

\* social prediction feeds

\* trader reputation

\* copy strategies

\* automated portfolio management

\* risk-adjusted strategy selection



These features are intentionally outside the 5-day MVP.



\---



\# 13. Success Definition



SEER succeeds if a judge can answer "yes" to all five questions:



```text

Can I see a real DreamDEX Event Contract?



Can I see SEER evaluate it?



Can I understand the resulting decision?



Can I see a real Bot Kit execution?



Can I independently verify the resulting transaction?

```



If all five are demonstrated reliably, the MVP has achieved its primary objective.



