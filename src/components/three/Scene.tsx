'use client';

import * as THREE from 'three';
import { Suspense, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, Line, OrbitControls, useGLTF } from '@react-three/drei';
import { EffectComposer, N8AO, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { DIM, type Config, type Layout, type Side } from '@/lib/wardrobe';
import { AssemblyContext, Wardrobe } from './Wardrobe';
import { boxGeometry, floorMaterial, wallMaterial, windowCookie } from './materials';

export type Mood = 'day' | 'evening';

export interface SceneProps {
  config: Config;
  layout: Layout;
  open: boolean[];
  onToggleDoor?: (i: number) => void;
  /** Scroll-driven build progress (hero). Absent = finished wardrobe. */
  assembly?: MutableRefObject<number>;
  dims?: 'all' | 'width' | 'none';
  mood?: Mood;
  interactive?: boolean;
  /** Increment to animate the camera to a straight front view. */
  frontTick?: number;
  paused?: boolean;
  fallback?: string;
  /** Fixed camera for still renders: azimuth, elevation, distance factor, target. */
  shot?: { az: number; el: number; zoom: number; target: [number, number, number]; fov?: number };
  /** Furniture next to the niche. */
  furnished?: boolean;
  /** Extra distance between the niche and the furniture, in metres. */
  clear?: number;
  /** Fill the interior with clothes and folded stacks (still renders). */
  styled?: boolean;
}

const H = DIM.H / 1000;
const D = DIM.D / 1000;
const EXT = 5;
const FOV = 30;
const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Plane with UVs in metres, lying on the XZ plane. */
function planeGeometry(w: number, d: number) {
  const g = new THREE.PlaneGeometry(w, d);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w, uv.getY(i) * d);
  return g;
}

function Room({ W, visible, mood }: { W: number; visible: Side | null; mood: Mood }) {
  const mats = useMemo(
    () => ({
      wall: wallMaterial(),
      floor: floorMaterial(),
      ceiling: new THREE.MeshBasicMaterial({ color: '#eceae5' }),
      skirting: new THREE.MeshStandardMaterial({ color: '#f1efea', roughness: 0.55 }),
    }),
    [],
  );
  useEffect(() => {
    mats.wall.color.set(mood === 'day' ? '#e4e2dd' : '#cfc8bd');
    mats.ceiling.color.set(mood === 'day' ? '#eceae5' : '#4a433b');
    mats.floor.color.set(mood === 'day' ? '#ffffff' : '#e4d9cb');
  }, [mood, mats]);

  const leftWall = visible !== 'left';
  const rightWall = visible !== 'right';
  const xa = leftWall ? -W / 2 : -W / 2 - EXT;
  const xb = rightWall ? W / 2 : W / 2 + EXT;
  const total = W + 2 * EXT;
  const back = useMemo(() => boxGeometry(xb - xa, H, 0.25), [xa, xb]);
  const cheek = useMemo(() => boxGeometry(EXT, H, D + 0.25), []);
  const skirt = useMemo(() => boxGeometry(EXT, 0.08, 0.014), []);
  const ground = useMemo(() => planeGeometry(total, 10), [total]);

  return (
    <group>
      <mesh geometry={back} material={mats.wall} position={[(xa + xb) / 2, H / 2, -0.125]} receiveShadow />
      {[-1, 1].map((s) => {
        const has = s < 0 ? leftWall : rightWall;
        const x = s * (W / 2 + EXT / 2);
        return (
          <group key={s}>
            {has && <mesh geometry={cheek} material={mats.wall} position={[x, H / 2, (D - 0.25) / 2]} receiveShadow castShadow />}
            <mesh geometry={skirt} material={mats.skirting} position={[x, 0.04, (has ? D : 0) + 0.007]} receiveShadow castShadow />
          </group>
        );
      })}
      <mesh geometry={ground} material={mats.floor} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 4.75]} receiveShadow />
      <mesh geometry={ground} material={mats.ceiling} rotation={[Math.PI / 2, 0, 0]} position={[0, H, 4.75]} />
    </group>
  );
}

const MODELS = {
  chair: '/assets/models/mid_century_lounge_chair/model.gltf',
  plant: '/assets/models/potted_plant_02/model.gltf',
};

