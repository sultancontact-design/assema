// ===================================================================
//  CookieConsent — بانر موافقة الكوكيز (CNDP — القانون 09-08)
//  - يظهر عند أول زيارة (يفحص localStorage لـ "cookie-consent")
//  - يظهر في أسفل الصفحة
//  - 3 خيارات: قبول الكل، رفض غير الضروري، تخصيص
//  - "تخصيص" يفتح Dialog مع toggles لكل نوع كوكيز
//  - يُحفظ القرار 30 يوماً
// ===================================================================

"use client";

import * as React from "react";
import Link from "next/link";
import { Cookie, ShieldCheck, Settings2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const STORAGE_KEY = "cookie-consent";
const STORAGE_DATE_KEY = "cookie-consent-date";
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

interface CookieChoice {
  level: "all" | "necessary" | "custom";
  necessary: boolean; // ضروري — لا يُمكن إيقافه
  preferences: boolean;
  analytics: boolean;
}

const DEFAULT_CHOICE: CookieChoice = {
  level: "necessary",
  necessary: true,
  preferences: false,
  analytics: false,
};

const FULL_CHOICE: CookieChoice = {
  level: "all",
  necessary: true,
  preferences: true,
  analytics: true,
};

const COOKIE_TYPES: Array<{
  key: "necessary" | "preferences" | "analytics";
  title: string;
  description: string;
  alwaysOn?: boolean;
}> = [
  {
    key: "necessary",
    title: "كوكيز ضرورية",
    description:
      "جلسة المصادقة، رمز CSRF، تفضيل اللغة. لا تعمل المنصة بدونها.",
    alwaysOn: true,
  },
  {
    key: "preferences",
    title: "كوكيز التفضيلات",
    description:
      "حفظ الوضع (فاتح/داكن)، تفضيلات الإشعارات، قرار الكوكيز نفسه.",
  },
  {
    key: "analytics",
    title: "كوكيز إحصائية",
    description:
      "إحصاءات مجمّعة (Plausible / Vercel Analytics). لا تتبّع فردي.",
  },
];

function readStoredChoice(): CookieChoice | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const date = window.localStorage.getItem(STORAGE_DATE_KEY);
    if (!raw || !date) return null;

    const parsed = JSON.parse(raw) as Partial<CookieChoice> | null;
    if (!parsed) return null;

    // فحص 30 يوماً
    const storedAt = Number(date);
    if (!Number.isFinite(storedAt)) return null;
    if (Date.now() - storedAt > THIRTY_DAYS_MS) return null;

    return {
      level: parsed.level === "all" ? "all" : parsed.level === "custom" ? "custom" : "necessary",
      necessary: true,
      preferences: !!parsed.preferences,
      analytics: !!parsed.analytics,
    };
  } catch {
    return null;
  }
}

function persistChoice(choice: CookieChoice) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(choice));
    window.localStorage.setItem(STORAGE_DATE_KEY, String(Date.now()));
  } catch {
    // تجاهل
  }
}

