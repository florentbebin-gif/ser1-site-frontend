/**
 * FoyerAvatarArt — avatars vectoriels du foyer (homme, femme, garçon, fille).
 *
 * Dessin SVG flat dans un repère centré sur l'origine et un cercle de rayon
 * {@link FOYER_AVATAR_ART_RADIUS}. Couleurs « scène physique » (peau, cheveux)
 * volontairement codées en dur : elles ne doivent pas s'inverser en thème
 * sombre. Réutilisé par la filiation `/audit` et les pastilles d'accueil ; le
 * `clipId` est fourni par l'appelant (via `useId`) pour rester unique par SVG.
 */

import type { ReactElement } from 'react';

import type { AuditLandingAvatarKind } from '../auditLandingViewModel';

export const FOYER_AVATAR_ART_RADIUS = 115;

const FRAME_STROKE = '#1f1f1f';
const SKIN = '#f6cba2';

const FOYER_AVATAR_BACKGROUNDS: Record<AuditLandingAvatarKind, string> = {
  homme: '#f7ead9',
  femme: '#f3a14a',
  garcon: '#bfe1f2',
  fille: '#f0a0c2',
};

interface FoyerAvatarClipDefProps {
  clipId: string;
}

/** Définition de clip à placer dans un `<defs>` ; clippe le portrait au cercle. */
export function FoyerAvatarClipDef({ clipId }: FoyerAvatarClipDefProps): ReactElement {
  return (
    <clipPath id={clipId}>
      <circle cx={0} cy={0} r={112} />
    </clipPath>
  );
}

interface FoyerAvatarArtProps {
  kind: AuditLandingAvatarKind;
  clipId: string;
}

/**
 * Portrait complet centré sur l'origine : fond teinté, traits clippés au cercle,
 * cadre. Suppose qu'un `<clipPath id={clipId}>` ({@link FoyerAvatarClipDef})
 * existe dans le même SVG.
 */
export function FoyerAvatarArt({ kind, clipId }: FoyerAvatarArtProps): ReactElement {
  return (
    <>
      <circle cx={0} cy={0} r={FOYER_AVATAR_ART_RADIUS} fill={FOYER_AVATAR_BACKGROUNDS[kind]} />
      <g clipPath={`url(#${clipId})`}>{renderPortrait(kind)}</g>
      <circle
        cx={0}
        cy={0}
        r={FOYER_AVATAR_ART_RADIUS}
        fill="none"
        stroke={FRAME_STROKE}
        strokeWidth={4}
      />
    </>
  );
}

function renderPortrait(kind: AuditLandingAvatarKind): ReactElement {
  switch (kind) {
    case 'homme':
      return <HommePortrait />;
    case 'femme':
      return <FemmePortrait />;
    case 'garcon':
      return <GarconPortrait />;
    case 'fille':
      return <FillePortrait />;
  }
}