/** A lounge chair and a plant: enough to give the wall a scale and a life. */
function Furniture({ W, visible, clear }: { W: number; visible: Side | null; clear: number }) {
  const chair = useGLTF(MODELS.chair);
  const plant = useGLTF(MODELS.plant);
  useEffect(() => {
    for (const g of [chair, plant]) {
      g.scene.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) {
          o.castShadow = true;
          o.receiveShadow = true;
        }
      });
    }
  }, [chair, plant]);
  const x = W / 2 + (visible === 'right' ? 0.75 : 0.2) + clear;
  return (
    <group>
      <primitive object={plant.scene} position={[x + 1.42, 0.08, D + 0.3]} rotation={[0, 1.1, 0]} scale={0.85} />
      <primitive object={chair.scene} position={[x + 0.56, 0, D + 0.72]} rotation={[0, -0.5, 0]} />
    </group>
  );
}
type TagNodes = MutableRefObject<Record<string, HTMLSpanElement | null>>;

function DimLine({ a, b, tick = 'y' }: { a: THREE.Vector3Tuple; b: THREE.Vector3Tuple; tick?: 'x' | 'y' | 'z' }) {
  const off = (p: THREE.Vector3Tuple, s: number): THREE.Vector3Tuple => [p[0] + (tick === 'x' ? s : 0), p[1] + (tick === 'y' ? s : 0), p[2] + (tick === 'z' ? s : 0)];
  const col = '#141414';
  return (
    <group>
      <Line points={[a, b]} color={col} lineWidth={1.4} />
      <Line points={[off(a, -0.05), off(a, 0.05)]} color={col} lineWidth={1.4} />
      <Line points={[off(b, -0.05), off(b, 0.05)]} color={col} lineWidth={1.4} />
    </group>
  );
}

/** Dimension lines live in the 3D scene; their labels are DOM nodes placed by projection each frame. */
function Dims({ layout, mode, assembly, nodes }: { layout: Layout; mode: 'all' | 'width'; assembly?: MutableRefObject<number>; nodes: TagNodes }) {
  const W = layout.width / 1000;
  const lift = useRef<THREE.Group>(null);
  const v = useMemo(() => new THREE.Vector3(), []);
  const z = D + 0.03;
  const side = W / 2 + 0.26;
  useFrame(({ camera, size }) => {
    // In the hero the width line starts across the empty niche, then rises to the top band.
    const p = assembly ? smooth(clamp01(assembly.current / 0.16)) : 1;
    const y = 1.3 + (H - 0.05 - 1.3) * p;
    if (lift.current) lift.current.position.y = y;
    const put = (key: string, x: number, py: number, pz: number) => {
      const n = nodes.current[key];
      if (!n) return;
      v.set(x, py, pz).project(camera);
      n.style.transform = `translate3d(${(((v.x + 1) / 2) * size.width).toFixed(1)}px,${(((1 - v.y) / 2) * size.height).toFixed(1)}px,0) translate(-50%,-50%)`;
      n.style.opacity = v.z < 1 ? '1' : '0';
    };
    put('L', 0, y, z);
    put('H', -side, H / 2, z);
    put('door', side, (DIM.plinth + DIM.doorH / 2) / 1000, z);
    put('P', side, 0.012, D / 2);
  });
  return (
    <group>
      <group ref={lift}>
        <DimLine a={[-W / 2, 0, z]} b={[W / 2, 0, z]} />
      </group>
      {mode === 'all' && (
        <>
          <DimLine a={[-side, 0, z]} b={[-side, H, z]} tick="x" />
          <DimLine a={[side, DIM.plinth / 1000, z]} b={[side, (DIM.plinth + DIM.doorH) / 1000, z]} tick="x" />
          <DimLine a={[side, 0.012, 0]} b={[side, 0.012, D]} tick="x" />
        </>
      )}
    </group>
  );
}

