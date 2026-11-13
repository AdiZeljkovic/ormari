import * as THREE from 'three';
import type { Decor } from '@/lib/wardrobe';

/** Box whose UVs are in metres, so one texture tiles consistently on every panel. */
export function boxGeometry(w: number, h: number, d: number) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  const faces: [number, number][] = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) {
    for (let i = 0; i < 4; i++) {
      const k = f * 4 + i;
      uv.setXY(k, uv.getX(k) * faces[f][0], uv.getY(k) * faces[f][1]);
    }
  }
  uv.needsUpdate = true;
  return g;
}

/* Photographic PBR textures (CC0, Poly Haven): oak_veneer_01, herringbone_parquet, white_plaster_02. */
const loader = typeof window === 'undefined' ? null : new THREE.TextureLoader();
const textures = new Map<string, THREE.Texture>();

/** `tile` is the real-world size of one texture repeat, in metres. */
function texture(name: string, tile: number, srgb = false) {
  const key = `${name}@${tile}`;
  const hit = textures.get(key);
  if (hit) return hit;
  const t = loader!.load(`/assets/textures/${name}.jpg`);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / tile, 1 / tile);
  t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  textures.set(key, t);
  return t;
}

/** Average colour of the oak veneer photo; decors are reached by tinting it. */
const OAK_MEAN = new THREE.Color('#b2895a');

const cache = new Map<string, THREE.Material>();

export function decorMaterial(d: Decor): THREE.Material {
  const hit = cache.get(d.id);
  if (hit) return hit;
  let m: THREE.Material;
  if (d.wood) {
    const c = new THREE.Color(d.hex);
    const wood = new THREE.MeshStandardMaterial({
      map: texture('oak_diff', 1.25, true),
      normalMap: texture('oak_nor', 1.25),
      roughnessMap: texture('oak_rough', 1.25),
      roughness: 0.92,
      metalness: 0,
    });
    wood.normalScale.setScalar(0.45);
    wood.color.setRGB(c.r / OAK_MEAN.r, c.g / OAK_MEAN.g, c.b / OAK_MEAN.b);
    m = wood;
  } else if (d.group === 'mdf') {
    // Lacquer: smooth base under a thin clear coat.
    m = new THREE.MeshPhysicalMaterial({ color: d.hex, roughness: 0.42, metalness: 0, clearcoat: 0.55, clearcoatRoughness: 0.28 });
  } else {
    m = new THREE.MeshStandardMaterial({ color: d.hex, roughness: d.group === 'hpl' ? 0.5 : 0.68, metalness: 0 });
  }
  cache.set(d.id, m);
  return m;
}

export function floorMaterial() {
  const m = new THREE.MeshStandardMaterial({
    map: texture('parquet_diff', 2.3, true),
    normalMap: texture('parquet_nor', 2.3),
    roughnessMap: texture('parquet_rough', 2.3),
    roughness: 0.78,
    metalness: 0,
  });
  m.normalScale.setScalar(0.6);
  return m;
}

export function wallMaterial() {
  // Clean painted plaster: only the relief and sheen come from the photo, the colour stays even.
  const m = new THREE.MeshStandardMaterial({
    normalMap: texture('plaster_nor', 1.8),
    roughnessMap: texture('plaster_rough', 1.8),
    roughness: 1,
    metalness: 0,
  });
  m.normalScale.setScalar(0.28);
  return m;
}
/** Light cookie: a tall window with glazing bars, softened so the sun patches have a penumbra. */
export function windowCookie() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const x = c.getContext('2d')!;
  x.fillStyle = '#000';
  x.fillRect(0, 0, 512, 512);
  x.filter = 'blur(2.5px)';
  x.fillStyle = '#fff';
  const cols = 3;
  const rows = 4;
  const x0 = 134;
  const y0 = 60;
  const pw = 66;
  const ph = 82;
  const bar = 22;
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) x.fillRect(x0 + i * (pw + bar), y0 + j * (ph + bar), pw, ph);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
