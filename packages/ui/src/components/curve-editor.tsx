// curve-editor.tsx: an editable cubic-bezier easing graph with two draggable, keyboard-movable handles.
// Built for Veilo instead of bezier-easing-editor (MIT, by Gaëtan Renaudeau), which has no keyboard
// support; the larger invisible hit circle and the native touchstart listener follow its approach.

import { useEffect, useId, useRef, type KeyboardEvent, type PointerEvent } from "react";
import { Button } from "./button.tsx";
import field from "./field.module.css";
import { Tooltip } from "./tooltip.tsx";
import styles from "./curve-editor.module.css";

/** A CSS `cubic-bezier(x1, y1, x2, y2)` as four numbers. */
export type CurveValue = readonly [x1: number, y1: number, x2: number, y2: number];

/** Props of {@link CurveEditor}. */
export interface CurveEditorProps {
  /** The visible label, which also names the graph for screen readers. */
  label: string;
  /** The current curve. */
  value: CurveValue;
  /** Called with the new curve while a handle is dragged or moved with a key. */
  onValueChange: (value: CurveValue) => void;
  /** Lowest y a handle may take and the graph shows (default -0.1). */
  yMin?: number;
  /** Highest y a handle may take and the graph shows (default 1.1). */
  yMax?: number;
  /** Distance between allowed values (default 0.01). */
  step?: number;
  /** Extra class for the field. */
  className?: string;
}

// Drawing units: one curve unit spans UNIT in x and in y, so the unit square is square. The
// graph is square too: x gets the same span as y, centered on 0..1. The SVG scales uniformly to
// the box, so circles stay round.
const UNIT = 200;
const PAD = 10;
const HANDLE_R = 6;
/** Dot grid spacing inside the unit square: one dot every 0.1 of x and y. */
const DOT_STEP = UNIT / 10;
// About 32 CSS px across at the panel's width, so handles are easy to touch.
const HIT_R = 16;
const HANDLE_NAMES = ["Start handle", "End handle"] as const;

/**
 * Rounds to a multiple of `step` and trims float noise (0.30000000000000004 becomes 0.3).
 *
 * @param value - The raw value.
 * @param step - The step.
 * @returns The snapped value.
 */
export function snapToStep(value: number, step: number): number {
  const decimals = Math.max(0, Math.ceil(-Math.log10(step)));
  return Number((Math.round(value / step) * step).toFixed(decimals));
}

/**
 * Formats a curve as the CSS function, with two decimals per number.
 *
 * @param value - The curve.
 * @returns For example `cubic-bezier(0.22, 1.00, 0.36, 1.00)`.
 */
export function formatCurve(value: CurveValue): string {
  return `cubic-bezier(${value.map((n) => n.toFixed(2)).join(", ")})`;
}

/**
 * An easing graph: the curve from (0, 0) to (1, 1) with its two control handles. Drag a handle,
 * or focus it and use the arrow keys (left and right move x, up and down move y; Shift moves ten
 * steps). x stays in 0..1 and y in `yMin..yMax`, snapped to `step`. Side effect: a native,
 * non-passive `touchstart` listener on each handle, so dragging on a phone does not scroll the
 * page (removed on unmount).
 *
 * @param props - The label, curve, range, step and change handler.
 * @returns The field with label, a hint button with the CSS value, and the graph. Needs a
 * TooltipProvider above it.
 */
