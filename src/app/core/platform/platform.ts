import { DOCUMENT } from '@angular/common';
import { InjectionToken, inject } from '@angular/core';

/** The parts of `Navigator` the platform check reads. `userAgentData` is Chromium only. */
export interface PlatformInfo {
  readonly platform?: string;
  readonly userAgentData?: { readonly platform?: string };
}

/**
 * Whether the user is on an Apple system, where shortcuts use ⌘ instead of
 * Ctrl. A heuristic: browsers do not report the keyboard. `userAgentData`
 * first (Chromium), the deprecated but widely supported `platform` as a
 * fallback. iPads report "MacIntel", which fits: their keyboards have ⌘.
 */
export function isApplePlatform(info: PlatformInfo | undefined): boolean {
  const platform = info?.userAgentData?.platform || info?.platform || '';
  return /^(mac|iphone|ipad|ipod|ios)/i.test(platform);
}

/** Injected rather than read globally, so tests can pick the platform. */
export const IS_APPLE_PLATFORM = new InjectionToken<boolean>('IS_APPLE_PLATFORM', {
  providedIn: 'root',
  factory: () => isApplePlatform(inject(DOCUMENT).defaultView?.navigator),
});
