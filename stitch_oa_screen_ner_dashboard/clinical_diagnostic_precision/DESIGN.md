---
name: Clinical Diagnostic Precision
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#3f4850'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#707881'
  outline-variant: '#bfc7d2'
  surface-tint: '#006398'
  primary: '#006194'
  on-primary: '#ffffff'
  primary-container: '#007bb9'
  on-primary-container: '#fdfcff'
  inverse-primary: '#93ccff'
  secondary: '#5a5e6a'
  on-secondary: '#ffffff'
  secondary-container: '#dee2f0'
  on-secondary-container: '#606470'
  tertiary: '#006577'
  on-tertiary: '#ffffff'
  tertiary-container: '#008096'
  on-tertiary-container: '#f9fdff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#cce5ff'
  primary-fixed-dim: '#93ccff'
  on-primary-fixed: '#001d31'
  on-primary-fixed-variant: '#004b73'
  secondary-fixed: '#dee2f0'
  secondary-fixed-dim: '#c2c6d3'
  on-secondary-fixed: '#171c25'
  on-secondary-fixed-variant: '#424752'
  tertiary-fixed: '#acedff'
  tertiary-fixed-dim: '#4cd7f6'
  on-tertiary-fixed: '#001f26'
  on-tertiary-fixed-variant: '#004e5c'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
  data-metric:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 30px
    letterSpacing: -0.02em
  data-mono:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  none: 0px
  2xs: 0.25rem
  xs: 0.5rem
  sm: 0.75rem
  md: 1rem
  lg: 1.5rem
  xl: 2rem
  2xl: 2.5rem
  3xl: 3rem
  gutter-mobile: 1rem
  gutter-desktop: 1.5rem
  header-height: 4.25rem
  sidebar-collapsed: 4.5rem
  sidebar-expanded: 18rem
  card-padding: 1.25rem
---

## Brand & Style

This design system establishes an authoritative, high-integrity visual language for clinical AI diagnostics, specifically screening and prognostic analysis for musculoskeletal disorders such as osteoarthritis. It merges the analytical rigor of medical instrumentation with the seamless clarity of enterprise software.

### Brand Personality & Tone
- **Authoritative & Scientific:** Communicates peer-reviewed credibility, high diagnostic precision, and clinical rigor.
- **Calm & Diagnostic:** Avoids sensory fatigue during long diagnostic shifts; minimizes alarmist panic while ensuring urgent anomalies stand out unambiguously.
- **Technically Sophisticated:** Leverages balanced telemetry cues, data overlays, and computer vision diagnostics without descending into sci-fi caricature.

### Visual Style Movement
The design language combines **Clinical Clean Slate** with **Functional Diagnostic HUD Elements**:
- **Diagnostic Top Deck:** A deep midnight-slate command bar (`#090e17`) with subtle glassmorphic illumination gives context to patient sessions, camera feeds, and real-time inference telemetry.
- **Clinical Workspace:** High-contrast, clean-slate canvases (`#f8fafc`) housing pure white (`#ffffff`) surfaces, governed by ultra-fine structural borders (`#e2e8f0`) and balanced radius curves (16px / `1rem`).
- **Telemetry & Biomechanical Overlay:** High-visibility functional accents (Cyan `#06b6d4`, Emerald `#059669`, Amber `#d97706`, Crimson `#dc2626`) demarcate joint axes, cartilage space wear vectors, and risk classification stratification.

## Colors

The palette distinguishes between data manipulation, observation, and diagnostic triaging. The primary diagnostic canvas is grounded in light mode to provide the glare-free clarity required in standard diagnostic environments and clinical consultation rooms, balanced by deep navy headers for telemetry instrumentation.

### Core Roles
- **Primary (`#0284c7` - Active Sky Blue):** Direct actions, selected navigation items, primary interactive states, confirmed annotations, and active focus boundaries.
- **Secondary (`#090e17` - Deep Navy / Void Slate):** Command header, diagnostic frame containers, viewport metadata overlays, and dark-mode telemetry tools.
- **Tertiary (`#06b6d4` - Computer Vision Cyan):** Spatial bounding boxes, joint alignment markers, anatomical vector paths, cartilage thickness contours, and HUD crosshairs.
- **Neutral (`#64748b` - Slate):** Metadata labels, non-critical telemetry, inactive icons, axis lines, and secondary structural text.

### Clinical Status & Severity Tiers
- **Low Risk / Safe (`#059669` / `#10b981`):** Joint clearance within normal demographic bounds, healthy cartilage spacing, system connected, model confidence verified.
- **Moderate Risk / Monitor (`#d97706` / `#f59e0b`):** Subchondral sclerosis markers, minor asymmetric wear, review recommended within 6 months.
- **High Risk / Clinical Referral (`#dc2626` / `#ef4444`):** Severe joint space narrowing, subchondral cyst presence, advanced Kellgren-Lawrence (KL) Grade 3/4 probability, immediate orthopedic referral flagged.

