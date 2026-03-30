# Pulse Family Management: Design Specification

This document provides a comprehensive technical and design breakdown of the Pulse mobile application, optimized for adult-focused family coordination.

---

## 1. Global Visual Identity (Obsidian Amethyst)

- **Design Ethos:** "The Digital Heirloom" — Sophisticated, high-density, and emotionally resonant.
- **Theme Mode:** Dark Mode (Pure Black `#000000` backgrounds).
- **Visual Style:** Glassmorphism (translucent panels, subtle glows) over atmospheric home interior photography.
- **Primary Accent:** Vibrant Pink-Purple Gradient (`#D63384` to `#6F42C1`).
- **Typography:**
  - Headlines: Plus Jakarta Sans (Bold, tracking-tight)
  - Body/Metadata: Manrope (Medium, tracking-widest for labels)

---

## 2. Core Components (Standardized)

### A. Master "Add" Button (Floating Action Button)

- **Visual:** 56x56dp circular button with a pink-purple gradient background and a white `+` icon.
- **Placement:** Fixed at `bottom: 24px`, `right: 24px`.
- **Function:** Central entry point for adding Events, Documents, or Tasks.

### B. Standardized Bottom Navigation

| Tab | Purpose |
|-----|---------|
| Home | Dashboard overview |
| Household Vault | Secure document storage |
| Calendar | Schedule management |
| Tasks | Family coordination |

- **Style:** `bg-[#131313]/40 backdrop-blur-xl` with active indicator (pink dot below icon).

---

## 3. Screen-Specific Breakdowns

### Screen 1: Master Dashboard (Home)

- **Focus:** "At-a-glance" daily summary.
- **Header:** Condensed "Today" title; date in 12pt gray text directly beneath.
- **Weather:** Compact Celsius (°C) widget at top right.
- **Schedule:** High-density list showing entries from 08:00 to 22:00.
- **Task Summary:** "Top Focus" section at bottom with two urgent pill-shaped task cards (Pink and Purple).

---

### Screen 2: Household Vault

- **Focus:** Family documentation access.
- **Search:** "Search Household" bar with glassmorphic styling.
- **Layout:** Metallic-finished folders in a 2x2 grid (Insurance, Medical, Finances, IDs).
- **Navigation:** Renamed from "Document Vault" to "Household Vault".

---

### Screen 3: Family Calendar (Monthly Agenda)

- **Focus:** Long-term chronological planning.
- **View:** Continuous vertical scroll of all monthly events starting from the current date.
- **Interaction:** Tapping a date in the top grid filters the list to that specific day (Daily Agenda View).

---

### Screen 4: Family Task List (Kanban)

- **Focus:** Cross-family coordination.
- **Layout:** Full-screen vertical columns: To Do, To Discuss, Assigned.
- **Card Design:** Ultra-slim glass pills with family member avatars for instant identification.

---

### Screen 5: My Tasks (Personalized)

- **Focus:** Individual accountability.
- **Logic:** Filtered list showing ONLY tasks assigned to the current user in the `To Do` state.
- **Layout:** Single-column high-density list for maximum focus.

---

### Screen 6: Calendar (Daily Filtered View)

- **Focus:** Immediate daily execution.
- **Header:** Displays selected date (e.g. "October 19, 2023") with a "Back to Month" navigation button.
- **Schedule:** Detailed timeline including start and end times for all family activities.

---

*This specification serves as the source of truth for the Pulse app architecture and visual language.*
