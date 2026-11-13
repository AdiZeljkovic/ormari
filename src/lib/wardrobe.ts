/**
 * Domain model for the built-in wardrobe.
 *
 * Every dimension and rate below comes from the client's product library
 * (16 type drawings, "Ormari" section). Values marked ASSUMPTION are ours and
 * must be confirmed by the client before anything goes public.
 */

export const DIM = {
  /** Niche height, floor to ceiling (mm). Fixed on all drawings. */
  H: 2400,
  /** Niche depth, back wall to front (mm). Fixed on all drawings. */
  D: 600,
  carcassD: 580,
  doorH: 2200,
  plinth: 100,
  /** Top band closing the gap between doors and ceiling: H - plinth - doorH. */
  bandeau: 100,
  panel: 18,
  shelfD: 524,
  knobH: 1050,
  /** Filler strip against a wall. Drawings: niche - carcass = 80 for two fillers. */
  filler: 40,
  /** Technical cabinets with 2+ doors are drawn 40 mm narrower (869 vs 909 …). */
  techExtra: 40,
  /** Reveal between doors. Drawings: carcass = n × door + 3 × (n + 1). */
  gap: 3,
  /** ASSUMPTION: free niche width range offered online. Drawings cover 514–1896. */
  minW: 480,
  maxW: 2000,
  /** ASSUMPTION: acceptable door leaf width. Drawings use 430–450. */
  minDoor: 300,
  maxDoor: 600,
} as const;

export type Kind = 'simple' | 'tech';
export type Fit = 'fillers' | 'visible';
export type Side = 'left' | 'right';
export type Finish = 'mel' | 'hpl' | 'mdf';
export type Handle = 'knob' | 'bar';
export type Bay = 'hang' | 'shelves';
export type Locale = 'fr' | 'bs';

export interface Decor {
  id: string;
  group: Finish;
  code: string;
  name: Record<Locale, string>;
  hex: string;
  wood?: boolean;
}

/** Decor list as offered in the client's 3D view. Colours are screen approximations. */
export const DECORS: Decor[] = [
  { id: 'w980', group: 'mel', code: 'W980 ST7', name: { fr: 'Blanc Platine', bs: 'Platinasto bijela' }, hex: '#f1f0ec' },
  { id: 'w960', group: 'mel', code: 'W960 ST7', name: { fr: 'Blanc Classique', bs: 'Klasična bijela' }, hex: '#f4f3ef' },
  { id: 'w1000', group: 'mel', code: 'W1000 ST9', name: { fr: 'Blanc Premium', bs: 'Premium bijela' }, hex: '#f7f7f5' },
  { id: 'u702', group: 'mel', code: 'U702 ST9', name: { fr: 'Gris Cachemire', bs: 'Kašmir siva' }, hex: '#bfb7ab' },
  { id: 'u727', group: 'mel', code: 'U727 ST9', name: { fr: 'Gris Pierre', bs: 'Kamen siva' }, hex: '#8e8a83' },
  { id: 'u960', group: 'mel', code: 'U960 ST9', name: { fr: 'Gris Onyx', bs: 'Oniks siva' }, hex: '#4d4f51' },
  { id: 'u999', group: 'mel', code: 'U999 ST2', name: { fr: 'Noir', bs: 'Crna' }, hex: '#222224' },
  { id: 'h1145', group: 'mel', code: 'H1145 ST10', name: { fr: 'Chêne Bardolino naturel', bs: 'Hrast Bardolino natur' }, hex: '#c19a6b', wood: true },
  { id: 'h3303', group: 'mel', code: 'H3303 ST10', name: { fr: 'Chêne Hamilton naturel', bs: 'Hrast Hamilton natur' }, hex: '#b88f62', wood: true },
  { id: 'h3176', group: 'mel', code: 'H3176 ST37', name: { fr: 'Chêne Halifax étain', bs: 'Hrast Halifax kalaj' }, hex: '#7d6e5e', wood: true },
  { id: 'hpl-w', group: 'hpl', code: 'HPL', name: { fr: 'Blanc', bs: 'Bijeli' }, hex: '#f5f5f3' },
  { id: 'hpl-g', group: 'hpl', code: 'HPL', name: { fr: 'Gris clair', bs: 'Svijetlo sivi' }, hex: '#d9d9d6' },
  { id: 'hpl-a', group: 'hpl', code: 'HPL', name: { fr: 'Anthracite', bs: 'Antracit' }, hex: '#3f4245' },
  { id: 'hpl-o', group: 'hpl', code: 'HPL', name: { fr: 'Décor chêne', bs: 'Hrast dekor' }, hex: '#bf9a6c', wood: true },
  { id: 'r9016', group: 'mdf', code: 'RAL 9016', name: { fr: 'Blanc signalisation', bs: 'Prometno bijela' }, hex: '#f6f6f6' },
  { id: 'r9010', group: 'mdf', code: 'RAL 9010', name: { fr: 'Blanc pur', bs: 'Čisto bijela' }, hex: '#f3f0e6' },
  { id: 'r7035', group: 'mdf', code: 'RAL 7035', name: { fr: 'Gris clair', bs: 'Svijetlo siva' }, hex: '#cbd0cc' },
  { id: 'n0500', group: 'mdf', code: 'NCS S 0500-N', name: { fr: 'Blanc neutre', bs: 'Neutralno bijela' }, hex: '#f3f3f1' },
  { id: 'r7016', group: 'mdf', code: 'RAL 7016', name: { fr: 'Gris anthracite', bs: 'Antracit' }, hex: '#383e42' },
  { id: 'r5014', group: 'mdf', code: 'RAL 5014', name: { fr: 'Bleu pigeon', bs: 'Golub plava' }, hex: '#6c7c98' },
];

