# Meridian: Dynamic Cascading Strategy & Execution Engine

Meridian is an interactive strategy deployment platform that operationalizes Hoshin Kanri, OGSM (Objectives, Goals, Strategies, Measures), and the Flight Levels model. It replaces static strategy decks and email threads with a live **Catchball Negotiation Canvas**, a **Cascading Goal Tree**, and **Alignment Telemetry** that dynamically compute alignment density and flag execution gaps across Strategic, Coordination, and Operational tiers.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following product and architectural choices have been confirmed from your requirements and will govern the build:
> - **Primary Navigation**: Three dedicated tabbed views (**Cascading Tree**, **Catchball Swimlanes**, and **Alignment Telemetry**) inside a clean executive workspace.
> - **Catchball Negotiation Mechanics**: Interactive counter-offer target inputs, team confidence sliders (`0%–100%`), and explicit sign-off state transitions (`Proposed`, `Counter-Offered`, `Agreed`, `At Risk`) with emerald agreement indicators.
> - **Session & Data Persistence**: In-memory session state pre-populated with a realistic enterprise transformation dataset, paired with strict schema-validated **JSON Import / Export** and a one-click **Reset to Baseline** action.

> [!NOTE]
> **Security & Verification**: All imported JSON strategy payloads will undergo strict structural and bounds validation (preventing prototype pollution, malformed numeric targets, or out-of-range confidence values), backed by automated unit tests for the alignment calculation engine and security boundaries.

---

## 1. Overview & Core Concept

- **What It Does**:
  - **Cascading Goal Tree (`Tree` Tab)**: Visualizes how top-level **Flight Level 3 (Strategic)** OGSM Objectives and Goals cascade via deep indigo (`#3730A3`) connector lines into **Flight Level 2 (Coordination)** Strategies and **Flight Level 1 (Operational)** Team Measures. Executives can expand/collapse branches, filter by Flight Level or alignment status, inspect node-level OGSM details, and add new cascading child objectives or measures.
  - **Catchball Negotiation Canvas (`Catchball` Tab)**: Organizes active strategy negotiations into horizontal Flight Level swimlanes. Leadership proposes a target metric; receiving teams can accept (`Agree`), propose a **Counter-Offer Target** with rationale, adjust their **Confidence Slider**, or flag a resource/dependency blocker. Every adjustment immediately recalculates parent and enterprise alignment scores.
  - **Alignment Telemetry (`Alignment Telemetry` Tab)**: Provides real-time **Alignment Index Gauges**, **Flight Level Density Breakdown** (Strategic vs. Coordination vs. Operational coverage), **Execution Gap Diagnostics** (highlighting unlinked strategies, low-confidence commitments, and target-vs-counter-offer deltas), and an **OGSM Matrix Summary**.
- **Target Audience**: Chief Strategy Officers (CSOs), VPs of Strategy & Transformation, and Enterprise PMO Directors.
- **Key Value**: Eliminates the strategy-to-execution gap by making target negotiation transparent, quantitative, and traceable across every organizational tier.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Executive Overview & Tree Inspection**: On launch, the user lands on the **Cascading Tree** view with an executive summary strip showing the overall **Enterprise Alignment Index**, **Catchball Agreement Rate**, **Active Execution Gaps**, and **Flight Level Coverage**. Clicking any node opens a focused inspector drawer or inline editor.
  2. **Catchball Target Negotiation**: Switching to **Catchball** displays team swimlanes grouped by Flight Level. A PMO Director or Team Lead adjusts a counter-offer target, slides confidence from `85%` to `60%`, and submits a counter-offer—immediately updating the node's status and flagging any newly created alignment gap. Leadership can then click **Accept Counter-Offer** to lock in an emerald (`#059669`) **Agreed** state.
  3. **Gap Resolution & Telemetry Audit**: Switching to **Alignment Telemetry** reveals real-time radial/linear alignment gauges per Flight Level and an actionable list of execution gaps (e.g., *Orphaned Strategic Goal*, *Target Variance > 15%*, *Low Confidence < 65%*), allowing one-click navigation back to the offending node.
  4. **Scenario Portability**: Using the top-right **Export JSON** and **Import JSON** controls, executives can save scenario snapshots or load alternative annual operating plans with instant validation feedback.

- **Visual Identity & Theme**:
  - **Aesthetic Direction**: Expressive Executive Canvas / Clean Multi-Tiered Dashboard—high-craft editorial clarity with crisp 1px structural hairlines, generous whitespace, and zero visual clutter.
  - **Color Palette**:
    - *Dominant Canvas (60%)*: Light Slate (`#F8FAFC`) background with crisp white (`#FFFFFF`) elevated surfaces.
    - *Structural Surfaces (30%)*: Cool Slate (`#F1F5F9`) secondary panels, `#E2E8F0` 1px hairline borders, and `#0F172A` / `#475569` high-contrast typography.
    - *Accent & Semantic Budget (10%)*: Deep Indigo (`#3730A3`) for cascading connector lines, active tabs, and primary actions; Emerald (`#059669`) for Catchball agreement badges and nominal alignment; Amber (`#D97706`) for counter-offer/variance warnings; Crimson (`#DC2626`) for execution gaps.
  - **Typography & Hierarchy**:
    - *Display & Headings*: `Plus Jakarta Sans` (SemiBold/Bold) with `text-wrap: balance` and tight tracking.
    - *Body & Controls*: `DM Sans` for crisp scannability across dense strategy cards and swimlanes.
    - *Tabular Numerals*: `JetBrains Mono` with `font-variant-numeric: tabular-nums` for all targets, counter-offers, confidence percentages, and alignment indices.
  - **Component Styling & Restraint**:
    - Single-level card elevation (`border border-slate-200 bg-white`), no nested cards-within-cards, no thick left accent stripes, and no decorative pulsing dots.
    - Metadata rendered as clean unboxed text with `·` separators; interactive view tabs and Flight Level filters rendered as clean segmented `<button>` controls.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Deterministic Alignment & Gap Engine**
  - *Chosen Approach*: Compute alignment scores, target variance percentages, and execution gaps deterministically from the strategy graph (weighing Catchball agreement status, team confidence, target-vs-counter-offer delta, and parent-child linkage across Flight Levels).
  - *Why*: Executives need predictable, auditable math when negotiating annual targets—every slider move or counter-offer produces an immediate, explainable change in the Alignment Index.
  - *Alternatives Considered*: Subjective manual status ratings, which hide underlying target deltas and orphan strategies.

