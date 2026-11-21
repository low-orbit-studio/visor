/**
 * The five looks a theme is reviewed in (VI-795). Today is the selected docs theme
 * as it ships, in the docs site's own mode. Dark and Light force a mode. The two
 * Photo looks force a mode and turn glass on over a photo.
 */
export const LOOKS = [
  { id: 'today', label: 'Today', mode: null, photo: false },
  { id: 'dark', label: 'Dark', mode: 'dark', photo: false },
  { id: 'dark-photo', label: 'Dark + Photo', mode: 'dark', photo: true },
  { id: 'light', label: 'Light', mode: 'light', photo: false },
  { id: 'light-photo', label: 'Light + Photo', mode: 'light', photo: true },
] as const;

export type LookId = (typeof LOOKS)[number]['id'];
export type LookMode = 'light' | 'dark';

/**
 * Stand-in for a public build without the private themes, whose real photos the photo looks use
 * (VI-829), so the public repo ships no client photos: a gradient with shapes for the blur to read.
 */
export const STAND_IN_PHOTO = `data:image/svg+xml;utf8,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#f59e0b'/><stop offset='0.5' stop-color='#db2777'/><stop offset='1' stop-color='#1e3a8a'/></linearGradient></defs><rect width='1200' height='800' fill='url(#g)'/><circle cx='880' cy='220' r='150' fill='#fde68a' opacity='0.85'/><circle cx='260' cy='600' r='220' fill='#0f172a' opacity='0.55'/><rect x='420' y='360' width='360' height='60' rx='30' fill='#ffffff' opacity='0.7'/><rect x='120' y='120' width='200' height='200' rx='24' fill='#22d3ee' opacity='0.6'/></svg>"
)}`;

/** The scrim each tone lays over the photo: Backstage's 60% black, and its 45% white veil in light. */
export const PHOTO_SCRIM: Record<LookMode, string> = {
  dark: 'rgb(0 0 0 / 0.6)',
  light: 'rgb(255 255 255 / 0.45)',
};
