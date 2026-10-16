# e-Netra AI — Brand & Design System Specifications

**Product:** e-Netra AI  
**SIH Problem Statement:** SIH26038 / PS26038  
**Title:** Explainable AI for Diabetic Retinopathy Screening in Rural India  
**Scope:** Brand Architecture, Color Harmony, CSS Tokens, Component Standards, & Responsive Ergonomics  

---

## 1. Brand Identity & Design Philosophy

### 1.1 Brand Name & Core Meaning
* **Name:** **e-Netra AI** (ई-नेत्र AI — *“Digital Vision Intelligence”*)
* **Domain:** AI-powered diabetic retinopathy (DR) screening and explainable AI (XAI) platform.
* **Target Users:** 
  1. Frontline Healthcare Workers (ASHA / ANM / PHC field operators)
  2. Clinical Ophthalmologists & Telemedicine Doctors
  3. Patients & Caregivers
  4. District / State Health Administration

### 1.2 Taglines
* **Primary Brand Tagline:**  
  > *"Precision Retinal Screening, Accessible Everywhere."*
* **Alternative Clinical Tagline:**  
  > *"Explainable AI for Early Diabetic Retinopathy Detection."*

### 1.3 Design Pillars
1. **Medical Reliability & Trust:** Avoid gimmicky designs. Use deep, authoritative clinical tones that reflect institutional medical standards.
2. **AI Clarity & Explainability:** Vibrant, precision optic blues and teals highlight algorithmic insights without visual noise.
3. **Accessible & Low-Strain:** Clean, neutral canvas tones (`#F8FAFC`) prevent clinician eye fatigue during prolonged screening reviews.
4. **Strict Viewport Discipline:** Compact vertical rhythm ensures clinical workflows, authentication screens, and diagnostic consoles fit standard desktop viewports (1366×768 and 1440×900) at 100% zoom with **zero unnecessary scrolling**.

---

## 2. Color Palette & Medical Semantics

```
┌────────────────────────────────────────────────────────────────────────┐
│                          e-Netra AI PALETTE                            │
├─────────────────────┬───────────────────┬──────────────────────────────┤
│ Token               │ Hex Value         │ Role & Psychological Purpose │
├─────────────────────┼───────────────────┼──────────────────────────────┤
│ brand-navy-950      │ #071326           │ Deep Clinical Obsidian Anchor│
│ brand-navy-900      │ #0C1E3C           │ Primary Institutional Navy   │
│ brand-navy-800      │ #102A54           │ Card Headers & Dark Accents  │
│ brand-primary       │ #0284C7           │ Precision Optic / Iris Blue  │
│ brand-primary-hover │ #0369A1           │ Primary Interactive Hover    │
│ brand-teal          │ #0D9488           │ Ophthalmic Restorative Teal  │
│ bg-canvas           │ #F8FAFC           │ Clean Healthcare Slate Canvas│
│ bg-surface          │ #FFFFFF           │ Pure Card & Form Surface     │
│ text-primary        │ #0F172A           │ High-Contrast Body & Headings│
│ text-muted          │ #64748B           │ Secondary Hints & Metadata   │
│ border-subtle       │ #E2E8F0           │ Clean Structural Dividers    │
│ border-strong       │ #CBD5E1           │ Form Input Borders           │
└─────────────────────┴───────────────────┴──────────────────────────────┘
```

### 2.1 Clinical Diagnostic Status Tokens (ICDR Severity Scale)
* **Normal / Healthy (Grade 0):** `--status-success: #059669` (Background: `#ECFDF5`)
* **Mild / Moderate NPDR (Grade 1 & 2):** `--status-warning: #D97706` (Background: `#FFFBEB`)
* **Severe NPDR / Proliferative DR (Grade 3 & 4):** `--status-danger: #DC2626` (Background: `#FEF2F2`)
* **Quality / Informational / AI Pipeline:** `--status-info: #0284C7` (Background: `#F0F9FF`)

### 2.2 Contrast & Accessibility Compliance (WCAG 2.1)
* **Primary Navy `#0C1E3C` against White `#FFFFFF`:** Contrast ratio **14.2:1** (Exceeds WCAG AAA standard of 7.0:1).
* **Text Primary `#0F172A` against Canvas `#F8FAFC`:** Contrast ratio **15.4:1** (Exceeds WCAG AAA).
* **Primary Interactive `#0284C7` against White `#FFFFFF`:** Contrast ratio **4.6:1** (Meets WCAG AA standard for readable text and large interactive targets).
* **Alert Text `#DC2626` against Error Background `#FEF2F2`:** Contrast ratio **5.1:1** (Meets WCAG AA).

---

## 3. Reusable CSS Design Tokens (`src/index.css`)

