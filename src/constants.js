// ── IPv4 ───────────────────────────────────────────────────────────────────
export const IPV4_BITS        = 32;
export const BITS_PER_OCTET   = 8;
export const IPV4_MAX         = 4294967295; // 0xFFFFFFFF — 255.255.255.255 as uint32

// ── Chart rendering ────────────────────────────────────────────────────────
export const MIN_BAR_PX       = 2;   // minimum bar width so sub-pixel CIDRs stay visible

// ── CIDR colour palette (Tableau-10) ──────────────────────────────────────
export const CIDR_COLORS = [
  '#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f',
  '#edc948', '#b07aa1', '#ff9da7', '#9c755f', '#bab0ac',
];

// ── Layout — initial pane sizes as viewport fractions ─────────────────────
export const LAYOUT = {
  HEADER_HEIGHT_PX:   64,    // approximate header height subtracted from usable vh

  SIDEBAR_INIT_VW:    0.22,  // sidebar starting width
  SIDEBAR_MIN_VW:     0.10,  // drag minimum
  SIDEBAR_MAX_VW:     0.40,  // drag maximum

  GANTT_INIT_VH:      0.65,  // gantt chart starting height
  GANTT_MIN_VH:       0.15,
  GANTT_MAX_VH:       0.85,

  LIST_INIT_VH:       0.54,  // CIDR list starting height inside sidebar
  LIST_MIN_VH:        0.05,
};

// ── Theme colours (consumed by the D3 Gantt chart) ────────────────────────
export const GANTT_THEME = {
  dark: {
    chartBg:   '#0a1628',
    axisText:  '#6b7280',
    axisLine:  '#374151',
    emptyHint: '#445566',
  },
  light: {
    chartBg:   '#f0f9ff',
    axisText:  '#1e293b',
    axisLine:  '#60a5fa',
    emptyHint: '#64748b',
  },
};