function Rig({ W, interactive, assembly, frontTick, shot }: { W: number; interactive: boolean; assembly?: MutableRefObject<number>; frontTick: number; shot?: SceneProps['shot'] }) {
  const { camera, size } = useThree();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controls = useRef<any>(null);
  const aspect = size.width / size.height;
  const fov = shot?.fov ?? FOV;
  const tan = Math.tan((fov * Math.PI) / 360);
  const wide = aspect > 1.05;
  const target = useMemo(() => new THREE.Vector3(), []);
  const anim = useRef<{ t: number; from: THREE.Vector3; to: THREE.Vector3 } | null>(null);

  // Distance at which the niche fits; in the hero it fits inside the right half of a wide frame.
  const share = interactive ? 0.86 : wide ? 0.5 : 0.94;
  const fit = Math.max((interactive ? 1.5 : 1.72) / tan, (W / 2 + (interactive ? 0.5 : 0.42)) / (tan * aspect * share));

  const place = (az: number, el: number, dist: number, out: THREE.Vector3) =>
    out.set(target.x + dist * Math.sin(az) * Math.cos(el), target.y + dist * Math.sin(el), target.z + dist * Math.cos(az) * Math.cos(el));

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    if (cam.fov !== fov) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }
  }, [camera, fov]);

  useEffect(() => {
    if (!interactive) return;
    target.set(0, 1.2, D / 2);
    const cur = camera.position.clone().sub(target);
    const first = !controls.current?.__init;
    const to = new THREE.Vector3();
    if (first) {
      place(0.34, 0.05, fit, to);
      camera.position.copy(to);
      if (controls.current) controls.current.__init = true;
    } else {
      to.copy(target).add(cur.setLength(fit));
      anim.current = { t: 0, from: camera.position.clone(), to };
    }
    controls.current?.target.copy(target);
    controls.current?.update();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fit, interactive]);

  useEffect(() => {
    if (!interactive || !frontTick) return;
    const to = new THREE.Vector3();
    place(0, 0.0, fit, to);
    anim.current = { t: 0, from: camera.position.clone(), to };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frontTick]);

  useFrame((_, dt) => {
    if (shot) {
      target.set(...shot.target);
      place(shot.az, shot.el, (1.5 / tan) * shot.zoom, camera.position);
      camera.lookAt(target);
      return;
    }
    if (interactive) {
      const a = anim.current;
      if (a) {
        a.t = Math.min(1, a.t + dt / 0.7);
        camera.position.lerpVectors(a.from, a.to, smooth(a.t));
        if (a.t >= 1) anim.current = null;
      }
      controls.current?.update();
      return;
    }
    const p = assembly ? assembly.current : 1;
    const e = smooth(clamp01(p));
    const dist = fit * (1.1 - 0.1 * e);
    const visibleHalfW = dist * tan * aspect;
    // Wide frame: niche sits right of centre, copy on the left. Tall frame: niche in the upper part.
    target.set(wide ? -visibleHalfW * 0.3 : 0, wide ? 1.24 : 0.62, D / 2);
    place(wide ? 0.25 - 0.19 * e : 0.24 - 0.2 * e, 0.03 - 0.015 * e, dist, camera.position);
    camera.lookAt(target);
  });

  if (!interactive || shot) return null;
  return (
    <OrbitControls
      ref={controls}
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.55}
      minPolarAngle={1.02}
      maxPolarAngle={1.62}
      minAzimuthAngle={-1}
      maxAzimuthAngle={1}
      minDistance={fit * 0.5}
      maxDistance={fit * 1.25}
    />
  );
}

/** Late-afternoon sun through a tall window on the left: warm patches across wall and wardrobe. */
function Sun() {
  const light = useRef<THREE.SpotLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  const cookie = useMemo(() => windowCookie(), []);
  useEffect(() => {
    if (light.current) light.current.target = target;
  }, [target]);
  return (
    <>
      <primitive object={target} position={[-0.55, 1.12, 0.25]} />
      <spotLight
        ref={light}
        position={[-6.4, 3.05, 6.6]}
        angle={0.46}
        penumbra={0.2}
        decay={0}
        intensity={2.5}
        color="#fff6ec"
        map={cookie}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
        shadow-normalBias={0.03}
        shadow-radius={5}
      />
    </>
  );
}

function SpotAt({ x }: { x: number }) {
  const light = useRef<THREE.SpotLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  useEffect(() => {
    if (light.current) light.current.target = target;
  }, [target]);
  return (
    <>
      <primitive object={target} position={[x, 0.9, D]} />
      <spotLight ref={light} position={[x, H - 0.02, D + 1.15]} angle={0.62} penumbra={0.85} intensity={7} distance={7} decay={1.6} color="#ffe2c0" castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0004} />
      <mesh position={[x, H - 0.004, D + 1.15]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.045, 24]} />
        <meshBasicMaterial color="#ffe9cf" toneMapped={false} />
      </mesh>
    </>
  );
}

