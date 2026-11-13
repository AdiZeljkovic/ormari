'use client';

import * as THREE from 'three';
import { createContext, useContext, useEffect, useMemo, useRef, type MutableRefObject, type ReactNode } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { DIM, decor, type Config, type Layout } from '@/lib/wardrobe';
import { boxGeometry, decorMaterial } from './materials';

const mm = (v: number) => v / 1000;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/** 0 → empty niche, 1 → finished wardrobe. Absent = always finished. */
export const AssemblyContext = createContext<MutableRefObject<number> | null>(null);

/** Doors never swing past this, so neighbours hinged on the same partition cannot meet. */
const MAX_OPEN = 1.52;

type V3 = [number, number, number];

function Appear({ at, from = [0, 0, 1.3], children }: { at: [number, number]; from?: V3; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  const asm = useContext(AssemblyContext);
  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    const t = asm ? clamp01((asm.current - at[0]) / (at[1] - at[0])) : 1;
    g.visible = t > 0;
    const e = 1 - easeOut(t);
    g.position.set(from[0] * e, from[1] * e, from[2] * e);
  });
  return <group ref={ref}>{children}</group>;
}

function Panel({ s, p, m, shadow = true }: { s: V3; p: V3; m: THREE.Material; shadow?: boolean }) {
  const [w, h, d] = s;
  const geo = useMemo(() => boxGeometry(w, h, d), [w, h, d]);
  useEffect(() => () => geo.dispose(), [geo]);
  return <mesh geometry={geo} material={m} position={p} castShadow={shadow} receiveShadow />;
}

const shared = {
  knob: null as THREE.CylinderGeometry | null,
  bar: null as THREE.CylinderGeometry | null,
  post: null as THREE.CylinderGeometry | null,
  cup: null as THREE.CylinderGeometry | null,
  arm: null as THREE.BoxGeometry | null,
};
function geo() {
  if (!shared.knob) {
    shared.knob = new THREE.CylinderGeometry(0.01, 0.0105, 0.025, 28);
    shared.bar = new THREE.CylinderGeometry(0.006, 0.006, 0.17, 20);
    shared.post = new THREE.CylinderGeometry(0.005, 0.005, 0.03, 14);
    shared.cup = new THREE.CylinderGeometry(0.0175, 0.0175, 0.012, 24);
    shared.arm = new THREE.BoxGeometry(0.052, 0.034, 0.014);
  }
  return shared as { [K in keyof typeof shared]: NonNullable<(typeof shared)[K]> };
}

const HINGE_Y = [0.1, 0.6, 1.1, 1.6, 2.1];

function Door(props: {
  index: number;
  hingeX: number;
  width: number;
  left: boolean;
  open: boolean;
  material: THREE.Material;
  metal: THREE.Material;
  hinge: THREE.Material;
  handle: Config['handle'];
  onToggle?: (i: number) => void;
  angles: MutableRefObject<number[]>;
}) {
  const { index, hingeX, width, left, open, material, metal, hinge, handle, onToggle } = props;
  const pivot = useRef<THREE.Group>(null);
  const angle = useRef(0);
  const asm = useContext(AssemblyContext);
  const t = mm(DIM.panel);
  const h = mm(DIM.doorH) - 0.004;
  const dir = left ? 1 : -1;
  const g = geo();

  useFrame((_, dt) => {
    const p = pivot.current;
    if (!p) return;
    if (asm) {
      // Scrubbed by scroll: doors arrive open, then close one after another.
      const k = clamp01((asm.current - 0.82 - index * 0.03) / 0.13);
      angle.current = (1 - easeOut(k)) * MAX_OPEN;
    } else {
      const target = open ? MAX_OPEN : 0;
      const a = angle.current;
      // Soft-close: the last few degrees are slow, like a damped hinge.
      const rate = target > a ? 6.5 : a > 0.32 ? 6 : 2.3;
      angle.current = a + (target - a) * (1 - Math.exp(-rate * Math.min(dt, 0.05)));
    }
    props.angles.current[index] = angle.current;
    p.rotation.y = -dir * angle.current;
  });

  const click = onToggle
    ? (e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onToggle(index);
      }
    : undefined;
  const hover = onToggle
    ? (e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }
    : undefined;
  const out = onToggle ? () => (document.body.style.cursor = '') : undefined;
  const knobY = mm(DIM.knobH) - mm(DIM.plinth) - 0.002;

  return (
    <group ref={pivot} position={[hingeX, mm(DIM.plinth) + 0.002, mm(DIM.carcassD) + t]}>
      <group onClick={click} onPointerOver={hover} onPointerOut={out}>
        <Panel s={[width, h, t]} p={[(dir * width) / 2, h / 2, -t / 2]} m={material} />
        {handle === 'knob' ? (
          <mesh geometry={g.knob} material={metal} position={[dir * (width - 0.05), knobY, 0.0125]} rotation={[Math.PI / 2, 0, 0]} castShadow />
        ) : (
          <group position={[dir * (width - 0.05), knobY, 0]}>
            <mesh geometry={g.bar} material={metal} position={[0, 0, 0.032]} castShadow />
            <mesh geometry={g.post} material={metal} position={[0, 0.064, 0.015]} rotation={[Math.PI / 2, 0, 0]} />
            <mesh geometry={g.post} material={metal} position={[0, -0.064, 0.015]} rotation={[Math.PI / 2, 0, 0]} />
          </group>
        )}
      </group>
      {HINGE_Y.map((y) => (
        <group key={y} position={[dir * 0.024, y, -t]}>
          <mesh geometry={g.cup} material={hinge} position={[0, 0, -0.004]} rotation={[Math.PI / 2, 0, 0]} />
          <mesh geometry={g.arm} material={hinge} position={[-dir * 0.012, 0, -0.012]} />
        </group>
      ))}
    </group>
  );
}