- **Decision 2: In-Memory Session State with Strict JSON Schema Validation**
  - *Chosen Approach*: Manage all strategy nodes, OGSM mappings, and Catchball negotiations in reactive client-side state with a dedicated sanitization/validation parser for JSON import and clean serialization for JSON export.
  - *Why*: Enables instant what-if scenario modeling without backend latency while protecting against malformed or malicious JSON payloads.
  - *Alternatives Considered*: Server-side database persistence, which adds unnecessary setup friction for rapid scenario workshops.

---

## 4. Technical Architecture & Data Strategy

- **Architecture & Component Diagram**:

```text
┌───────────────────────────────────────────────────────────────────────────┐
│                         Meridian Executive Workspace                      │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ Top Bar: Brand Wordmark │ View Tabs (Tree / Catchball / Telemetry)  │  │
│  │          │ Primary Actions (Import JSON, Export JSON, Add Node)     │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                     │                                     │
│                                     ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │              Reactive Strategy & Catchball State Store              │  │
│  │  • OGSM & Flight Level Nodes (FL3 Strategic, FL2 Coord, FL1 Ops)    │  │
│  │  • Catchball Negotiation State (Target, Counter, Confidence, Sign)  │  │
│  │  • Deterministic Alignment & Gap Calculation Engine                 │  │
│  │  • Schema-Validated JSON Importer / Exporter                        │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│           │                         │                         │           │
│           ▼                         ▼                         ▼           │
│  ┌─────────────────┐     ┌─────────────────────┐     ┌─────────────────┐  │
│  │  Cascading Tree │     │ Catchball Swimlanes │     │   Alignment     │  │
│  │      Canvas     │     │       Canvas        │     │   Telemetry     │  │
│  │                 │     │                     │     │                 │  │
│  │ • Indigo (#3730 │     │ • Flight Level      │     │ • Alignment     │  │
│  │   A3) SVG       │     │   Swimlanes         │     │   Index Gauges  │  │
│  │   Connectors    │     │ • Counter-Offer     │     │ • Density by    │  │
│  │ • Flight Level  │     │   Target Inputs     │     │   Flight Level  │  │
│  │   Filters       │     │ • Confidence Slider │     │ • Execution Gap │  │
│  │ • Node Detail   │     │ • Emerald (#059669) │     │   Diagnostics   │  │
│  │   Inspector     │     │   Sign-Off Badges   │     │ • OGSM Matrix   │  │
│  └─────────────────┘     └─────────────────────┘     └─────────────────┘  │
└───────────────────────────────────────────────────────────────────────────┘
```

- **Data Model & State**:
  - **StrategyNode**: Represents an item in the Hoshin Kanri / OGSM hierarchy with `id`, `parentId`, `flightLevel` (`FL3_STRATEGIC` | `FL2_COORDINATION` | `FL1_OPERATIONAL`), `ogsmType` (`OBJECTIVE` | `GOAL` | `STRATEGY` | `MEASURE`), `title`, `ownerTeam`, `unit`, `proposedTarget`, `counterTarget`, `confidence` (`0–100`), `status` (`PROPOSED` | `COUNTER_OFFERED` | `AGREED` | `AT_RISK`), and `notes`.
  - **AlignmentMetrics**: Derived state calculating overall `alignmentIndex` (`0–100`), `agreementRate` (`%`), per-Flight-Level density and confidence averages, and structured `ExecutionGap` records (`ORPHAN_NODE`, `TARGET_VARIANCE`, `LOW_CONFIDENCE`, `UNRESOLVED_COUNTER`).

- **Interactive Component & State Mapping**:
  - **Cascading Tree Canvas**: Renders hierarchical tiers with deep indigo (`#3730A3`) SVG bezier connectors, Flight Level filter buttons, expand/collapse toggles, and a slide-over inspector to edit OGSM attributes or add child nodes.
  - **Catchball Swimlanes Canvas**: Groups nodes into Flight Level swimlanes where users can edit counter-offer targets, drag confidence sliders, submit counter-offers with notes, or click **Accept & Agree** to transition status to `AGREED` with an emerald (`#059669`) badge.
  - **Alignment Telemetry**: Displays custom SVG radial/arc gauges for the Enterprise Alignment Index and Flight Level health, an interactive Execution Gap table that jumps directly to any flagged node, and a consolidated OGSM deployment matrix.