function Lights({ mood, W }: { mood: Mood; W: number }) {
  const day = mood === 'day';
  return (
    <>
      <ambientLight intensity={day ? 0.42 : 0.16} color={day ? '#f2f4f8' : '#ffffff'} />
      <hemisphereLight args={[day ? '#f4f6fa' : '#ffffff', '#b8aa98', day ? 0.62 : 0.24]} />
      {day ? (
        <>
          <Sun />
          <directionalLight position={[3, 2.2, 6]} intensity={0.55} color="#eef2f8" />
        </>
      ) : (
        <>
          <directionalLight position={[-3.4, 3.3, 5]} intensity={0.36} color="#ffe6c8" />
          {[-0.3, 0.3].map((f) => (
            <SpotAt key={f} x={f * Math.max(W, 1.2)} />
          ))}
        </>
      )}
      <Environment resolution={256} frames={1} environmentIntensity={day ? 0.55 : 0.2}>
        <color attach="background" args={[day ? '#c9c8c5' : '#3b352e']} />
        <Lightformer form="rect" intensity={day ? 3 : 0.6} color="#fff3e2" position={[-6, 2.5, 3]} rotation={[0, Math.PI / 2, 0]} scale={[7, 4, 1]} />
        <Lightformer form="rect" intensity={day ? 1.2 : 0.5} color="#ffffff" position={[0, 5, 3]} rotation={[Math.PI / 2, 0, 0]} scale={[10, 6, 1]} />
        <Lightformer form="rect" intensity={day ? 0.7 : 0.2} color="#e6ecf5" position={[6, 2, 4]} rotation={[0, -Math.PI / 2, 0]} scale={[6, 4, 1]} />
        <Lightformer form="rect" intensity={day ? 0.5 : 0.15} color="#ffffff" position={[0, 1.5, 9]} scale={[12, 3, 1]} />
      </Environment>
    </>
  );
}

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

export default function Scene(props: SceneProps) {
  const { config, layout, open, onToggleDoor, assembly, dims = 'none', mood = 'day', interactive = false, frontTick = 0, paused = false, fallback, shot, furnished = true, clear = 0, styled = false } = props;
  const [ok, setOk] = useState(true);
  useEffect(() => setOk(webglAvailable()), []);
  const W = layout.width / 1000;
  const nodes = useRef<Record<string, HTMLSpanElement | null>>({});

  if (!ok) return <div className="scene-fallback">{fallback}</div>;

  const tags: [string, string, string | number][] =
    dims === 'none' ? [] : dims === 'width' ? [['L', 'L', layout.width]] : [['L', 'L', layout.width], ['H', 'H', DIM.H], ['door', '', DIM.doorH], ['P', 'P', DIM.D]];

  return (
    <div className="scene">
      <Canvas
        shadows
        dpr={[1, 1.75]}
        frameloop={paused ? 'never' : 'always'}
        camera={{ fov: FOV, near: 0.1, far: 60, position: [2.2, 1.5, 7] }}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          // Tone mapping happens in the effect chain, after ambient occlusion.
          gl.toneMapping = THREE.NoToneMapping;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
      >
        <color attach="background" args={[mood === 'day' ? '#dcd9d3' : '#2a2520']} />
        <Lights mood={mood} W={W} />
        <AssemblyContext.Provider value={assembly ?? null}>
          <Room W={W} visible={layout.visible} mood={mood} />
          <Wardrobe config={config} layout={layout} open={open} onToggleDoor={onToggleDoor} styled={styled} />
          {dims !== 'none' && <Dims layout={layout} mode={dims} assembly={assembly} nodes={nodes} />}
        </AssemblyContext.Provider>
        {furnished && (
          <Suspense fallback={null}>
            <Furniture W={W} visible={layout.visible} clear={clear} />
          </Suspense>
        )}
        <Rig W={W} interactive={interactive} assembly={assembly} frontTick={frontTick} shot={shot} />
        <EffectComposer multisampling={4} enableNormalPass={false}>
          <N8AO aoRadius={0.42} distanceFalloff={0.6} intensity={2.6} quality="medium" halfRes color="#1a120a" />
          <ToneMapping mode={ToneMappingMode.NEUTRAL} />
        </EffectComposer>
      </Canvas>
      <div className="scene__tags" aria-hidden="true">
        {tags.map(([key, k, v]) => (
          <span
            key={key}
            className="dimtag"
            ref={(el) => {
              nodes.current[key] = el;
            }}
            style={{ opacity: 0 }}
          >
            <span className="dimtag__k">{k}</span>
            {v}
          </span>
        ))}
      </div>
    </div>
  );
}

useGLTF.preload(MODELS.chair);
useGLTF.preload(MODELS.plant);