const FABRICS = ['#e9e3d7', '#d2c9b9', '#aaa396', '#6e6961', '#38414b', '#7c5e48', '#b6a68a', '#f2efe9'];
const SHELF_Y = [0.45, 0.8, 1.15, 1.5, 1.85];

/** Clothes on the rails and folded stacks on the shelves, for still renders only. */
function Contents({ layout, x0, bw, tech }: { layout: Layout; x0: number; bw: number; tech: boolean }) {
  const mats = useMemo(() => FABRICS.map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 1 })), []);
  const items = useMemo(() => {
    let seed = 20261113;
    const r = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const pick = () => Math.floor(r() * mats.length);
    const out: { s: V3; p: V3; m: number; ry: number }[] = [];
    layout.bays.forEach((bay, i) => {
      const xc = x0 + (i + 0.5) * bw;
      const iw = bw - 0.045;
      if (bay === 'hang') {
        const n = Math.max(4, Math.floor(iw / 0.044));
        for (let k = 0; k < n; k++) {
          if (r() < 0.1) continue;
          const h = 0.74 + r() * 0.34;
          out.push({ s: [0.02 + r() * 0.016, h, 0.4 + r() * 0.06], p: [xc - iw / 2 + 0.03 + (k + 0.5) * ((iw - 0.06) / n), 1.845 - h / 2, 0.29], m: pick(), ry: (r() - 0.5) * 0.07 });
        }
        if (!(tech && i === 0)) out.push({ s: [Math.min(0.34, iw - 0.07), 0.2, 0.36], p: [xc - 0.015, 0.118 + 0.1, 0.3], m: 1, ry: 0.06 });
        return;
      }
      SHELF_Y.forEach((y) => {
        if (tech && i === 0 && y < 1.1) return;
        const top = 0.1 + y + 0.009;
        for (const side of [-1, 1]) {
          if (r() < 0.2) continue;
          const cx = xc + side * iw * 0.235;
          if (r() < 0.24) {
            out.push({ s: [0.17, 0.19, 0.33], p: [cx, top + 0.095, 0.3], m: r() < 0.5 ? 0 : 6, ry: 0 });
            continue;
          }
          const count = 2 + Math.floor(r() * 4);
          for (let c = 0; c < count; c++) out.push({ s: [0.165 + r() * 0.02, 0.034, 0.31], p: [cx + (r() - 0.5) * 0.012, top + 0.017 + c * 0.035, 0.3 + (r() - 0.5) * 0.016], m: pick(), ry: (r() - 0.5) * 0.05 });
        }
      });
    });
    return out;
  }, [layout.bays, x0, bw, tech, mats.length]);
  return (
    <group>
      {items.map((it, k) => (
        <mesh key={k} position={it.p} rotation={[0, it.ry, 0]} material={mats[it.m]} castShadow receiveShadow>
          <boxGeometry args={it.s} />
        </mesh>
      ))}
    </group>
  );
}

