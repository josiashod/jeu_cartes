export type AvatarConfig = {
  face: number;      // 0-7: color index
  eyes: number;      // 0-5: eye style
  brows: number;     // kept for backward compat
  mouth: number;     // 0-5: mouth style
  acc: number;       // kept for backward compat
  accColor: number;  // kept for backward compat
};

export const DEFAULT_AVATAR: AvatarConfig = { face: 0, eyes: 0, brows: 0, mouth: 0, acc: 0, accColor: 0 };

export const FACE_COLORS = [
  '#F472B6', // Pink
  '#60A5FA', // Blue
  '#FBBF24', // Yellow
  '#4ADE80', // Green
  '#C084FC', // Purple
  '#FB923C', // Orange
  '#F87171', // Red
  '#2DD4BF', // Teal
];

export const EYE_COUNT = 6;
export const MOUTH_COUNT = 6;
export const COLOR_COUNT = FACE_COLORS.length;

export function encodeAvatar(config: AvatarConfig): string {
  return JSON.stringify(config);
}

export function decodeAvatar(str: string): AvatarConfig | null {
  try {
    const p = JSON.parse(str);
    if (typeof p?.face === 'number') return p as AvatarConfig;
  } catch {}
  return null;
}
