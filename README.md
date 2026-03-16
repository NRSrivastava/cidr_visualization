# CIDR Lens

**IPv4 CIDR Calculator & Visualizer**

> Visualize, calculate, and communicate network blocks — all in one place.

CIDR Lens is a browser-based tool for network administrators and security professionals who need to think clearly about IP address space. Add one or more CIDR blocks, see them plotted side-by-side on a shared IPv4 number line, inspect their binary structure, and read off all subnet math at a glance — no backend, no install, just open and go.

**Live:** [cidr.neelesh.dev](https://cidr.neelesh.dev)

---

## Features

### Multi-CIDR Visualization
- Plot multiple CIDR blocks simultaneously on a shared IPv4 address space (`0.0.0.0` → `255.255.255.255`)
- Each block is color-coded using a 10-color Tableau palette — immediately distinguishable at a glance
- **Zoom** with the mouse wheel, **pan** horizontally with trackpad swipe or `Shift`+scroll
- **Fit All** button auto-scales the view to frame all added blocks with breathing room
- Bars that shrink below 2 px at the current zoom level are kept visible — no block ever disappears

### CIDR Calculator Panel
For any selected block, the panel instantly shows:

| Field | Description |
|---|---|
| CIDR Base IP | Network address |
| Broadcast IP | Last address in the block |
| Netmask | Subnet mask in dotted-decimal |
| Wildcard Mask | Inverse of the subnet mask |
| First Usable IP | First host address |
| Last Usable IP | Last host address |
| Count | Total IP addresses in the block |
| Usable IPs | Host addresses (excluding network & broadcast) |
| Prefix | CIDR prefix length |

### Binary Representation
- Displays the network address and subnet mask in binary, grouped by octet
- Network bits highlighted in the block's assigned color; host bits shown in a neutral tone
- A span bar shows the network-to-host bit ratio proportionally
- Legend shows exact network and host bit counts

### Resizable Layout
Every pane boundary is a drag handle — resize to match your workflow:

| Divider | Controls |
|---|---|
| Vertical | Sidebar width vs. chart area width |
| Horizontal (chart area) | Chart height vs. binary view height |
| Horizontal (sidebar) | CIDR list height vs. calculator panel height |

All initial proportions are computed from the viewport so the layout looks right at any screen resolution.

### Dark & Light Mode
- **Dark mode** (default) — deep navy, optimized for terminal-heavy workflows
- **Light mode** — vibrant sky blue, inspired by [cidr.xyz](https://cidr.xyz)
- Toggle in the top-right corner; theme applies consistently across all components

---

## Getting Started

### Prerequisites
- Node.js ≥ 16
- npm ≥ 8

### Run locally

```bash
git clone https://github.com/your-username/cidr_visualization.git
cd cidr_visualization
npm install
npm start
```

Opens at [http://localhost:3000](http://localhost:3000).

### Build for production

```bash
npm run build
```

Outputs a static bundle to `build/` — ready for any static host (GitHub Pages, Netlify, Vercel, S3, etc.).

---

## Usage

1. **Add a CIDR** — type a block like `192.168.1.0/24` into the input and press **Add** or hit `Enter`
2. **Select a CIDR** — click any entry in the list to load its details into the calculator and binary view
3. **Explore the chart** — scroll to zoom in/out; `Shift`+scroll or trackpad-swipe to pan left/right
4. **Fit All** — press the button to auto-zoom and show all blocks at once
5. **Resize panes** — hover over any divider line until the cursor changes, then drag
6. **Remove a CIDR** — click the ✕ next to any entry in the list

---

## Tech Stack

| Layer | Technology |
|---|--|
| UI framework | React 18 |
| Visualization | D3.js v7 |
| Styling | CSS custom properties — no CSS-in-JS |
| Build | Create React App (Webpack) |

---

## Project Structure

```
src/
├── constants.js     # Single source of truth for all magic numbers
├── helpers.js       # Pure IPv4/CIDR math — no side effects
├── App.js           # Root component — layout, state, drag dividers
├── App.css          # All UI styles with CSS variable theming
├── Gantt.js         # D3 chart — zoom, pan, bar rendering, axes
├── Gantt.css        # Chart font styles
├── BinaryView.js    # Binary representation component
└── BinaryView.css   # Bit cell and span bar styles
```

### `constants.js` at a glance

```js
IPV4_MAX         = 4294967295   // 255.255.255.255 as uint32
MIN_BAR_PX       = 2            // minimum visible bar width in the chart
SVG_OVERFLOW_PAD = 15           // wrapper padding to prevent axis label clipping

LAYOUT.SIDEBAR_INIT_VW = 0.22   // sidebar starts at 22% of viewport width
LAYOUT.GANTT_INIT_VH   = 0.65   // chart starts at 65% of usable viewport height

CIDR_COLORS = [ /* 10-color Tableau palette */ ]
GANTT_THEME = { dark: { ... }, light: { ... } }
```

---

## Implementation Notes

**Crisp bars at all zoom levels** — bar positions are updated by recomputing `x` and `width` SVG attributes via `transform.rescaleX(xScale)` on every zoom event. Using a group `scale()` transform causes rasterization blur at non-integer zoom levels; the attribute approach keeps every bar pixel-perfect.

**IPv4 as uint32** — all CIDR arithmetic uses JavaScript's `>>> 0` unsigned right shift to keep 32-bit numbers in the positive range. The `/0` case (full address space) is special-cased because `~0 << 32` wraps silently in JS.

**Horizontal scroll** — D3's built-in `wheel.zoom` only reads `deltaY`. A separate `wheel.pan` handler intercepts trackpad horizontal swipes (`|deltaX| > |deltaY|`) and `Shift`+vertical scroll for mouse users, translating them into D3 zoom transform updates.

**Viewport-relative proportions** — pane sizes are initialised from `window.innerWidth` / `window.innerHeight` fractions at component mount so the layout scales correctly across screen resolutions. Every fraction lives in `constants.js`.

---

## Browser Support

Works in all modern evergreen browsers (Chrome, Firefox, Edge, Safari). JavaScript must be enabled. Designed for desktop — not optimised for touch/mobile.

---

## License

[Apache 2.0](./LICENSE)

---

*Built for network engineers who think in blocks.*
