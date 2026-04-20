# Design System — CineCritic

This document is the visual source of truth for the Movie Review Website.
Agent 2 (Frontend) must follow these specs for all UI decisions.

---

## Brand

- **Name:** CineCritic
- **Logo treatment:** "cine" in white (`#F0EDF6`), "critic" in purple accent (`#8B5CF6`). Font-weight 600, font-size 18px. No image logo — text only.
- **Vibe:** Dark, cinematic, modern. Think Letterboxd meets a premium streaming app. Clean surfaces, generous whitespace, subtle purple accents.

---

## Color Palette

### Backgrounds

| Token | Hex | Usage |
|---|---|---|
| `--bg-deep` | `#0D0B1A` | Page background |
| `--bg-surface` | `#16132A` | Recessed areas (poster placeholders, inputs) |
| `--bg-card` | `#1E1B34` | Cards, dropdowns, form containers |
| `--bg-card-hover` | `#262342` | Card hover state |
| `--bg-modal` | `#1A1730` | Modal background |

### Purple Accent Ramp

| Token | Hex | Usage |
|---|---|---|
| `--purple-accent` | `#8B5CF6` | Primary actions, active states, links, borders |
| `--purple-light` | `#A78BFA` | Hover text, active nav items, highlighted labels |
| `--purple-dim` | `#6D28D9` | Button hover, avatar backgrounds |
| `--purple-glow` | `rgba(139,92,246,0.15)` | Card hover border, focus rings |
| `--purple-subtle` | `rgba(139,92,246,0.08)` | Active filter background, review form toggle bg |

### Text

| Token | Hex | Usage |
|---|---|---|
| `--text-primary` | `#F0EDF6` | Headings, titles, primary body text |
| `--text-secondary` | `#9B95AD` | Descriptions, metadata, secondary labels |
| `--text-muted` | `#6B6580` | Timestamps, placeholders, disabled text |

### Semantic / Genre Tags

| Genre | Background | Text Color |
|---|---|---|
| Drama | `rgba(139,92,246,0.15)` | `#A78BFA` |
| Sci-fi | `rgba(96,165,250,0.15)` | `#60A5FA` |
| Thriller | `rgba(248,113,113,0.15)` | `#F87171` |
| Comedy | `rgba(251,191,36,0.15)` | `#FBBF24` |
| Romance | `rgba(244,114,182,0.15)` | `#F472B6` |
| Action | `rgba(52,211,153,0.15)` | `#34D399` |
| Horror | `rgba(248,113,113,0.20)` | `#F87171` |
| Animation | `rgba(96,165,250,0.15)` | `#60A5FA` |

### Star Ratings

| Token | Hex | Usage |
|---|---|---|
| `--star-filled` | `#FBBF24` | Filled star (gold/amber) |
| `--star-empty` | `#3D3856` | Empty star |

Stars use the Unicode character `★` (U+2605). Filled stars get `--star-filled`, empty stars get `--star-empty`. Always round to nearest whole star for display. Show numeric average alongside (e.g., "4.6 ★★★★★").

---

## Typography

