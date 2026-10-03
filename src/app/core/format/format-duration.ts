/** "4 ms" for the status bar; below a millisecond "< 1 ms" instead of a misleading "0 ms". */
export function formatDuration(ms: number): string {
  return ms < 1 ? '< 1 ms' : `${Math.round(ms)} ms`;
}