function HommePortrait(): ReactElement {
  return (
    <>
      <path d="M46 -112 C96 -56 96 60 54 112 L112 112 L112 -112 Z" fill="#f4ddc6" />
      <path d="M82 -112 C120 -44 120 56 90 112 L112 112 L112 -112 Z" fill="#ef8f3e" />
      <path d="M-19 22 L19 22 L21 90 L-21 90 Z" fill={SKIN} />
      <path
        d="M-100 112 L-100 60 C-84 40 -52 42 -22 56 L0 80 L22 56 C52 42 84 40 100 60 L100 112 Z"
        fill="#3b332e"
      />
      <ellipse cx={-47} cy={-16} rx={9} ry={13} fill={SKIN} />
      <ellipse cx={47} cy={-16} rx={9} ry={13} fill={SKIN} />
      <path
        d="M-49 -32 C-51 22 -29 50 0 50 C29 50 51 22 49 -32 C49 -62 27 -80 0 -80 C-27 -80 -49 -62 -49 -32 Z"
        fill={SKIN}
      />
      <path
        d="M-49 -30 C-49 22 -29 50 0 50 C29 50 49 22 49 -30 C43 -4 29 8 0 8 C-29 8 -43 -4 -49 -30 Z"
        fill="#43301f"
      />
      <path d="M-17 0 C-9 7 9 7 17 0 C9 11 -9 11 -17 0 Z" fill="#43301f" />
      <path d="M-1 -12 L-5 4 Q0 7 5 4 L1 -12 Z" fill="#ecbf96" />
      <path d="M-14 12 Q0 27 14 12 Q0 20 -14 12 Z" fill="#7a3b2c" />
      <path d="M-11 14 Q0 21 11 14 Q0 17 -11 14 Z" fill="#fbf7f2" />
      <path
        d="M-50 -30 C-58 -76 -26 -92 6 -90 C42 -90 60 -68 52 -28 C48 -48 39 -52 33 -49 C39 -59 27 -63 18 -58 C24 -68 6 -71 -4 -64 C1 -74 -18 -72 -24 -62 C-20 -73 -37 -68 -38 -56 C-34 -66 -49 -57 -47 -42 C-50 -53 -55 -44 -50 -30 Z"
        fill="#5a3d28"
      />
      <path
        d="M-26 -72 C-6 -82 18 -80 34 -66"
        stroke="#71502f"
        strokeWidth={3.5}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M-35 -45 Q-21 -51 -9 -46"
        stroke="#43301f"
        strokeWidth={4.5}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M9 -46 Q21 -51 35 -45"
        stroke="#43301f"
        strokeWidth={4.5}
        fill="none"
        strokeLinecap="round"
      />
      <circle cx={-20} cy={-26} r={3.4} fill="#2c2622" />
      <circle cx={20} cy={-26} r={3.4} fill="#2c2622" />
      <rect
        x={-41}
        y={-39}
        width={35}
        height={27}
        rx={8}
        fill="#ffffff"
        fillOpacity={0.12}
        stroke={FRAME_STROKE}
        strokeWidth={3}
      />
      <rect
        x={6}
        y={-39}
        width={35}
        height={27}
        rx={8}
        fill="#ffffff"
        fillOpacity={0.12}
        stroke={FRAME_STROKE}
        strokeWidth={3}
      />
      <path d="M-6 -31 Q0 -35 6 -31" stroke={FRAME_STROKE} strokeWidth={3} fill="none" />
      <line
        x1={-41}
        y1={-33}
        x2={-50}
        y2={-31}
        stroke={FRAME_STROKE}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <line
        x1={41}
        y1={-33}
        x2={50}
        y2={-31}
        stroke={FRAME_STROKE}
        strokeWidth={3}
        strokeLinecap="round"
      />
    </>
  );
}

function FemmePortrait(): ReactElement {
  return (
    <>
      <path
        d="M-45 46 C-58 -10 -55 -54 -15 -74 C-33 -64 -45 -34 -45 6 C-45 24 -45 36 -45 46 Z"
        fill="#7c3119"
      />
      <path
        d="M45 38 C56 -14 43 -58 6 -74 C30 -62 41 -32 41 4 C41 18 43 28 45 38 Z"
        fill="#7c3119"
      />
      <ellipse cx={4} cy={-80} rx={21} ry={18} fill="#7c3119" />
      <ellipse cx={4} cy={-62} rx={11} ry={7} fill="#6a2a16" />
      <path
        d="M-8 -86 Q4 -95 16 -85"
        stroke="#9a4528"
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
      />
      <path d="M-17 24 L17 24 L19 92 L-19 92 Z" fill={SKIN} />
      <path d="M-46 112 L0 58 L46 112 Z" fill="#f4f6f8" />
      <path
        d="M-96 112 L-96 66 C-74 46 -44 50 -30 64 L0 90 L30 64 C44 50 74 46 96 66 L96 112 Z"
        fill="#232a3a"
      />
      <path d="M-30 64 L-12 59 L-19 81 Z" fill="#f4f6f8" />
      <path d="M30 64 L12 59 L19 81 Z" fill="#f4f6f8" />
      <path d="M-30 64 L0 90" stroke="#161b26" strokeWidth={2} fill="none" />
      <path d="M30 64 L0 90" stroke="#161b26" strokeWidth={2} fill="none" />
      <path
        d="M-43 -26 C-45 24 -25 48 0 48 C25 48 45 24 43 -26 C43 -56 23 -72 0 -72 C-23 -72 -43 -56 -43 -26 Z"
        fill={SKIN}
      />
      <ellipse cx={43} cy={-10} rx={8} ry={12} fill={SKIN} />
      <line x1={43} y1={2} x2={43} y2={7} stroke="#cdaf6a" strokeWidth={1.5} />
      <circle cx={43} cy={12} r={4.5} fill="#f1ead8" stroke="#cdbb88" strokeWidth={1} />
      <path
        d="M-43 -24 C-40 -56 -16 -72 4 -72 C30 -72 43 -54 43 -24 C35 -48 21 -52 7 -48 C19 -58 -3 -62 -13 -54 C-5 -60 -27 -56 -33 -44 C-27 -52 -40 -42 -43 -24 Z"
        fill="#8a3a22"
      />
      <path
        d="M-31 -28 Q-19 -34 -7 -29"
        stroke="#6a2a16"
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M7 -29 Q19 -34 31 -28"
        stroke="#6a2a16"
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
      />
      <path d="M-30 -16 Q-19 -24 -8 -16 Q-19 -12 -30 -16 Z" fill="#ffffff" />
      <circle cx={-18} cy={-16} r={4} fill="#4a3526" />
      <circle cx={-18} cy={-16} r={1.6} fill="#1c140e" />
      <path d="M8 -16 Q19 -24 30 -16 Q19 -12 8 -16 Z" fill="#ffffff" />
      <circle cx={18} cy={-16} r={4} fill="#4a3526" />
      <circle cx={18} cy={-16} r={1.6} fill="#1c140e" />
      <path d="M-30 -16 Q-19 -24 -8 -16" stroke="#3a2a1e" strokeWidth={2} fill="none" />
      <path d="M8 -16 Q19 -24 30 -16" stroke="#3a2a1e" strokeWidth={2} fill="none" />
      <path
        d="M3 -8 C5 4 4 8 -3 9"
        stroke="#e2a984"
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
      />
      <path d="M-11 20 Q0 15 11 20 Q0 29 -11 20 Z" fill="#df5b2c" />
      <path d="M-11 20 Q0 23 11 20" stroke="#b8431d" strokeWidth={1.2} fill="none" />
      <ellipse
        cx={-18}
        cy={-15}
        rx={17}
        ry={13}
        fill="none"
        stroke={FRAME_STROKE}
        strokeWidth={2.5}
      />
      <ellipse
        cx={18}
        cy={-15}
        rx={17}
        ry={13}
        fill="none"
        stroke={FRAME_STROKE}
        strokeWidth={2.5}
      />
      <path d="M-3 -17 Q0 -20 3 -17" stroke={FRAME_STROKE} strokeWidth={2.5} fill="none" />
      <line x1={35} y1={-16} x2={43} y2={-14} stroke={FRAME_STROKE} strokeWidth={2.5} />
      <line x1={-35} y1={-16} x2={-43} y2={-14} stroke={FRAME_STROKE} strokeWidth={2.5} />
    </>
  );
}

