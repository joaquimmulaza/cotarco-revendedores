# Design System: Cotarco Revendedores

## 1. Visual Theme & Atmosphere
The Cotarco Revendedores platform is defined by a **Professional B2B/B2C Marketplace** aesthetic. It prioritizes clarity, structural hierarchy, and high-trust visual cues. The density is balanced, favoring generous whitespace and clean separation between product blocks.

- **Creative North Star:** "The Trustworthy Distributor."
- **Atmosphere:** Clean, architectural, and reliable.
- **Visual Style:** Minimalist with vibrant red accents for directional focus.

## 2. Color Palette & Roles
This palette is derived from the current Cotarco brand identity and the specific technical requirements for the revendedores platform.

- **Coty Red** (#f22f1d) — **Primary Action.** Used for the main CTA buttons, focus states, and key brand highlights.
- **Slate Support** (#737272) — **Secondary Surface.** Used for secondary text, supportive UI elements, and non-primary icons.
- **Cool Metal** (#99a1af) — **Tertiary / Meta.** (User Request) Used for auxiliary text, disabled states, subtle borders, and background-muted elements.
- **Paper Base** (#f9f9f9) — **Primary Background.** A soft, white surface that reduces eye strain while maintaining a clean look.
- **Charcoal Ink** (#333333) — **Body Text.** High-contrast neutral for readable descriptions and titles.

## 3. Typography Rules
- **Font Family:** `Liberation Sans` (Single Source of Truth).
- **Scale:** Aggressive hierarchy through font weight. Titles use **Bold**, body uses **Regular**.
- **Line Height:** Relaxed leading (1.6) for readability in product descriptions.
- **Banned:** Pure black (#000000), Inter (unless as emergency fallback), any decorative or script fonts.

## 4. Component Stylings
- **Buttons:**
    - Primary: Coty Red (#f22f1d) with white text. Slightly rounded (8px). 
    - Secondary: Slate Support (#737272) outline with subtle hover scale.
- **Cards:** Diffused shadows (Elevation 2) and generous internal padding. No hard 1px borders; use background shifts instead.
- **Inputs:** Labeled above. Cool Metal (#99a1af) borders that transition to Coty Red on focus.
- **Navigation:** Glassmorphic headers with `backdrop-filter: blur(10px)` and 95% opacity.

## 5. Layout Principles
- **Container:** Max-width 1440px centered for desktop.
- **Spacing:** 8px base grid. Sections separated by at least 4rem of whitespace.
- **Mobile First:** All layouts collapse to a single column below 768px. Touch targets must be at least 44px.

## 6. Motion & Interaction
- **Interactions:** Subtle scale transforms (1.02x) on hover for interactive elements.
- **Transitions:** 0.2s duration with ease-in-out easing for all visual state changes.

## 7. Anti-Patterns (Banned)
- **No Pure Black:** Always use Charcoal (#333).
- **No Border Overload:** Avoid boxing everything. Use whitespace and tonal shifts for grouping.
- **No AI Clichés:** Avoid generic placeholder data; use [metric] or [content] for missing data.
- **No Neon:** Strictly avoid neon glows or purple-based "tech" aesthetics.
