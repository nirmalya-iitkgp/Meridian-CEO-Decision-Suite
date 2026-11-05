# Meridian — Dynamic Cascading Strategy & Execution Engine

Meridian is an interactive strategy deployment platform built around **Hoshin Kanri (Catchball Process)**, **OGSM (Objectives, Goals, Strategies, Measures)**, and the **Flight Levels Model** (Strategic, Coordination, Operational).

## Core Capabilities

1. **Cascading Goal Tree (`Cascading Tree`)**
   - Visualizes how **Flight Level 3 (Strategic)** Objectives and Goals cascade via deep indigo (`#3730A3`) connector lines into **Flight Level 2 (Coordination)** Strategies and **Flight Level 1 (Operational)** Team Measures.
   - Supports Flight Level filtering, live search, branch expand/collapse, and cascading child creation.

2. **Interactive Catchball Negotiation Canvas (`Catchball`)**
   - Organizes active strategy negotiations into horizontal Flight Level swimlanes.
   - Teams can propose **Counter-Offer Targets**, adjust **Confidence Sliders (`0%–100%`)**, record rationale, and ratify commitments with **Emerald (`#059669`) Agreed** sign-off badges.

3. **Real-Time Alignment Telemetry (`Alignment Telemetry`)**
   - Dynamically computes the **Enterprise Alignment Index**, **Catchball Agreement Rate**, and **Mean Team Confidence** using radial SVG gauges.
   - Automatically flags **Execution Gaps** (`Cascade Break`, `Target Variance > 15%`, `Low Confidence < 65%`, and `Pending Sign-Off`) with one-click navigation to resolve them in Catchball.
   - Includes a consolidated **OGSM Deployment Matrix**.

4. **Scenario Portability & Security**
   - In-memory session state with schema-validated **JSON Import / Export** and one-click **Reset** to the baseline FY2026 enterprise dataset.
   - Hardened JSON parser with 512 KB size limits, prototype pollution stripping, safe ID validation, and circular hierarchy detection.

## Development & Verification

```bash
# Install dependencies
npm install

# Run unit & security tests
npm test

# Type-check and build
npm run lint
npm run build
```