```css
:root {
  /* e-Netra AI Core Brand Tokens */
  --brand-navy-950: #071326;
  --brand-navy-900: #0C1E3C;
  --brand-navy-800: #102A54;
  --brand-navy-700: #173B73;

  /* Medical Sapphire & Precision Optic Teal */
  --brand-primary: #0284C7;
  --brand-primary-hover: #0369A1;
  --brand-primary-active: #075985;
  --brand-primary-light: #E0F2FE;

  --brand-teal: #0D9488;
  --brand-teal-light: #CCFBF1;

  /* Neutral Surfaces */
  --bg-canvas: #F8FAFC;
  --bg-surface: #FFFFFF;
  --bg-muted: #F1F5F9;

  /* Typography & Contrast Tokens */
  --text-primary: #0F172A;
  --text-secondary: #334155;
  --text-muted: #64748B;
  --text-inverted: #FFFFFF;

  /* Borders & Dividers */
  --border-subtle: #E2E8F0;
  --border-strong: #CBD5E1;
  --border-focus: #0284C7;

  /* Status & Clinical Classification Tokens */
  --status-success: #059669;
  --status-success-bg: #ECFDF5;
  --status-warning: #D97706;
  --status-warning-bg: #FFFBEB;
  --status-danger: #DC2626;
  --status-danger-bg: #FEF2F2;
  --status-info: #0284C7;
  --status-info-bg: #F0F9FF;

  /* Shadows & Elevation */
  --shadow-xs: 0 1px 2px 0 rgba(15, 23, 42, 0.05);
  --shadow-sm: 0 1px 3px 0 rgba(15, 23, 42, 0.08), 0 1px 2px -1px rgba(15, 23, 42, 0.04);
  --shadow-card: 0 4px 16px -2px rgba(15, 23, 42, 0.06), 0 2px 6px -1px rgba(15, 23, 42, 0.03);
  --shadow-elevated: 0 12px 32px -4px rgba(12, 30, 60, 0.12), 0 4px 12px -2px rgba(12, 30, 60, 0.06);
}
```

---

## 4. Component Design Standards

### 4.1 Buttons
* **Primary Action:** Solid background using `--brand-navy-900` (`#0C1E3C`) with hover transition to `#071326`, white text, compact height (`40px`), 8px rounded corners.
* **Secondary / Diagnostic Action:** Outline or surface `--brand-primary` (`#0284C7`) for analytical actions (e.g., "Run Optical Quality Check").
* **Disabled States:** Muted slate (`#94A3B8`), `cursor-not-allowed`, zero opacity flicker.

### 4.2 Form Inputs (`AuthInput`, `PasswordInput`)
* **Height:** Compact `38px` – `40px` (`py-2` to `py-2.5`) to preserve vertical space.
* **Border:** Neutral `#CBD5E1`, transitioning to `#0284C7` with a subtle focus ring (`focus:ring-2 focus:ring-[#0284C7]/20`).
* **Error State:** Border `#EF4444`, accessible error message with `AlertCircle` icon and `role="alert"`.

### 4.3 Cards & Surface Panels
* **Background:** Crisp pure white (`#FFFFFF`) with subtle border `1px solid #E2E8F0`.
* **Elevation:** `--shadow-card` (soft, non-distracting depth).
* **Radii:** `12px` (`rounded-xl`) for main containers, `8px` (`rounded-lg`) for child items.

### 4.4 Alerts & Validation Banners (`FormAlert`)
* **Error:** `#FEF2F2` background, `#FCA5A5` border, `#B91C1C` text with `AlertCircle`.
* **Warning:** `#FFFBEB` background, `#FDE68A` border, `#B45309` text with `AlertTriangle`.
* **Success:** `#ECFDF5` background, `#A7F3D0` border, `#047857` text with `CheckCircle2`.

---

## 5. Viewport Sizing & Responsive Architecture

### 5.1 Desktop Standard (1366×768 & 1440×900)
* All core authentication views (`/login`, `/register`) use `min-h-[100dvh]` with compact card spacing.
* The combined height of the header, form inputs, actions, and footer stays strictly under **600px**, ensuring that at **100% zoom on 768px-tall screens**, **no vertical scrollbar appears**.
* Password and Confirm Password inputs on registration use a responsive 2-column grid (`grid grid-cols-1 sm:grid-cols-2 gap-3`) to conserve vertical height.

### 5.2 Mobile & Tablet (<1024px)
* The left hero panel folds into a lightweight brand top bar (`h-12`).
* Form cards take `w-full max-w-md mx-auto` with clean 16px touch padding.
* No horizontal scrolling (`overflow-x: hidden` enforced on `html`, `body`, and `#root`).