function FillePortrait(): ReactElement {
  return (
    <>
      <path
        d="M-43 22 C-55 -32 -37 -68 0 -70 C37 -68 55 -32 43 22 C39 -6 23 -28 0 -28 C-23 -28 -39 -6 -43 22 Z"
        fill="#6e4326"
      />
      <ellipse cx={2} cy={-64} rx={15} ry={13} fill="#6e4326" />
      <ellipse cx={2} cy={-50} rx={9} ry={6} fill="#5c3720" />
      <path d="M-16 24 L16 24 L18 90 L-18 90 Z" fill={SKIN} />
      <path d="M-36 112 L0 58 L36 112 Z" fill="#f4f6f8" />
      <path
        d="M-96 112 L-96 68 C-74 48 -44 52 -26 66 L0 88 L26 66 C44 52 74 48 96 68 L96 112 Z"
        fill="#2b3340"
      />
      <path d="M-26 66 L-8 62 L-14 82 Z" fill="#f4f6f8" />
      <path d="M26 66 L8 62 L14 82 Z" fill="#f4f6f8" />
      <path
        d="M-42 -22 C-44 26 -24 48 0 48 C24 48 44 26 42 -24 C42 -52 22 -66 0 -66 C-22 -66 -42 -50 -42 -22 Z"
        fill={SKIN}
      />
      <ellipse cx={-42} cy={-6} rx={7} ry={11} fill={SKIN} />
      <ellipse cx={42} cy={-6} rx={7} ry={11} fill={SKIN} />
      <path
        d="M-42 -20 C-44 -54 -22 -68 2 -68 C30 -68 44 -52 42 -22 C36 -44 22 -50 8 -48 C24 -36 0 -28 -20 -33 C-32 -36 -38 -40 -42 -20 Z"
        fill="#6e4326"
      />
      <path d="M40 -22 C46 6 40 28 31 36 C40 14 38 -8 35 -22 Z" fill="#6e4326" />
      <path
        d="M-28 -24 Q-18 -29 -8 -25"
        stroke="#5c3720"
        strokeWidth={2.6}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M8 -25 Q18 -29 28 -24"
        stroke="#5c3720"
        strokeWidth={2.6}
        fill="none"
        strokeLinecap="round"
      />
      <ellipse cx={-17} cy={-12} rx={6.5} ry={7.5} fill="#ffffff" />
      <circle cx={-16} cy={-11} r={4} fill="#5a3a24" />
      <circle cx={-16} cy={-11} r={1.6} fill="#1c140e" />
      <circle cx={-14.5} cy={-12.5} r={1.1} fill="#ffffff" />
      <ellipse cx={17} cy={-12} rx={6.5} ry={7.5} fill="#ffffff" />
      <circle cx={16} cy={-11} r={4} fill="#5a3a24" />
      <circle cx={16} cy={-11} r={1.6} fill="#1c140e" />
      <circle cx={17.5} cy={-12.5} r={1.1} fill="#ffffff" />
      <path
        d="M2 -6 C3 3 2 6 -2 7"
        stroke="#e2a984"
        strokeWidth={1.8}
        fill="none"
        strokeLinecap="round"
      />
      <path d="M-8 18 Q0 14 8 18 Q0 24 -8 18 Z" fill="#d6604c" />
      <circle cx={-26} cy={8} r={6} fill="#ef9aa0" opacity={0.45} />
      <circle cx={26} cy={8} r={6} fill="#ef9aa0" opacity={0.45} />
    </>
  );
}

