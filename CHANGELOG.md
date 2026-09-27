# Changelog

## 2026-05-05 - Mobile Portrait Vertical Scroll

> **Superseded.** Entri ini mendokumentasikan layout *horizontal scroll* yang
> dihapus seluruhnya pada v3 (lihat `THEMES_CHANGELOG.md`). Tidak ada lagi
> `flex-direction: row` di body, `width: 100vw` per section, maupun handler
> horizontal wheel di `main.js`. Dipertahankan hanya sebagai catatan sejarah.
> Untuk daftar perubahan yang masih berlaku, baca `THEMES_CHANGELOG.md` (v4)
> dan `REDESIGN.md`.

### Changes Made

#### CSS (style.css)
- Modified `@media (max-width: 768px)` to support vertical scrolling
  - Changed `body` from `flex-direction: row` to `column`
  - Enabled `overflow-y: auto` on html and body
  - Changed sections from `min-width: 100vw` to support auto height
  - Replaced left borders with top borders between sections
  - Made footer relative positioned for mobile

- Added `@media (max-width: 768px) and (orientation: portrait)`
  - Forces vertical scroll layout
  - Adjusts footer to full width at bottom
  - Centers footer content

- Added `@media (max-width: 768px) and (orientation: landscape)`
  - Keeps horizontal scroll on landscape mobile
  - Maintains desktop-like experience

#### JavaScript (main.js)
- Added `isDesktop()` function to detect viewport size and orientation
- Modified horizontal scroll wheel event to only work on desktop (width > 768px and landscape)
- Updated navigation click handler to support both:
  - Horizontal scroll for desktop
  - Vertical scroll for mobile/portrait
- Added resize and orientation change handlers to reset scroll position

### Result
- Desktop/Landscape: Horizontal scroll (unchanged)
- Mobile Portrait: Vertical scroll (new behavior)
- Smooth transition between orientations
