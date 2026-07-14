---
# Reusable skeleton for the root DESIGN.md (the visual system). The FILLED version lives at the
# repo root as DESIGN.md — edit THAT to change the system. Copy this only to reset/seed a new one.
# Follows the DESIGN.md spec: YAML frontmatter (normative tokens) + six fixed sections, in order,
# named exactly. Do not add/rename/reorder sections. Machine extensions (shadows, motion,
# breakpoints, tonal ramps, component HTML/CSS) live in .impeccable/design.json, NOT here.
name: [Project]
description: [one-line tagline]
colors:
  # one entry per real token; key = descriptive slug, value = hex (or OKLCH)
  ink: "#000000"
typography:
  display:
    fontFamily: "[Family, fallback]"
    fontSize: "[e.g. 36px]"
    fontWeight: 400
    lineHeight: 1.1
  body:
    fontFamily: "[Family, fallback]"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  # md: "8px"
spacing:
  # md: "16px"
components:
  # button-primary:
  #   backgroundColor: "{colors.ink}"
  #   textColor: "{colors.paper}"
  #   rounded: "{rounded.full}"
  #   padding: "10px 16px"
---

# Design System: [Project]

## 1. Overview

**Creative North Star: "[Named metaphor]"**

[2–3 paragraphs: personality, density, aesthetic philosophy, starting from the North Star. State
what the system explicitly rejects (from PRODUCT.md's anti-references). End with a short list.]

**Key Characteristics:**
- [...]

## 2. Colors

[One-sentence palette character.]

### Primary
- **[Name]** (#HEX): [where and why.]

### Secondary (optional)
- **[Name]** (#HEX): [role.]

### Neutral
- **[Name]** (#HEX): [text / bg / border role.]

### Named Rules (optional, powerful)
**The [Name] Rule.** [Forceful doctrine.]

## 3. Typography

**Display Font:** [Family]
**Body Font:** [Family]

**Character:** [1–2 sentences on the pairing.]

### Hierarchy
- **Display** ([weight], [size], [line-height]): [purpose.]
- **Body** ([weight], [size], [line-height]): [purpose; 65–75ch for prose.]
- **Label** ([weight], [size], [tracking], [case]): [purpose.]

### Named Rules (optional)
**The [Name] Rule.** [Doctrine about type use.]

## 4. Elevation

[One paragraph: shadows, tonal layering, or hybrid? If flat, say so and how depth is conveyed.]

### Named Rules (optional)
**The [Name] Rule.** [...]

## 5. Components

### Buttons
- **Shape / Primary / Hover-Focus / Secondary:** [...]

### Chips (if used)
- [...]

### Cards / Containers
- **Corner / Background / Shadow / Border / Padding:** [...]

### Inputs / Fields
- **Style / Focus / Error-Disabled:** [...]

### Navigation
- [style, states, mobile treatment.]

## 6. Do's and Don'ts

### Do:
- **Do** [specific prescription with exact values.]

### Don't:
- **Don't** [specific prohibition — carry every PRODUCT.md anti-reference here by name.]