export const decor = (id: string): Decor => DECORS.find((d) => d.id === id) ?? DECORS[0];
export const CARCASS_DECORS = DECORS.filter((d) => d.group === 'mel');

/**
 * Rates in CHF per metre of niche width, installation included.
 * Source: client's internal calculation. The client's own document warns that
 * it is not confirmed whether margin is included — treat as indicative.
 */
export const RATES: Record<Fit, Record<Finish, number>> = {
  fillers: { mel: 494.19, hpl: 782.65, mdf: 782.65 },
  visible: { mel: 442.68, hpl: 695.08, mdf: 700.23 },
};
/** Surcharge for the technical access hatch, CHF per metre of niche width. */
export const TECH_RATE = 120;

export interface Config {
  width: number;
  kind: Kind;
  fit: Fit;
  /** Which side is the visible (clad) one when fit === 'visible'. */
  side: Side;
  front: string;
  carcass: string;
  handle: Handle;
  /** 0 = let the rules pick the door count. */
  doors: number;
  bays: Bay[];
}

export const DEFAULT_CONFIG: Config = {
  width: 989,
  kind: 'simple',
  fit: 'fillers',
  side: 'right',
  front: 'w980',
  carcass: 'w960',
  handle: 'knob',
  doors: 0,
  bays: [],
};

/** Niche widths of the 16 type drawings, by fit, for 1–4 doors. */
export const STANDARD_WIDTHS: Record<Fit, number[]> = {
  fillers: [536, 989, 1442, 1896],
  visible: [514, 967, 1420, 1874],
};

