"use client";

import { useId } from "react";

export type Mood = "happy" | "thinking" | "grin" | "surprised" | "sad" | "confused" | "wink" | "angry" | "error";

type Px = [x: number, y: number, w: number, h: number];

/** Visages dessinés en blocs sur une grille de 3 px : le côté « pixelisé » du robot. */
const FACES: Record<Mood, { eyes: Px[]; mouth: Px[]; extra?: Px[] }> = {
  happy: {
    eyes: [[39, 62, 6, 6], [75, 62, 6, 6]],
    mouth: [[51, 71, 18, 3], [54, 74, 12, 3]],
  },
  thinking: {
    eyes: [[39, 64, 6, 6], [75, 64, 6, 6]],
    mouth: [[57, 75, 12, 3]],
    extra: [[36, 59, 12, 3], [72, 56, 6, 3], [78, 59, 6, 3]],
  },
  grin: {
    eyes: [[40, 60, 3, 9], [37, 63, 9, 3], [77, 60, 3, 9], [74, 63, 9, 3]],
    mouth: [[48, 70, 24, 3], [51, 73, 18, 3], [54, 76, 12, 3]],
  },
  surprised: {
    eyes: [[38, 60, 9, 3], [38, 66, 9, 3], [38, 63, 3, 3], [44, 63, 3, 3], [73, 60, 9, 3], [73, 66, 9, 3], [73, 63, 3, 3], [79, 63, 3, 3]],
    mouth: [[57, 72, 6, 6]],
  },
  sad: {
    eyes: [[39, 65, 6, 4], [75, 65, 6, 4]],
    mouth: [[54, 74, 12, 3], [51, 77, 3, 3], [66, 77, 3, 3]],
    extra: [[36, 62, 3, 3], [39, 59, 6, 3], [81, 62, 3, 3], [75, 59, 6, 3]],
  },
  confused: {
    eyes: [[37, 61, 8, 8], [76, 64, 5, 5]],
    mouth: [[48, 75, 4, 3], [52, 72, 4, 3], [56, 75, 4, 3], [60, 72, 4, 3], [64, 75, 4, 3], [68, 72, 4, 3]],
  },
  wink: {
    eyes: [[39, 62, 6, 6], [72, 65, 10, 3]],
    mouth: [[54, 74, 12, 3], [66, 71, 3, 3]],
  },
  angry: {
    eyes: [[40, 66, 5, 4], [75, 66, 5, 4]],
    mouth: [[54, 74, 12, 3], [51, 77, 3, 3], [66, 77, 3, 3]],
    extra: [[36, 58, 4, 3], [40, 60, 4, 3], [44, 62, 4, 3], [80, 58, 4, 3], [76, 60, 4, 3], [72, 62, 4, 3]],
  },
  error: {
    eyes: [[37, 60, 3, 3], [43, 60, 3, 3], [40, 63, 3, 3], [37, 66, 3, 3], [43, 66, 3, 3], [74, 60, 3, 3], [80, 60, 3, 3], [77, 63, 3, 3], [74, 66, 3, 3], [80, 66, 3, 3]],
    mouth: [[54, 75, 12, 3]],
  },
};

export const MOOD_LABEL: Record<Mood, string> = {
  happy: "en ligne",
  thinking: "réfléchit…",
  grin: "répond",
  surprised: "oh !",
  sad: "hors ligne",
  confused: "hmm, pas sûr",
  wink: "et voilà",
  angry: "doucement !",
  error: "erreur",
};

const rects = (list: Px[]) => list.map(([x, y, w, h], i) => <rect key={i} x={x} y={y} width={w} height={h} />);

/**
 * Mascotte de TADASHI AI. Le casque est tracé au trait, le visage en pixels ;
 * l'humeur change l'expression et le mouvement (voir .robot dans globals.css).
 */
export function Robot({ mood, size = 44, title }: { mood: Mood; size?: number; title?: string }) {
  const id = useId().replace(/:/g, "");
  const face = FACES[mood];
  return (
    <svg
      className={`robot robot-${mood}`}
      viewBox="0 0 120 112"
      width={size}
      height={(size * 112) / 120}
      role="img"
      aria-label={title ?? `TADASHI AI — ${MOOD_LABEL[mood]}`}
    >
      <defs>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b82f6" />
          <stop offset="1" stopColor="#c026d3" />
        </linearGradient>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7dd3fc" />
          <stop offset="1" stopColor="#c4b5fd" />
        </linearGradient>
      </defs>

      {mood === "thinking" && (
        <g className="robot-bubble" fill={`url(#${id}f)`} shapeRendering="crispEdges">
          <rect x="4" y="4" width="3" height="6" />
          <rect x="10" y="4" width="3" height="6" />
          <rect x="16" y="4" width="6" height="6" />
          <rect x="17.5" y="5.5" width="3" height="3" fill="#0a0f1f" />
          <rect x="25" y="4" width="3" height="6" />
          <rect x="96" y="3" width="8" height="6" opacity="0.9" />
          <rect x="104" y="5" width="5" height="2" />
          <rect x="109" y="3" width="8" height="6" opacity="0.9" />
        </g>
      )}
      {mood === "confused" && (
        <g className="robot-bubble" fill={`url(#${id}f)`} shapeRendering="crispEdges">
          <rect x="100" y="4" width="9" height="3" />
          <rect x="106" y="7" width="3" height="5" />
          <rect x="103" y="12" width="3" height="4" />
          <rect x="103" y="19" width="3" height="3" />
        </g>
      )}

      <g className="robot-body">
        <g fill="none" stroke={`url(#${id}s)`} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
          <g className="robot-ant">
            <rect x="53" y="5" width="14" height="19" rx="6.5" fill="#0a0f1f" />
          </g>
          <path d="M24 60 A36 36 0 0 1 96 60" />
          <path className="robot-ear" d="M9 30 V64 q0 12 11 13" />
          <path className="robot-ear robot-ear-r" d="M111 30 V64 q0 12 -11 13" />
          <rect x="19" y="50" width="82" height="38" rx="19" fill="#0a0f1f" />
          <path d="M31 90 q29 12 58 0" />
          <path d="M45 101 h30" />
        </g>
        <circle className="robot-led" cx="60" cy="12" r="2.6" />

        {/* key : l'expression est remontée à chaque changement, ce qui rejoue l'animation d'entrée */}
        <g key={mood} className="robot-face" fill={`url(#${id}f)`} shapeRendering="crispEdges">
          <g className="robot-eyes">{rects(face.eyes)}</g>
          {face.extra && <g className="robot-brows">{rects(face.extra)}</g>}
          <g className="robot-mouth">{rects(face.mouth)}</g>
          {mood === "sad" && <rect className="robot-tear" x="82" y="70" width="3" height="5" fill="#7dd3fc" />}
        </g>

        {mood === "thinking" && (
          <g className="robot-hand" fill="#0a0f1f" stroke={`url(#${id}s)`} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M34 108 V94 q0 -9 9 -9 h16 q7 0 7 6 q0 6 -7 6 h-9" />
            <path d="M45 85 q-1 -8 5 -9" fill="none" />
          </g>
        )}
      </g>
    </svg>
  );
}
