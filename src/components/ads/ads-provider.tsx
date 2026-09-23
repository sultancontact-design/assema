"use client";

// ===================================================================
//  AdsProvider — مزوّد سياق الإعلانات (client)
//  - يحمل إعدادات Google AdSense (active, publisherId, testMode)
//  - يحمل خريطة slot IDs لكل موضع إعلاني
//  - يُمرَّر من RootLayout (server) إلى المكوّنات العميلية
//  - AdPlacement يستهلكه عبر useAds()
// ===================================================================

import * as React from "react";

export type AdPlacementType =
  | "header-leaderboard"
  | "sidebar-top"
  | "sidebar-bottom"
  | "in-feed"
  | "in-article"
  | "footer-banner";

export interface AdsContextValue {
  /** هل AdSense مفعّل؟ (active=true AND publisherId غير فارغ) */
  active: boolean;
  /** معرّف الناشر (ca-pub-…). فارغ لو لم يُضبط */
  publisherId: string;
  /** وضع التجربة (لا إعلانات حقيقية) */
  testMode: boolean;
  /** خريطة slot IDs حسب الموضع (من إعدادات Setting) */
  slots: Partial<Record<AdPlacementType, string>>;
}

const AdsContext = React.createContext<AdsContextValue>({
  active: false,
  publisherId: "",
  testMode: false,
  slots: {},
});

interface AdsProviderProps extends AdsContextValue {
  children: React.ReactNode;
}

export function AdsProvider({
  active,
  publisherId,
  testMode,
  slots,
  children,
}: AdsProviderProps) {
  const value = React.useMemo<AdsContextValue>(
    () => ({ active, publisherId, testMode, slots }),
    [active, publisherId, testMode, slots]
  );
  return <AdsContext.Provider value={value}>{children}</AdsContext.Provider>;
}

export function useAds(): AdsContextValue {
  return React.useContext(AdsContext);
}

export default AdsProvider;