export function Wardrobe({
  config,
  layout,
  open,
  onToggleDoor,
  styled = false,
}: {
  config: Config;
  layout: Layout;
  open: boolean[];
  onToggleDoor?: (i: number) => void;
  styled?: boolean;
}) {
  const front = decorMaterial(decor(config.front));
  const inside = decorMaterial(decor(config.carcass));
  const mats = useMemo(
    () => ({
      // Satin nickel: the scene's environment is dim, so reflections are lifted for metal only.
      metal: new THREE.MeshStandardMaterial({ color: '#dcdad5', metalness: 0.7, roughness: 0.3, envMapIntensity: 2.4 }),
      hinge: new THREE.MeshStandardMaterial({ color: '#a4a8ab', metalness: 0.8, roughness: 0.38 }),
      hatchFrame: new THREE.MeshStandardMaterial({ color: '#7d8388', roughness: 0.6 }),
      hatch: new THREE.MeshStandardMaterial({ color: '#dfe1e3', roughness: 0.55 }),
    }),
    [],
  );
  const rod = useMemo(() => new THREE.CylinderGeometry(0.0125, 0.0125, 1, 24), []);
  // A closed cabinet is dark inside. Scene lights do not know that, so while every door is shut
  // a matt backing sits right behind the fronts and the reveals between doors read as shadow.
  const dark = useMemo(() => new THREE.MeshBasicMaterial({ color: '#14110e' }), []);
  const angles = useRef<number[]>([]);
  const backing = useRef<THREE.Mesh>(null);
  const asm = useContext(AssemblyContext);
  useFrame(() => {
    if (!backing.current) return;
    let max = 0;
    for (let i = 0; i < layout.n; i++) max = Math.max(max, angles.current[i] ?? 0);
    backing.current.visible = max < 0.01 && (!asm || asm.current > 0.985);
  });

  const W = mm(layout.width);
  const H = mm(DIM.H);
  const t = mm(DIM.panel);
  const cd = mm(DIM.carcassD);
  const pl = mm(DIM.plinth);
  const dh = mm(DIM.doorH);
  const sd = mm(DIM.shelfD);
  const cw = mm(layout.carcassW);
  const x0 = -W / 2 + mm(layout.left);
  const cx = x0 + cw / 2;
  const bw = cw / layout.n;
  const dw = mm(layout.doorW);
  const zc = cd / 2;
  const zf = cd + t / 2;
  const tech = config.kind === 'tech';
  const band = H - pl - dh;
  const vis = layout.visible;
  const bandW = W - (vis ? t : 0);
  const bandX = vis === 'right' ? -t / 2 : vis === 'left' ? t / 2 : 0;

  return (
    <group>
      {/* carcass */}
      <Appear at={[0.0, 0.16]} from={[0, 0, 1.0]}>
        <Panel s={[cw - 2 * t, dh - 2 * t, 0.008]} p={[cx, pl + dh / 2, 0.004]} m={inside} shadow={false} />
      </Appear>
      <Appear at={[0.05, 0.22]}>
        <Panel s={[t, dh, cd]} p={[x0 + t / 2, pl + dh / 2, zc]} m={inside} />
      </Appear>
      <Appear at={[0.09, 0.26]}>
        <Panel s={[t, dh, cd]} p={[x0 + cw - t / 2, pl + dh / 2, zc]} m={inside} />
      </Appear>
      <Appear at={[0.13, 0.3]}>
        <Panel s={[cw - 2 * t, t, cd]} p={[cx, pl + t / 2, zc]} m={inside} />
      </Appear>
      <Appear at={[0.17, 0.34]}>
        <Panel s={[cw - 2 * t, t, cd]} p={[cx, pl + dh - t / 2, zc]} m={inside} />
      </Appear>
      {vis && (
        <Appear at={[0.1, 0.3]}>
          <Panel s={[t, H, cd + t]} p={[(vis === 'right' ? 1 : -1) * (W / 2 - t / 2), H / 2, (cd + t) / 2]} m={front} />
        </Appear>
      )}
      {Array.from({ length: layout.n - 1 }, (_, k) => (
        <Appear key={`part-${k}`} at={[0.26 + k * 0.03, 0.42 + k * 0.03]}>
          <Panel s={[t, dh - 2 * t, cd - 0.02]} p={[x0 + (k + 1) * bw, pl + dh / 2, (cd - 0.02) / 2]} m={inside} />
        </Appear>
      ))}

      {/* technical access hatch on the back, first bay */}
      {tech &&
        (() => {
          const tw = Math.min(0.5, bw - t - 0.1);
          const th = 0.76;
          const hx = x0 + t + 0.05 + tw / 2;
          const hy = pl + 0.15 + th / 2;
          return (
            <Appear at={[0.28, 0.42]} from={[0, 0, 0.8]}>
              <Panel s={[tw + 0.04, th + 0.04, 0.01]} p={[hx, hy, 0.013]} m={mats.hatchFrame} shadow={false} />
              <Panel s={[tw, th, 0.012]} p={[hx, hy, 0.02]} m={mats.hatch} shadow={false} />
            </Appear>
          );
        })()}

      {/* interior, bay by bay */}
      {layout.bays.map((bay, i) => {
        const xc = x0 + (i + 0.5) * bw;
        const iw = bw - t - 0.002;
        const zs = 0.008 + sd / 2;
        const base = 0.4 + i * 0.025;
        if (bay === 'hang') {
          return (
            <group key={`bay-${i}`}>
              <Appear at={[base, base + 0.14]} from={[0, 0, 1.0]}>
                <Panel s={[iw, t, sd]} p={[xc, 1.95, zs]} m={inside} />
              </Appear>
              <Appear at={[base + 0.05, base + 0.19]} from={[0, 0, 1.0]}>
                <mesh geometry={rod} material={mats.metal} position={[xc, 1.87, 0.29]} rotation={[0, 0, Math.PI / 2]} scale={[1, iw, 1]} castShadow />
              </Appear>
            </group>
          );
        }
        // In a technical cabinet the hatch zone of the first bay stays free.
        const ys = [0.45, 0.8, 1.15, 1.5, 1.85].filter((y) => !(tech && i === 0 && y < 1.1));
        return (
          <group key={`bay-${i}`}>
            {ys.map((y, k) => (
              <Appear key={y} at={[base + k * 0.022, base + k * 0.022 + 0.14]} from={[0, 0, 1.0]}>
                <Panel s={[iw, t, sd]} p={[xc, pl + y, zs]} m={inside} />
              </Appear>
            ))}
          </group>
        );
      })}

      {styled && <Contents layout={layout} x0={x0} bw={bw} tech={tech} />}

      {/* plinth, fillers, top band */}
      <Appear at={[0.58, 0.7]} from={[0, 0, 0.6]}>
        <Panel s={[cw, pl - 0.004, t]} p={[cx, pl / 2, cd - 0.05]} m={front} />
      </Appear>
      {layout.fillerL > 0 && (
        <Appear at={[0.6, 0.72]} from={[0, 0, 0.6]}>
          <Panel s={[mm(layout.fillerL) - 0.002, pl + dh, t]} p={[-W / 2 + mm(layout.fillerL) / 2, (pl + dh) / 2, zf]} m={front} />
        </Appear>
      )}
      {layout.fillerR > 0 && (
        <Appear at={[0.62, 0.74]} from={[0, 0, 0.6]}>
          <Panel s={[mm(layout.fillerR) - 0.002, pl + dh, t]} p={[W / 2 - mm(layout.fillerR) / 2, (pl + dh) / 2, zf]} m={front} />
        </Appear>
      )}
      <Appear at={[0.64, 0.76]} from={[0, 0, 0.6]}>
        <Panel s={[bandW, band - 0.003, t]} p={[bandX, pl + dh + band / 2, zf]} m={front} />
      </Appear>

      <mesh ref={backing} material={dark} position={[cx, pl + dh / 2, cd - 0.0015]} visible={false}>
        <planeGeometry args={[cw, dh]} />
      </mesh>

      {/* doors */}
      {layout.hingeLeft.map((left, i) => {
        const xl = x0 + i * bw + (bw - dw) / 2;
        return (
          <Appear key={`door-${i}-${layout.n}`} at={[0.7 + i * 0.02, 0.8 + i * 0.02]} from={[0, 0, 0.7]}>
            <Door
              index={i}
              hingeX={left ? xl : xl + dw}
              width={dw}
              left={left}
              open={!!open[i]}
              material={front}
              metal={mats.metal}
              hinge={mats.hinge}
              handle={config.handle}
              onToggle={onToggleDoor}
              angles={angles}
            />
          </Appear>
        );
      })}
    </group>
  );
}