export function CurveEditor(props: CurveEditorProps) {
  const { label, value, onValueChange, yMin = -0.1, yMax = 1.1, step = 0.01, className } = props;
  const labelId = useId();
  const hintId = useId();
  // useId returns ":r1:"-style ids; keep letters and digits so url(#...) always resolves.
  const dotsId = `veilo-curve-dots-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef<0 | 1 | null>(null);

  // Drawing coordinates. y grows downward in SVG, so y = yMax is at the top. The x margin
  // centers 0..1 in a span as wide as y's.
  const span = yMax - yMin;
  const xMargin = (span - 1) / 2;
  const size = span * UNIT + PAD * 2;
  const px = (x: number) => PAD + (x + xMargin) * UNIT;
  const py = (y: number) => PAD + (yMax - y) * UNIT;
  // Handles from imported settings may lie outside the range; they are drawn at the edge.
  const handleY = (y: number) => py(Math.min(yMax, Math.max(yMin, y)));

  const clampPoint = (x: number, y: number): [number, number] => [
    snapToStep(Math.min(1, Math.max(0, x)), step),
    snapToStep(Math.min(yMax, Math.max(yMin, y)), step),
  ];

  const moveHandle = (index: 0 | 1, x: number, y: number) => {
    const [nx, ny] = clampPoint(x, y);
    const next: [number, number, number, number] = [...value];
    next[index * 2] = nx;
    next[index * 2 + 1] = ny;
    if (next.some((n, k) => n !== value[k])) onValueChange(next);
  };

  // Pointer position in curve units, through the SVG's own transform (handles any CSS scaling).
  const pointerToCurve = (event: PointerEvent): [number, number] | null => {
    const svg = svgRef.current;
    const matrix = svg?.getScreenCTM();
    if (!svg || !matrix) return null;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    return [(point.x - PAD) / UNIT - xMargin, yMax - (point.y - PAD) / UNIT];
  };

  const onPointerDown = (index: 0 | 1) => (event: PointerEvent<SVGCircleElement>) => {
    dragging.current = index;
    // Keeps the drag going when the pointer leaves the graph. Throws for a pointer the browser
    // does not know (synthetic events); the drag still works while over the handle.
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Nothing to do.
    }
    event.currentTarget.focus();
  };
  const onPointerMove = (event: PointerEvent<SVGCircleElement>) => {
    const index = dragging.current;
    if (index === null) return;
    const point = pointerToCurve(event);
    if (point) moveHandle(index, point[0], point[1]);
  };
  const onPointerUp = () => {
    dragging.current = null;
  };

  const onKeyDown = (index: 0 | 1) => (event: KeyboardEvent<SVGCircleElement>) => {
    const amount = event.shiftKey ? step * 10 : step;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-amount, 0],
      ArrowRight: [amount, 0],
      ArrowUp: [0, amount],
      ArrowDown: [0, -amount],
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    moveHandle(index, value[index * 2]! + move[0], value[index * 2 + 1]! + move[1]);
  };

  // React adds touch listeners as passive, and some browsers ignore touch-action on SVG
  // children, so a native non-passive listener is the only way to stop the page scrolling.
  useEffect(() => {
    const handles = svgRef.current?.querySelectorAll<SVGCircleElement>("[data-handle]") ?? [];
    const stop = (event: TouchEvent) => event.preventDefault();
    handles.forEach((handle) => handle.addEventListener("touchstart", stop, { passive: false }));
    return () => handles.forEach((handle) => handle.removeEventListener("touchstart", stop));
  }, []);

  const [x1, y1, x2, y2] = value;
  const curve = `M ${px(0)} ${py(0)} C ${px(x1)} ${py(y1)}, ${px(x2)} ${py(y2)}, ${px(1)} ${py(1)}`;
  const handles = [
    { from: [0, 0], at: [x1, y1] },
    { from: [1, 1], at: [x2, y2] },
  ] as const;

  return (
    <div className={[field.field, className].filter(Boolean).join(" ")}>
      <span className={[field.label, styles.labelRow].join(" ")}>
        <span id={labelId}>{label}</span>
        {/* The CSS value on demand, so the label row stays quiet. */}
        <Tooltip content={formatCurve(value)} side="left">
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            aria-label="Curve values"
            icon={<InfoIcon />}
            type="button"
          />
        </Tooltip>
      </span>
      <div className={styles.box}>
        <svg
          ref={svgRef}
          className={styles.graph}
          viewBox={`0 0 ${size} ${size}`}
          role="group"
          aria-labelledby={labelId}
        >
          {/* Dot grid of the working area: the tile is shifted half a step, so its centered dot
              lands on every 0.1 of x and y, counted from the square's corner. */}
          <defs>
            <pattern
              id={dotsId}
              patternUnits="userSpaceOnUse"
              x={px(0) - DOT_STEP / 2}
              y={py(1) - DOT_STEP / 2}
              width={DOT_STEP}
              height={DOT_STEP}
            >
              <circle className={styles.dot} cx={DOT_STEP / 2} cy={DOT_STEP / 2} />
            </pattern>
          </defs>
          {/* Inset by half a step, so only the inner dots (0.1 to 0.9) show, not halves on the edges. */}
          <rect
            x={px(0) + DOT_STEP / 2}
            y={py(1) + DOT_STEP / 2}
            width={UNIT - DOT_STEP}
            height={UNIT - DOT_STEP}
            fill={`url(#${dotsId})`}
          />
          {/* The unit square, the 0 and 1 lines across it, and the linear diagonal for reference. */}
          <rect className={styles.frame} x={px(0)} y={py(1)} width={UNIT} height={UNIT} />
          <line className={styles.guide} x1={px(0)} y1={py(0)} x2={px(1)} y2={py(1)} />
          <path className={styles.curve} d={curve} />
          {handles.map((handle, index) => {
            const i = index as 0 | 1;
            const [hx, hy] = handle.at;
            return (
              <g key={i}>
                <line
                  className={styles.arm}
                  x1={px(handle.from[0])}
                  y1={py(handle.from[1])}
                  x2={px(hx)}
                  y2={handleY(hy)}
                />
                {/* The invisible, larger hit circle takes focus and pointer input; the visible
                  knob after it shows the focus ring through the sibling selector. */}
                <circle
                  data-handle={i}
                  className={styles.hit}
                  cx={px(hx)}
                  cy={handleY(hy)}
                  r={HIT_R}
                  tabIndex={0}
                  role="slider"
                  aria-label={HANDLE_NAMES[i]}
                  aria-describedby={hintId}
                  aria-valuemin={yMin}
                  aria-valuemax={yMax}
                  aria-valuenow={hy}
                  aria-valuetext={`x ${hx.toFixed(2)}, y ${hy.toFixed(2)}`}
                  onPointerDown={onPointerDown(i)}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                  onKeyDown={onKeyDown(i)}
                />
                <circle className={styles.knob} cx={px(hx)} cy={handleY(hy)} r={HANDLE_R} />
                <circle className={styles.ring} cx={px(hx)} cy={handleY(hy)} r={HANDLE_R + 4} />
              </g>
            );
          })}
        </svg>
      </div>
      <span id={hintId} className={field.hint}>
        Drag a handle, or focus it and use the arrow keys. Shift moves further.
      </span>
    </div>
  );
}

/**
 * An "i" in a circle, 16 px, in the current text color.
 *
 * @returns The icon.
 */
function InfoIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" />
      <path d="M8 7v4.5M8 4.5v.5" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}