### Canvas & Structural Colors
- **Canvas Base:** `#f8fafc` (Slate 50)
- **Card Surface:** `#ffffff` (Pure White)
- **Elevated Diagnostic Surface:** `#ffffff` with structural `#e2e8f0` border
- **Header Surface:** `#090e17` with 80% opacity and `backdrop-filter: blur(12px)`
- **Border Subtle:** `#e2e8f0` (Structural separators, card borders)
- **Border Focus:** `#0284c7` (With 2px offset or glow)
- **Text Primary:** `#0f172a` (Deep Slate)
- **Text Secondary:** `#475569` (Muted Slate)
- **Text Inverse:** `#f8fafc` (On dark command headers and tool surfaces)

## Typography

Typography prioritizes diagnostic readability under dense information scenarios. The hierarchy blends **Plus Jakarta Sans** for structure, primary figures, and structural card headers with **Inter** for clinical data grids, narrative diagnostics, telemetry flags, and input fields.

### Structural Typographic Rules
- **Plus Jakarta Sans** provides rounded geometry that softens clinical severity while keeping high stroke definitions in titles, scores, and metric readouts.
- **Inter** ensures uniform glyph spacing and legibility across numeric tables, radiologist notes, inference confidence distributions, and biomarker lists.
- **Tabular Figures (`tnum`):** All numerical representations, timestamps, Kellgren-Lawrence grades, and coordinate metrics must use OpenType tabular numerals (`font-feature-settings: "tnum" 1`) to prevent layout jitter during live telemetry streams.
- **Telemetry & Micro-Labels:** `label-sm` applies uppercase styling with `0.04em` tracking for clinical status flags (e.g., `JSN GRADE 2`, `BILATERAL`, `VARUS 4.2°`).

## Layout & Spacing

The layout is built on a responsive 12-column grid system paired with an 8-point spatial cadence (using a 4px sub-grid for dense clinical metric clusters).

### Viewport Segmentation
1. **Diagnostic Top Deck (Header):** Fixed `4.25rem` height spanning full width. Encapsulates active session identifiers, model versioning (`NER-Core v3.4`), sync status, and radiologist profile controls.
2. **Left Diagnostic Rail / Navigation:** Collapsible from `18rem` (patient record index, series history) down to `4.5rem` (icon-only mode during active radiograph inspection).
3. **Workspace Canvas:** Dynamically adjusts across breakpoints:
   - **Desktop (≥ 1280px):** 12-column split. Primary radiographic view / CV overlay occupies 7-8 columns; prognostic indices, joint space meters, and risk scoring occupy 4-5 columns.
   - **Tablet / Workstation (768px - 1279px):** 8-column layout. Split vertical stacks: visual viewport above, diagnostic cards and intervention triggers below.
   - **Mobile (≤ 767px):** Single-column stacked triage view with horizontal swipe for DICOM slice reviews.

### Density & Rhythms
- **Clinical Density:** Internal card padding is standardized to `1.25rem` (`20px`), ensuring visual compactness without sacrificing touch targets or readable grouping.
- **Gap Cadence:** Standard grid gutter is `1.5rem` on desktop, tightening to `1rem` on mobile. Related diagnostic readouts use micro-gaps (`0.5rem` / `xs`).

## Elevation & Depth

Visual hierarchy uses crisp surface contrast, subtle 1px delineations, and low-amplitude ambient shadows to keep views clear for medical imagery.

### Tonal Stratification
- **Ground Floor (Base Canvas):** `#f8fafc`. Recesses into the background, ensuring cards and diagnostic viewports feel crisp and isolated.
- **Level 1 (Card & Module Surfaces):** `#ffffff` with a continuous 1px solid `#e2e8f0` border. Shadow: `0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.02)`.
- **Level 2 (Active Viewports & Popovers):** `#ffffff` with `0 4px 6px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.04)` and 1px `#cbd5e1` edge definition.
- **Level 3 (Diagnostic Drawers & Modals):** `#ffffff` with `0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.04)`.

### Header Glassmorphism
The command header uses deep slate with glassmorphism:
- **Background:** `rgba(9, 14, 23, 0.88)`
- **Backdrop Blur:** `blur(12px)`
- **Underline Border:** 1px solid `rgba(255, 255, 255, 0.08)`
- **Interactive Island Chips:** `rgba(255, 255, 255, 0.05)` with subtle hover illumination to `rgba(255, 255, 255, 0.1)`.

