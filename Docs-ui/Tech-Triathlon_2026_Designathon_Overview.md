# Tech-Triathlon 2026 — Designathon Overview

## 1. Competition Context

Tech-Triathlon 2026 is one business challenge delivered across three phases over 15 days:

1. **Designathon** — design the complete user experience.
2. **Hackathon** — build the system based on the Designathon submission.
3. **Datathon** — develop predictions and a peak-day fleet allocation solution.

The Designathon deadline is **Tuesday, September 29, 2026 at 11:59 PM (Sri Lanka time)**.

> The Hackathon build must follow the Designathon submission, and judges will assess the continuity between the two phases.

---

## 2. Business Problem

The fictional company is **Waypoint Group**, a Sri Lankan retail group with three brands sharing one distribution network:

- **Waypoint Fresh** — 80 outlets; groceries, chilled and frozen goods; daily deliveries before stores open at 8 AM.
- **Waypoint Style** — 25 outlets; garments and cartons; weekly deliveries with seasonal peaks.
- **Waypoint Tech** — 15 outlets; appliances and electronics; as-needed deliveries for heavy, fragile, high-value goods.

The network contains:

- **120 outlets**
- **60 vehicles**
- **2 depots** — Peliyagoda and Kandy
- **16 refrigerated vehicles**
- Deliveries operating **Monday–Saturday**

Current planning relies heavily on spreadsheets, phone calls, printed run sheets, and dispatcher knowledge.

### Main problems to solve

- Fragmented order and planning process
- Poor visibility of delivery progress
- Unclear/poorly recorded deferral decisions
- Weak communication between warehouse, drivers, and stores
- No reliable proof-of-delivery workflow
- Difficulty anticipating future demand and capacity
- Unexpected service-time and lateness problems
- Unreliable field connectivity

---

## 3. Core Design Objective

Design **one connected delivery planning system** that supports:

**Ordering → Planning → Loading → Delivery → Receipt**

The system must connect all four user roles so that information created by one role becomes useful to the next.

The Designathon defines the experience that will later be implemented during the Hackathon.

---

## 4. Four User Roles

### Dispatcher

Works at the Peliyagoda planning office on a large screen with stable connectivity.

Needs to:

- Build the daily delivery plan
- Allocate orders to vehicles and trips
- See delivery progress
- Understand problems after vehicles leave
- Explain deferral decisions
- Identify outlets that have already been skipped

### Loader

Works at the warehouse dock using a shared tablet or terminal.

Needs to:

- See the stop sequence
- Load goods in an order that supports unloading
- Detect missing or damaged items before departure

### Driver

Works on the road using a personal phone.

Needs to:

- Follow the route
- Record delivery outcomes
- Capture proof of delivery
- Work when offline
- Synchronize records after connectivity returns

Driver interactions should be designed for use **when safely stopped**.

### Store Manager

Works at the outlet using a desktop or phone.

Needs to:

- Place and confirm orders
- Know the expected arrival time
- Receive clear notice when an order is deferred
- Confirm receipt
- Report delivery issues

---

## 5. Important Operating Constraints

The design should reflect the real constraints described in the brief.

### Vehicle constraints

- Every vehicle has **weight and volume limits**.
- Chilled/frozen goods require a **refrigerated vehicle**.
- Refrigerated vehicles can also carry ambient goods.
- Ambient vehicles cannot carry chilled/frozen goods.
- Each vehicle has a **weekly fuel quota**.
- A vehicle can run up to **two routes per day**.

### Outlet constraints

- Every outlet has a delivery window.
- Fresh deliveries must arrive before stores open at **8 AM**.
- Mall outlets may have fixed access windows.
- `van_only` outlets can only be served by vans.

### Demand and deferral

When demand exceeds available capacity:

- Some orders must be deferred.
- The dispatcher must record the reason.
- The design should make the impact of deferrals understandable.

### Connectivity

The driver workflow must continue working **offline** and reconcile records when connectivity returns.

---

## 6. Designathon Scope

The Designathon asks you to design the system around all four roles.

### Required deliverables

#### 1. User Personas

Create **one persona for each role**:

- Dispatcher
- Loader
- Driver
- Store Manager

Personas should be grounded in their working conditions and actual needs from the brief.

#### 2. Screen Flows

Show the screens each role needs to complete the workflow.

For **every screen**, provide a short rationale explaining:

- The screen's purpose
- What the user needs to accomplish
- What information is prioritized

#### 3. Degradation Screen

Design at least **one fully developed failure scenario**.

A degradation screen shows what the system does when the normal workflow breaks down.

Examples of relevant situations include:

- Offline connectivity
- Delivery problem
- Loading shortfall
- Capacity shortage / order deferral
- Route or access problem

The chosen scenario should be clearly named and include a short explanation of why it matters to Waypoint.

#### 4. High-Fidelity Prototype

Create a high-fidelity interactive prototype using a design tool of your choice.

The prototype should demonstrate the designed flows across the four roles.

#### 5. Demo Video

Create a **3–5 minute unlisted YouTube video** that:

- Walks through the design workflow
- Demonstrates the main design
- Explains important assumptions made for the scenario

Submit the YouTube URL in the submission form.

#### 6. AI Tool Disclosure

Explain:

- Which work was AI-assisted
- Which work was not AI-assisted
- How AI tools were used

### Optional

- **Core tradeoff explanation** — up to one page or one diagram
- **Style guide**

---

## 7. Designathon Judging Criteria

| Criterion | Weight |
|---|---:|
| Problem framing | 25% |
| Understanding of user context | 20% |
| Degradation screen quality | 15% |
| Domain accuracy | 10% |
| Scope and prioritization | 15% |
| Visual and interaction design, including consistency across roles | 15% |
| **Total** | **100%** |

---

## 8. What the Design Should Demonstrate

A strong submission should clearly show how information moves through the operation:

**Store Manager**
→ places order

**Dispatcher**
→ closes/collects orders  
→ plans and allocates vehicles/trips  
→ handles deferred orders

**Loader**
→ follows the planned stop sequence  
→ flags loading issues

**Driver**
→ follows route  
→ records delivery and proof of delivery  
→ works offline when necessary

**Store Manager**
→ confirms receipt  
→ reports issues

The key idea is **continuity across roles**, rather than designing four disconnected dashboards.

---

## 9. Submission Format

Organize the following into **one design file with distinct pages**:

- Personas
- Screen flows
- Screen rationales
- Degradation screen(s)
- Diagrams
- AI tool disclosure
- Optional core tradeoff explanation
- Optional style guide

### Filename

Use:

`TeamName_Designathon`

Then compress it as:

`TeamName_Designathon.zip`

Also submit:

- Prototype shareable link
- Demo video YouTube link

### Submission deadline

**September 29, 2026 — 11:59 PM Sri Lanka time**

---

## 10. Most Important Designathon Priorities

Keep these in mind while designing:

1. **Understand the real users and their working environments.**
2. **Connect the four roles into one workflow.**
3. **Respect Waypoint's operational constraints.**
4. **Show how the system behaves when things go wrong.**
5. **Prioritize important workflows instead of designing unnecessary features.**
6. **Keep the visual and interaction design consistent across all roles.**
7. **Make the prototype detailed enough that it can become the specification for the Hackathon build.**

---

## Source

Based on the official **Tech-Triathlon 2026 Challenge Booklet**.

Key Designathon requirements and deadline are described in the Designathon section of the booklet. 