function GarconPortrait(): ReactElement {
  return (
    <>
      <path d="M-17 22 L17 22 L19 88 L-19 88 Z" fill={SKIN} />
      <path d="M-40 112 L-26 62 L0 74 L26 62 L40 112 Z" fill="#f4f6f8" />
      <path
        d="M-96 112 L-96 68 C-74 48 -46 52 -28 66 L0 82 L28 66 C46 52 74 48 96 68 L96 112 Z"
        fill="#e8a33d"
      />
      <path d="M-28 66 L0 82 L28 66" stroke="#c9842a" strokeWidth={2.5} fill="none" />
      <path d="M-46 -20 C-54 -62 -30 -86 0 -86 C30 -86 54 -62 46 -20 Z" fill="#6e2f1c" />
      <path
        d="M-40 -22 C-42 24 -22 46 0 46 C25 46 43 22 42 -24 C42 -52 22 -68 0 -68 C-24 -68 -40 -50 -40 -22 Z"
        fill={SKIN}
      />
      <ellipse cx={-40} cy={-6} rx={7} ry={11} fill={SKIN} />
      <ellipse cx={40} cy={-6} rx={7} ry={11} fill={SKIN} />
      <path
        d="M-42 -28 C-46 -54 -22 -66 2 -66 C32 -66 48 -54 47 -26 C40 -50 22 -52 6 -50 C-8 -49 -26 -46 -42 -28 Z"
        fill="#6e2f1c"
      />
      <path d="M30 -64 C48 -78 60 -66 52 -50 C48 -62 38 -64 30 -60 Z" fill="#6e2f1c" />
      <path
        d="M-24 -58 C-4 -66 22 -64 40 -50"
        stroke="#8a4128"
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M-28 -26 Q-18 -31 -8 -27"
        stroke="#5a2516"
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M8 -27 Q18 -31 28 -26"
        stroke="#5a2516"
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
      />
      <ellipse cx={-17} cy={-13} rx={6.5} ry={7.5} fill="#ffffff" />
      <circle cx={-16} cy={-12} r={4} fill="#3a7bc8" />
      <circle cx={-16} cy={-12} r={1.7} fill="#16314f" />
      <circle cx={-14.5} cy={-13.5} r={1.1} fill="#ffffff" />
      <ellipse cx={17} cy={-13} rx={6.5} ry={7.5} fill="#ffffff" />
      <circle cx={16} cy={-12} r={4} fill="#3a7bc8" />
      <circle cx={16} cy={-12} r={1.7} fill="#16314f" />
      <circle cx={17.5} cy={-13.5} r={1.1} fill="#ffffff" />
      <path
        d="M2 -6 C3 3 2 6 -2 7"
        stroke="#e2a984"
        strokeWidth={1.8}
        fill="none"
        strokeLinecap="round"
      />
      <path d="M-9 12 Q0 24 9 12 Q0 17 -9 12 Z" fill="#7a3b2c" />
      <path d="M-7 13 Q0 16 7 13 Z" fill="#fbf7f2" />
      <path d="M-4 17 Q0 21 4 17 Z" fill="#d8665a" />
      <circle cx={-25} cy={6} r={5.5} fill="#ef9aa0" opacity={0.4} />
      <circle cx={25} cy={6} r={5.5} fill="#ef9aa0" opacity={0.4} />
    </>
  );
}

export default FoyerAvatarArt;