export function CookieConsent() {
  const [visible, setVisible] = React.useState(false);
  const [customOpen, setCustomOpen] = React.useState(false);
  const [choice, setChoice] = React.useState<CookieChoice>(DEFAULT_CHOICE);

  // قراءة الحالة المخزّنة عند التحميل
  React.useEffect(() => {
    const stored = readStoredChoice();
    if (!stored) {
      // أجّل ظهور البانر بقليل لتفادي وميض
      const t = window.setTimeout(() => setVisible(true), 600);
      return () => window.clearTimeout(t);
    }
    setChoice(stored);
  }, []);

  function acceptAll() {
    persistChoice(FULL_CHOICE);
    setChoice(FULL_CHOICE);
    setVisible(false);
  }

  function acceptNecessaryOnly() {
    const c: CookieChoice = { ...DEFAULT_CHOICE, level: "necessary" };
    persistChoice(c);
    setChoice(c);
    setVisible(false);
  }

  function applyCustom() {
    const c: CookieChoice = {
      ...choice,
      level: "custom",
      necessary: true, // ضروري دائماً
    };
    persistChoice(c);
    setChoice(c);
    setCustomOpen(false);
    setVisible(false);
  }

  return (
    <>
      {/* البانر */}
      <AnimatePresence>
        {visible && (
          <motion.div
            key="cookie-banner"
            initial={{ opacity: 0, y: 40, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 40, filter: "blur(4px)" }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]"
            role="dialog"
            aria-live="polite"
            aria-label="بانر الموافقة على ملفات تعريف الارتباط"
          >
            <div className="mx-auto max-w-4xl rounded-xl border border-border bg-background/95 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/90">
              <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-6">
                {/* الأيقونة + النص */}
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                    <Cookie className="size-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground leading-relaxed">
                      🍪 نستخدم ملفات تعريف الارتباط لتحسين تجربتك. اقرأ{" "}
                      <Link
                        href="/privacy-policy"
                        className="text-primary underline underline-offset-2"
                      >
                        سياسة الخصوصية
                      </Link>
                      .
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      نحترم خصوصيتك — لا تتبّع فردي، لا إعلانات cross-site.
                    </p>
                  </div>
                </div>

                {/* الأزرار */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 shrink-0">
                  <Button
                    onClick={acceptAll}
                    size="sm"
                    className="h-11 sm:min-w-[140px] bg-secondary text-secondary-foreground hover:bg-secondary/90"
                  >
                    <ShieldCheck className="size-4" />
                    قبول الكل
                  </Button>
                  <Button
                    onClick={acceptNecessaryOnly}
                    size="sm"
                    variant="outline"
                    className="h-11 sm:min-w-[160px]"
                  >
                    رفض غير الضروري
                  </Button>
                  <Dialog open={customOpen} onOpenChange={setCustomOpen}>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="link"
                        className="h-11 sm:min-w-[80px] text-primary"
                      >
                        <Settings2 className="size-4" />
                        تخصيص
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                      <DialogHeader>
                        <DialogTitle className="text-start font-heading text-lg">
                          تخصيص الكوكيز
                        </DialogTitle>
                        <DialogDescription className="text-start">
                          اختر أنواع الكوكيز التي تسمح بها. الكوكيز الضرورية
                          لا يمكن إيقافها.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-3 py-2">
                        {COOKIE_TYPES.map((c) => {
                          const checked =
                            c.key === "necessary"
                              ? true
                              : choice[c.key];
                          return (
                            <div
                              key={c.key}
                              className={`flex items-start gap-3 rounded-lg border ${
                                c.alwaysOn
                                  ? "border-muted bg-muted/40"
                                  : "border-border"
                              } p-3`}
                            >
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                  <Label
                                    htmlFor={`cookie-${c.key}`}
                                    className="text-sm font-medium text-foreground"
                                  >
                                    {c.title}
                                  </Label>
                                  {c.alwaysOn && (
                                    <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] text-secondary">
                                      ضروري
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {c.description}
                                </p>
                              </div>
                              <Switch
                                id={`cookie-${c.key}`}
                                checked={checked}
                                disabled={c.alwaysOn}
                                onCheckedChange={(val) =>
                                  setChoice((prev) => ({
                                    ...prev,
                                    [c.key]: val,
                                  }))
                                }
                                aria-label={c.title}
                              />
                            </div>
                          );
                        })}
                      </div>

                      <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between gap-2">
                        <Button
                          onClick={acceptNecessaryOnly}
                          variant="ghost"
                          size="sm"
                          className="h-11"
                        >
                          رفض الكل غير الضروري
                        </Button>
                        <div className="flex gap-2">
                          <Button
                            onClick={acceptAll}
                            variant="outline"
                            size="sm"
                            className="h-11"
                          >
                            قبول الكل
                          </Button>
                          <Button
                            onClick={applyCustom}
                            size="sm"
                            className="h-11 bg-secondary text-secondary-foreground hover:bg-secondary/90"
                          >
                            حفظ اختياراتي
                          </Button>
                        </div>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* زر إغلاق صغير (مؤجّل) */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={acceptNecessaryOnly}
                  aria-label="إغلاق البانر"
                  className="hidden sm:inline-flex absolute top-2 end-2 size-7 text-muted-foreground"
                  tabIndex={-1}
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
