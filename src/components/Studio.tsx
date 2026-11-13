'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { computeLayout, type Config } from '@/lib/wardrobe';
import type { Mood, SceneProps } from './three/Scene';

const Scene = dynamic(() => import('./three/Scene'), { ssr: false });

/**
 * Full-frame scene with a fixed camera. Used to produce the still images under /public/renders
 * (see the render script); not linked from the site.
 */
export function Studio({ config, shot, mood, open, furnished, clear, styled }: { config: Config; shot: NonNullable<SceneProps['shot']>; mood: Mood; open: boolean; furnished: boolean; clear: number; styled: boolean }) {
  const layout = useMemo(() => computeLayout(config), [config]);
  const doors = useMemo(() => Array(4).fill(open) as boolean[], [open]);
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#dcd9d3' }}>
      <Scene config={config} layout={layout} open={doors} mood={mood} shot={shot} furnished={furnished} clear={clear} styled={styled} interactive />
    </div>
  );
}