- **Font stack:** `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- **No serif fonts anywhere.**

| Element | Size | Weight | Color |
|---|---|---|---|
| Page title / modal title | 20px | 700 | `--text-primary` |
| Section headings ("Community reviews") | 14px | 600 | `--text-secondary`, uppercase, `letter-spacing: 0.5px` |
| Card title | 13px | 600 | `--text-primary` |
| Body text / review text | 13px | 400 | `--text-secondary` |
| Small meta (year, dates, counts) | 11–12px | 400 | `--text-muted` |
| Genre tag text | 10px | 500 | Per-genre color (see table above) |
| Nav links | 13px | 400 | `--text-secondary` (active: `--purple-light`) |
| Logo | 18px | 600 | See Brand section |

---

## Spacing & Layout

- **Page max-width:** `960px`, centered
- **Page padding:** `0 24px` on desktop, `0 16px` on mobile
- **Card grid:** `display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px`
  - Desktop (~960px): 4–5 columns
  - Tablet (~600px): 3 columns
  - Mobile (~375px): 2 columns
- **Border radius:**
  - Cards: `10px`
  - Buttons, inputs, tags: `8px`
  - Genre pills: `4px`
  - Avatars: `50%` (circle)
  - Modal: `14px`

---

## Components

### Nav Bar

- Full width, max-width matches page
- Sticky (`position: sticky; top: 0; z-index: 50`)
- Background: `--bg-deep` with slight transparency if desired
- Bottom border: `1px solid rgba(139,92,246,0.15)`
- Left: logo text. Right: nav links + user avatar
- Links: Home, Discover, My Reviews
- Logged out: show "Log in" link instead of avatar + "My Reviews"
- Active link gets `--purple-light` color

### Movie Card

- Background: `--bg-card`
- Border: `1px solid transparent`
- Hover: `transform: translateY(-3px)`, border becomes `rgba(139,92,246,0.25)`, add `box-shadow: 0 8px 24px rgba(0,0,0,0.3)`
- Poster area: `aspect-ratio: 2/3`, `--bg-surface` background. Display poster image as `object-fit: cover`. If no image, show a centered emoji or film icon placeholder.
- Rating badge: absolute positioned top-right of poster. `background: rgba(0,0,0,0.7)`, `backdrop-filter: blur(4px)`, `border-radius: 6px`, gold star + numeric rating.
- Info section: `padding: 10px 12px`. Title (single line, ellipsis overflow) + meta row (year + genre tag).
- Click opens the movie detail modal.

### Movie Detail Modal

- Triggered by clicking a card
- Overlay: `background: rgba(0,0,0,0.7)`, covers viewport, scrollable
- Modal container: `--bg-modal`, `border-radius: 14px`, `max-width: 620px`, `border: 1px solid rgba(139,92,246,0.12)`
- Close button: top-right `×`, `--text-muted`, hover `--text-primary`
- Layout:
  1. **Header** — flex row: poster (160px wide, rounded 8px) + info column (title, meta, rating, synopsis)
  2. **Review form section** — "Your review" heading + inline expansion form
  3. **Community reviews section** — list of review items
  4. **Recommendations section** (Advanced tier) — horizontal scroll of small movie cards labeled "You might also like"

### Review Form (Inline Expansion)

- Default state: a dashed-border box, `--purple-subtle` background, text "✎ Write a review...", centered. Cursor pointer.
- Clicked state: dashed box hides, form expands in-place:
  - Star input row: 5 clickable `★` characters. Default `--star-empty`. On click/hover, fill from left in `--star-filled`. Stars should also respond to hover preview (fill on hover, commit on click).
  - Textarea: `--bg-surface` background, `border: 1px solid rgba(139,92,246,0.1)`, focus border `--purple-accent`. Placeholder: "What did you think of this film?" Min-height 80px.
  - Action row: right-aligned. "Cancel" ghost button + "Post review" primary button.
- On cancel: collapse back to dashed-border prompt.

### Review Item

- Separated by `1px solid rgba(255,255,255,0.05)` bottom border
- Layout:
  - Header row: avatar circle (28px, colored background, white initials) + username (13px bold) + date (11px muted, right-aligned)
  - Star row: filled/empty stars for their rating
  - Text: review body, `--text-secondary`, `line-height: 1.55`
  - Actions row: upvote button (`▲ {count}`) + "Reply" link. `--text-muted`, hover `--purple-light`.

### Buttons

| Type | Background | Text | Border | Hover |
|---|---|---|---|---|
| Primary | `--purple-accent` | `white` | none | `--purple-dim` |
| Ghost | `transparent` | `--text-secondary` | none | text becomes `--text-primary` |
| Filter (inactive) | `--bg-card` | `--text-secondary` | `1px solid rgba(139,92,246,0.12)` | border `--purple-accent`, text `--text-primary` |
| Filter (active) | `--purple-subtle` | `--purple-light` | `1px solid --purple-accent` | — |

All buttons: `border-radius: 8px`, `padding: 7px 16px`, `font-size: 12px`, `font-weight: 600`.

### Search Bar

- `--bg-card` background
- `border: 1px solid rgba(139,92,246,0.12)`
- Focus: border becomes `--purple-accent`
- Placeholder color: `--text-muted`
- `border-radius: 8px`, `padding: 7px 14px`, `font-size: 12px`

### User Avatar

- Circle, 28px (nav/reviews) or 44px (profile page)
- Solid colored background (assign per-user from a set of colors: purple, blue, green, pink, teal)
- White initials, centered, 11px font-size (28px avatar) or 16px (44px avatar)

### Sort/Filter Controls

- Row of pill-shaped buttons above the movie grid
- Include: genre filter dropdown, sort toggle (top rated / newest / title)
- Active filter gets the "Filter (active)" button style
- Genre dropdown can be a simple `<select>` styled to match, or a custom dropdown with `--bg-card` background

### Login/Register Page

- Centered card, max-width 400px
- `--bg-card` background, `border-radius: 14px`, `padding: 32px`
- Tab toggle at top: "Log in" / "Sign up" — active tab underlined with `--purple-accent`
- Input fields match search bar styling but full-width
- Submit button: full-width primary button
- Error messages: `font-size: 12px`, `color: #F87171`

