export const TILE_PROVIDERS = {
  light: 'https://tiles.openfreemap.org/styles/positron',
  dark: 'https://tiles.openfreemap.org/styles/dark',
  bright: 'https://tiles.openfreemap.org/styles/bright',
} as const;

export async function getMapStyle(theme: 'light' | 'dark' | string): Promise<string> {
  const selectedTheme = theme === 'dark' ? 'dark' : 'light';
  try {
    // Check environment variable configuration if any, default to OpenFreeMap
    const primaryUrl = TILE_PROVIDERS[selectedTheme];
    const ping = await fetch(primaryUrl, { method: 'HEAD', mode: 'no-cors' });
    // Since fetch with HEAD and no-cors might have opaque response, if it doesn't throw, we assume it's reachable.
    return primaryUrl;
  } catch (err) {
    console.warn('⚠️ OpenFreeMap tiles unreachable, falling back to Carto. Error:', err);
  }
  return selectedTheme === 'dark'
    ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
    : 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';
}
