'use client';

import { useEffect, useState } from 'react';

export interface DeviceFingerprint {
  fingerprint_hash: string;
  user_agent: string;
  network_type: string | null;
  is_vpn: boolean;
}

/** Simple FNV-1a 32-bit hash — no crypto dep needed */
function fnv1a(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (Math.imul(hash, 0x01000193) >>> 0);
  }
  return hash.toString(16).padStart(8, '0');
}

export function useDeviceFingerprint(): DeviceFingerprint | null {
  const [fp, setFp] = useState<DeviceFingerprint | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ua = navigator.userAgent;
    const screen_res = `${screen.width}x${screen.height}`;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const lang = navigator.language;

    const raw = `${ua}|${screen_res}|${tz}|${lang}`;
    const hash = fnv1a(raw);

    // @ts-ignore — navigator.connection is not in all TS lib defs
    const conn = (navigator as any).connection;
    const network_type: string | null = conn?.effectiveType ?? conn?.type ?? null;

    setFp({
      fingerprint_hash: hash,
      user_agent: ua,
      network_type,
      is_vpn: false, // browser JS cannot detect VPN — left for future API check
    });
  }, []);

  return fp;
}