export interface Layout {
  width: number;
  n: number;
  doorW: number;
  carcassW: number;
  /** Clearance taken on each side of the carcass (filler strip or visible panel). */
  left: number;
  right: number;
  fillerL: number;
  fillerR: number;
  visible: Side | null;
  bays: Bay[];
  validDoors: number[];
  hingeLeft: boolean[];
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

function sides(kind: Kind, fit: Fit, side: Side, n: number) {
  const extra = kind === 'tech' && n >= 2 ? DIM.techExtra : 0;
  if (fit === 'fillers') return { left: DIM.filler + extra, right: DIM.filler, fillerL: DIM.filler + extra, fillerR: DIM.filler };
  return side === 'right'
    ? { left: DIM.filler + extra, right: DIM.panel, fillerL: DIM.filler + extra, fillerR: 0 }
    : { left: DIM.panel, right: DIM.filler + extra, fillerL: 0, fillerR: DIM.filler + extra };
}

function doorWidth(carcassW: number, n: number) {
  return Math.floor((carcassW - DIM.gap * (n + 1)) / n);
}

function defaultBays(n: number): Bay[] {
  if (n === 1) return ['shelves'];
  if (n === 2) return ['hang', 'shelves'];
  if (n === 3) return ['hang', 'hang', 'shelves'];
  return ['hang', 'hang', 'shelves', 'shelves'];
}

export function computeLayout(cfg: Config): Layout {
  const width = clamp(Math.round(cfg.width), DIM.minW, DIM.maxW);
  const candidates = [1, 2, 3, 4].map((n) => {
    const s = sides(cfg.kind, cfg.fit, cfg.side, n);
    const carcassW = width - s.left - s.right;
    return { n, s, carcassW, doorW: doorWidth(carcassW, n) };
  });
  const valid = candidates.filter((c) => c.doorW >= DIM.minDoor && c.doorW <= DIM.maxDoor);
  const pool = valid.length ? valid : candidates;
  // The drawings use doors of about 450 mm; pick the count that lands closest.
  const auto = pool.reduce((best, c) => (Math.abs(c.doorW - 450) < Math.abs(best.doorW - 450) ? c : best));
  const pick = pool.find((c) => c.n === cfg.doors) ?? auto;
  const base = defaultBays(pick.n);
  return {
    width,
    n: pick.n,
    doorW: pick.doorW,
    carcassW: pick.carcassW,
    left: pick.s.left,
    right: pick.s.right,
    fillerL: pick.s.fillerL,
    fillerR: pick.s.fillerR,
    visible: cfg.fit === 'visible' ? cfg.side : null,
    bays: base.map((b, i) => cfg.bays[i] ?? b),
    validDoors: pool.map((c) => c.n),
    hingeLeft: Array.from({ length: pick.n }, (_, i) => i % 2 === 0),
  };
}

export interface Price {
  metres: number;
  rate: number;
  base: number;
  tech: number;
  total: number;
}

export function computePrice(cfg: Config): Price {
  const metres = clamp(Math.round(cfg.width), DIM.minW, DIM.maxW) / 1000;
  const rate = RATES[cfg.fit][decor(cfg.front).group];
  const base = rate * metres;
  const tech = cfg.kind === 'tech' ? TECH_RATE * metres : 0;
  return { metres, rate, base, tech, total: base + tech };
}

/** Swiss notation: CHF 1'483.90 */
export function chf(v: number, withCurrency = true) {
  const [int, dec] = v.toFixed(2).split('.');
  const s = `${int.replace(/\B(?=(\d{3})+(?!\d))/g, '’')}.${dec}`;
  return withCurrency ? `CHF ${s}` : s;
}

/* ---------- URL state (shareable link, no account needed) ---------- */

export function toQuery(cfg: Config): string {
  const p = new URLSearchParams();
  p.set('l', String(cfg.width));
  p.set('t', cfg.kind === 'tech' ? 't' : 's');
  p.set('p', cfg.fit === 'visible' ? (cfg.side === 'left' ? 'vl' : 'vr') : 'f');
  p.set('f', cfg.front);
  p.set('c', cfg.carcass);
  p.set('h', cfg.handle === 'bar' ? 'b' : 'k');
  if (cfg.doors) p.set('n', String(cfg.doors));
  if (cfg.bays.length) p.set('i', cfg.bays.map((b) => (b === 'hang' ? 'h' : 's')).join(''));
  return p.toString();
}

type Raw = Record<string, string | string[] | undefined>;

export function fromQuery(q: Raw): Config {
  const get = (k: string) => (Array.isArray(q[k]) ? q[k]?.[0] : q[k]) as string | undefined;
  const cfg: Config = { ...DEFAULT_CONFIG, bays: [] };
  const l = Number(get('l'));
  if (Number.isFinite(l) && l > 0) cfg.width = clamp(Math.round(l), DIM.minW, DIM.maxW);
  if (get('t') === 't') cfg.kind = 'tech';
  const p = get('p');
  if (p === 'vl' || p === 'vr') {
    cfg.fit = 'visible';
    cfg.side = p === 'vl' ? 'left' : 'right';
  }
  const f = get('f');
  if (f && DECORS.some((d) => d.id === f)) cfg.front = f;
  const c = get('c');
  if (c && CARCASS_DECORS.some((d) => d.id === c)) cfg.carcass = c;
  if (get('h') === 'b') cfg.handle = 'bar';
  const n = Number(get('n'));
  if ([1, 2, 3, 4].includes(n)) cfg.doors = n;
  const i = get('i');
  if (i && /^[hs]{1,4}$/.test(i)) cfg.bays = i.split('').map((ch) => (ch === 'h' ? 'hang' : 'shelves'));
  return cfg;
}
