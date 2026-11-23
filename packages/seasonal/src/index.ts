// index.ts: the public API of @veilo-ui/seasonal: seasonal loading animations drawn with text
// characters. Import-safe on a server: nothing here touches `window` or `document` until an
// effect is mounted.

export { loadEffectFonts } from "./fonts.ts";
export { FLAKE_SHAPES, type FlakeShape } from "./flake.ts";
export {
  REPLAY_PAUSE_MS,
  mountEffect,
  type EffectHandle,
  type EffectMode,
  type MountEffectOptions,
} from "./mount.ts";
export { EFFECT_IDS, usesFlakeShape, type EffectId } from "./variants.ts";