### Vision HUD Depth
Overlays on radiographs or MRI slices do not use drop shadows. Instead, they use semi-transparent fills (`rgba(6, 182, 212, 0.15)`) bounded by crisp 1.5px high-contrast `#06b6d4` stroke lines, ensuring the underlying anatomical tissue remains clearly visible.

## Shapes

The geometric framework balances human-centered clinical software with the precision of diagnostic devices.

### Geometric Rules
- **Diagnostic Cards & Containers:** Radiused at 16px (`1rem` / `rounded-lg`). Softens the perimeter of complex data clusters while preserving clean corner alignment across grid matrices.
- **Interactive Elements (Buttons, Inputs, Selectors):** Radiused at 8px (`0.5rem` / `rounded-md`) to ensure clear tap targets and avoid confusion with status pills.
- **Status Chips, Triage Badges, and Biomarker Tags:** Fully rounded pill shapes (`9999px` / `rounded-full`) to differentiate classification metadata from interactive actions and data input fields.
- **Viewport Corner Accents:** Medical image containers use 16px outer radiuses, with interior DICOM HUD bounding boxes remaining strictly orthogonal (0px) to preserve coordinate geometry.

## Components

### Buttons & Interactive Triggers
- **Primary Clinical Action (e.g., "Confirm AI Assessment", "Run NER Pipeline"):** Solid `#0284c7` fill, white text, 8px corner radius, font weight 600. Active state transitions to `#0369a1`. Focus rings show a 2px offset in `#0284c7`.
- **Secondary / Review Action:** Pure white background, 1px border in `#e2e8f0`, text `#0f172a`. Hover transitions border to `#cbd5e1` with background `#f8fafc`.
- **Destructive / Override (e.g., "Flag False Positive"):** Subtle tint `#fef2f2`, 1px border `#fecaca`, text `#dc2626`. Hover changes fill to `#fee2e2`.

### Risk & Status Chips
- **Low Risk / In-Range:** Pill shape, background `rgba(16, 185, 129, 0.1)`, solid text `#047857`, left-anchored 6px pulsing dot `#10b981`.
- **Moderate Risk:** Pill shape, background `rgba(245, 158, 11, 0.12)`, solid text `#b45309`, left-anchored dot `#f59e0b`.
- **High Risk / Urgent Referral:** Pill shape, background `rgba(239, 68, 68, 0.12)`, solid text `#b91c1c`, left-anchored warning glyph or dot `#ef4444`.
- **Biomechanical / Vision Tag:** Pill shape, background `rgba(6, 182, 212, 0.12)`, text `#0891b2`, paired with monospaced coordinate/angle readouts.

### Input Fields & Search Filters
- **Default State:** Height `2.5rem` (40px), pure white fill, 1px border `#e2e8f0`, 8px corner radius, placeholder text `#94a3b8`.
- **Focus State:** 1px border `#0284c7`, outer halo `0 0 0 3px rgba(2, 132, 199, 0.15)`.
- **Clinical Measurement Input:** Right-aligned units (e.g., `mm`, `°`, `m/s`) locked in `#64748b` typography with monospace numeric characters.

### Cards & Diagnostic Panels
- **Standard Card:** 16px radius, pure white (`#ffffff`), 1px solid `#e2e8f0`, padding `1.25rem`. Header section features a bottom border in `#f1f5f9` with an uppercase category label in `label-sm` (`#64748b`).
- **Telemetry Card (Dark Variation):** Used within image viewing suites. Background `#090e17`, border 1px solid `rgba(255, 255, 255, 0.1)`, 16px radius, typography in `#f8fafc` and `#94a3b8`.

### Data Lists & Telemetry Tables
- **Row Architecture:** Minimum height `3rem` (48px), borders separated by 1px `#f1f5f9`, hover state `#f8fafc`.
- **Alignment:** Clinical parameters left-aligned; numerical scores, confidence metrics, and percentiles right-aligned using tabular monospace typography.

### Checkboxes & Segmented Controls
- **Checkboxes:** 18px × 18px, 4px corner radius, 1.5px border `#cbd5e1`. Checked state uses `#0284c7` fill with a crisp white check icon.
- **Segmented View Switcher (e.g., "Radiograph | Cartilage Mesh | Telemetry"):** Background `#f1f5f9`, padding 4px, 8px radius. Active segment features pure white card fill with subtle elevation and `#0f172a` text.

### Specialized Diagnostics: CV Annotation Overlays
- **Bounding Boxes & Joint Reticles:** 1.5px solid stroke `#06b6d4`, corner accents in `#22d3ee`.
- **Joint Space Measurement Callouts:** Semi-opaque dark badge (`#090e17` at 90%) with 1px border `#06b6d4`, housing monospace dimension readouts (e.g., `MEDIAL: 2.1mm [-1.4mm]`).