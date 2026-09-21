"use client";

// ===================================================================
//  بطاقة المجموعة — GroupCard
//  مكوّن عميل يعرض بيانات مجموعة واحدة مع زرّي «انضمام» / «مغادرة»
//  - يستخدم fetch للتواصل مع /api/community/groups/[id]/join و /leave
//  - يُظهر loading state على الزر أثناء الإرسال
//  - يستخدم sonner لإظهار الـtoasts
//  - زر المغادرة ملفوف بـAlertDialog للتأكيد
// ===================================================================

import * as React from "react";
import { toast } from "sonner";
import {
  Users as UsersIcon,
  UserCheck,
  LogIn,
  LogOut,
  Crown,
  Loader2,
  Lock,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// ===================================================================
//  أنواع
// ===================================================================

export interface GroupCardData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  iconEmoji: string;
  isPrivate: boolean;
  memberCount: number;
  leaderName: string | null;
}

interface GroupCardProps {
  group: GroupCardData;
  isMember: boolean;
  onJoined?: () => void;
  onLeft?: () => void;
}

// ===================================================================
//  مكوّن البطاقة
// ===================================================================

export function GroupCard({
  group,
  isMember,
  onJoined,
  onLeft,
}: GroupCardProps) {
  const [submitting, setSubmitting] = React.useState<"join" | "leave" | null>(
    null
  );
  const [memberState, setMemberState] = React.useState<boolean>(isMember);
  const [confirmOpen, setConfirmOpen] = React.useState<boolean>(false);

  // ─── الانضمام ─────────────────────────────────────────────────
  async function handleJoin() {
    setSubmitting("join");
    try {
      const res = await fetch(`/api/community/groups/${group.id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = (await res.json().catch(() => null)) as {
        error?: string;
        success?: boolean;
      } | null;
      if (!res.ok) {
        const message =
          (data?.error as string) ?? "تعذّر الانضمام إلى المجموعة";
        toast.error(message);
        return;
      }
      setMemberState(true);
      toast.success(`انضممت إلى «${group.name}»`);
      onJoined?.();
    } catch {
      toast.error("تعذّر الاتصال بالخادم، حاول مرة أخرى");
    } finally {
      setSubmitting(null);
    }
  }

  // ─── المغادرة ─────────────────────────────────────────────────
  async function handleLeave() {
    setConfirmOpen(false);
    setSubmitting("leave");
    try {
      const res = await fetch(`/api/community/groups/${group.id}/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = (await res.json().catch(() => null)) as {
        error?: string;
        success?: boolean;
      } | null;
      if (!res.ok) {
        const message =
          (data?.error as string) ?? "تعذّر مغادرة المجموعة";
        toast.error(message);
        return;
      }
      setMemberState(false);
      toast.success(`غادرت «${group.name}»`);
      onLeft?.();
    } catch {
      toast.error("تعذّر الاتصال بالخادم، حاول مرة أخرى");
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="h-full"
    >
      <Card className="warm-shadow border-border bg-card h-full flex flex-col overflow-hidden transition-all hover:border-primary/30 hover:shadow-lg">
        <CardHeader className="space-y-3 pb-3">
          <div className="flex items-start justify-between gap-2">
            <div
              className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-4xl"
              aria-hidden
            >
              {group.iconEmoji}
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <Badge
                variant="outline"
                className="bg-muted text-muted-foreground"
              >
                {group.category}
              </Badge>
              {group.isPrivate && (
                <Badge
                  variant="outline"
                  className="bg-amber-50 text-amber-700 border-amber-200"
                >
                  <Lock className="size-3" />
                  خاصة
                </Badge>
              )}
            </div>
          </div>
          <CardTitle className="font-heading text-lg font-bold text-foreground">
            {group.name}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
            {group.description ?? "مجموعة من أبناء الحي"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3 mt-auto p-6 pt-0">
          {/* معلومات الأعضاء والرئيس */}
          <div className="space-y-1.5 text-xs text-muted-foreground border-t border-border pt-3">
            <p className="flex items-center gap-1.5">
              <UsersIcon className="size-3.5 text-primary" />
              <span>
                <span className="font-medium text-foreground">
                  {group.memberCount}
                </span>{" "}
                عضو
              </span>
            </p>
            {group.leaderName && (
              <p className="flex items-center gap-1.5">
                <Crown className="size-3.5 text-accent" />
                <span>رئيس المجموعة: {group.leaderName}</span>
              </p>
            )}
          </div>

          {/* زر أو شارة */}
          <div className="pt-1">
            {memberState ? (
              <div className="flex gap-2">
                <Badge
                  variant="outline"
                  className="flex-1 bg-secondary/10 text-secondary border-secondary/30 justify-center py-2.5 text-sm"
                >
                  <UserCheck className="size-4" />
                  أنت عضو
                </Badge>
                <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-11 w-11 shrink-0"
                      disabled={submitting !== null}
                      aria-label={`مغادرة ${group.name}`}
                    >
                      {submitting === "leave" ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <LogOut className="size-4" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        مغادرة «{group.name}»؟
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        لن تتلقّى إشعارات المجموعة بعد الآن. يمكنك الانضمام
                        مجدداً في أي وقت.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="h-11">
                        إلغاء
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleLeave}
                        className="h-11 bg-rose-600 text-white hover:bg-rose-700"
                      >
                        مغادرة
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ) : (
              <Button
                variant="default"
                size="sm"
                className="h-11 w-full"
                onClick={handleJoin}
                disabled={submitting !== null}
                aria-label={`الانضمام إلى ${group.name}`}
              >
                {submitting === "join" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <LogIn className="size-4" />
                )}
                <span>انضمام</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