### Empty States

- Centered text, `--text-muted`, 13px
- Example: "No reviews yet — be the first to share your thoughts!"
- Can include a subtle icon or emoji above the text

### Loading States

- Skeleton cards: `--bg-surface` rectangles with subtle pulse animation
- Use `@keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.5 } }` on placeholder blocks
- Show skeleton grid while movies load, skeleton review items while reviews load

### Toast Notifications

- Fixed bottom-center (or bottom-right)
- `--bg-card` background, `border-left: 3px solid --purple-accent`
- `border-radius: 8px`, `padding: 12px 16px`
- Auto-dismiss after 3 seconds
- Use for: "Review posted", "Logged in", errors

---

## Responsive Breakpoints

| Breakpoint | Grid Columns | Modal Width | Notes |
|---|---|---|---|
| > 960px | 4–5 | 620px | Full layout |
| 600–960px | 3 | 90vw | Reduce spacing |
| < 600px | 2 | 95vw, full-height | Modal poster stacks above info. Nav collapses to hamburger or minimal. |

---

## Animations

Keep it minimal and purposeful:

- **Card hover lift:** `transition: transform 0.15s ease, box-shadow 0.15s ease`
- **Modal open:** fade in overlay + scale modal from 0.95 to 1.0 over 200ms
- **Review form expand:** `max-height` transition or simple toggle (no complex animation needed)
- **Star hover:** color transition `0.1s ease`
- **Skeleton pulse:** `animation: pulse 1.5s ease-in-out infinite`
- **Toast:** slide up from bottom, fade out on dismiss

No page transition animations. No parallax. No scroll-triggered effects.

---

## Accessibility Notes

- All interactive elements must be keyboard-navigable
- Star rating input should support arrow keys in addition to click
- Modal should trap focus while open, close on Escape key
- Sufficient contrast: all text/background combinations here meet WCAG AA
- Genre tags use color + text label (not color alone)
- Review form toggle should be a `<button>`, not a `<div>`

---

## File Reference

This design system maps to the file structure in AGENTS.md:

- `public/css/style.css` — all styles, using CSS custom properties from this doc
- `public/js/api.js` — no visual decisions here
- `public/js/movies.js` — renders card grid per card spec
- `public/js/movie-detail.js` — renders modal per modal spec
- `public/js/auth.js` — renders login/register per page spec
- `public/js/profile.js` — renders profile per avatar + review item specs
