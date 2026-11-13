import { DIM, type Kind, type Layout } from '@/lib/wardrobe';

/**
 * Front elevation drawn from the same layout the 3D view and the price use.
 * Units are millimetres; stroke widths are set in CSS through --u (one screen pixel in drawing units).
 */
export function Elevation({ layout, kind, hatchLabel = 'TRAPPE', className = '' }: { layout: Layout; kind: Kind; hatchLabel?: string; className?: string }) {
  const W = layout.width;
  const H = DIM.H;
  const padX = 340;
  const padT = 330;
  const padB = 70;
  const x0 = layout.left;
  const cw = layout.carcassW;
  const bw = cw / layout.n;
  const dw = layout.doorW;
  const top = DIM.bandeau;
  const doorB = H - DIM.plinth;
  const wallL = layout.visible !== 'left';
  const wallR = layout.visible !== 'right';
  const slabA = wallL ? -120 : -padX + 60;
  const slabB = wallR ? W + 120 : W + padX - 60;
  const p = { pathLength: 1 };
  const hx = x0 + DIM.panel + 50;
  const hw = Math.min(500, bw - DIM.panel - 100);
  const hy = doorB - 150 - 760;

  return (
    <svg className={`elev ${className}`} viewBox={`${-padX} ${-padT} ${W + 2 * padX} ${H + padT + padB}`} role="img" aria-label={`${W} × ${H} mm`}>
      <defs>
        <pattern id="elev-hatch" width="42" height="42" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="42" className="elev__hatch" />
        </pattern>
      </defs>

      {/* building: ceiling slab, walls, floor */}
      <rect x={slabA} y={-120} width={slabB - slabA} height={120} className="elev__wall" />
      {wallL && <rect x={-120} y={0} width={120} height={H} className="elev__wall" />}
      {wallR && <rect x={W} y={0} width={120} height={H} className="elev__wall" />}
      <line x1={-padX + 60} y1={H} x2={W + padX - 60} y2={H} className="elev__strong d" {...p} />
      <line x1={slabA} y1={0} x2={slabB} y2={0} className="elev__strong d" {...p} />
      {wallL && <line x1={0} y1={0} x2={0} y2={H} className="elev__strong d" {...p} />}
      {wallR && <line x1={W} y1={0} x2={W} y2={H} className="elev__strong d" {...p} />}

      {/* wardrobe */}
      <rect x={layout.visible === 'left' ? DIM.panel : 0} y={0} width={W - (layout.visible ? DIM.panel : 0)} height={top} className="elev__part d" {...p} />
      {layout.fillerL > 0 && <rect x={0} y={top} width={layout.fillerL} height={H - top} className="elev__part d" {...p} />}
      {layout.fillerR > 0 && <rect x={W - layout.fillerR} y={top} width={layout.fillerR} height={H - top} className="elev__part d" {...p} />}
      {layout.visible && <rect x={layout.visible === 'left' ? 0 : W - DIM.panel} y={0} width={DIM.panel} height={H} className="elev__part elev__part--solid d" {...p} />}
      <rect x={x0} y={doorB} width={cw} height={DIM.plinth} className="elev__plinth d" {...p} />

      {layout.hingeLeft.map((left, i) => {
        const xl = x0 + i * bw + (bw - dw) / 2;
        const free = left ? xl + dw : xl;
        const hinge = left ? xl : xl + dw;
        return (
          <g key={i}>
            <rect x={xl} y={top} width={dw} height={DIM.doorH} className="elev__door d" {...p} />
            <polyline points={`${free},${top} ${hinge},${top + DIM.doorH / 2} ${free},${doorB}`} className="elev__swing" {...p} />
            <circle cx={left ? free - 50 : free + 50} cy={H - DIM.knobH} r={13} className="elev__knob" />
          </g>
        );
      })}

      {kind === 'tech' && hw > 120 && (
        <g className="elev__hatchbox">
          <rect x={hx} y={hy} width={hw} height={760} className="d" {...p} />
          <line x1={hx} y1={hy} x2={hx + hw} y2={hy + 760} className="d" {...p} />
          <line x1={hx + hw} y1={hy} x2={hx} y2={hy + 760} className="d" {...p} />
          <text x={hx + hw / 2} y={hy + 760 + 86} textAnchor="middle" className="elev__label">
            {hatchLabel}
          </text>
        </g>
      )}

      {/* dimensions */}
      <g className="elev__dim">
        <line x1={0} y1={-215} x2={W} y2={-215} className="d" {...p} />
        <line x1={0} y1={-255} x2={0} y2={-175} className="d" {...p} />
        <line x1={W} y1={-255} x2={W} y2={-175} className="d" {...p} />
        <line x1={W + 225} y1={0} x2={W + 225} y2={H} className="d" {...p} />
        <line x1={W + 185} y1={0} x2={W + 265} y2={0} className="d" {...p} />
        <line x1={W + 185} y1={H} x2={W + 265} y2={H} className="d" {...p} />
      </g>
      <text x={W / 2} y={-244} textAnchor="middle" className="elev__num">
        {W}
      </text>
      <text x={W + 262} y={H / 2} textAnchor="middle" className="elev__num" transform={`rotate(-90 ${W + 262} ${H / 2})`} dy="-0.35em">
        {H}
      </text>
    </svg>
  );
}
