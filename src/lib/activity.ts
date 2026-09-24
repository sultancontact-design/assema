// ===================================================================
//  lib/activity.ts — نظام موحّد لإنشاء نشاطات متطابقة
// ===================================================================

import { db } from "@/lib/db";

export type ActivityType =
  | "CONTRIBUTION"
  | "FUND_REQUEST"
  | "EVENT_REGISTER"
  | "BADGE_EARNED"
  | "GROUP_JOIN"
  | "LOGIN"
  | "STREAK_MILESTONE"
  | "DISCUSSION_CREATED"
  | "INITIATIVE_CREATED";

interface ActivityMeta {
  amount?: number;
  eventTitle?: string;
  badgeName?: string;
  groupName?: string;
  streakDays?: number;
  discussionTitle?: string;
  initiativeTitle?: string;
}

const ACTIVITY_MESSAGES: Record<ActivityType, (name: string, meta?: ActivityMeta) => string> = {
  CONTRIBUTION: (name, meta) => `${name} — ساهم بـ${meta?.amount ?? 50} درهم`,
  FUND_REQUEST: (name) => `${name} — قدّم طلب معروف`,
  EVENT_REGISTER: (name, meta) => `${name} — سجّل في فعالية "${meta?.eventTitle ?? "ملتقى الحي"}"`,
  BADGE_EARNED: (name, meta) => `${name} — حصل على شارة "${meta?.badgeName ?? "نشط"}"`,
  GROUP_JOIN: (name, meta) => `${name} — انضم لمجموعة "${meta?.groupName ?? "المجموعة"}"`,
  LOGIN: (name) => `${name} — سجّل الدخول`,
  STREAK_MILESTONE: (name, meta) => `${name} — أكمل ${meta?.streakDays ?? 7} أيام متتالية`,
  DISCUSSION_CREATED: (name, meta) => `${name} — فتح نقاش "${meta?.discussionTitle ?? "موضوع"}"`,
  INITIATIVE_CREATED: (name, meta) => `${name} — اقترح مبادرة "${meta?.initiativeTitle ?? "جديدة"}"`,
};

export async function createActivity(
  type: ActivityType,
  userId: string,
  userFullName: string,
  meta?: ActivityMeta,
  isPublic = true
) {
  const description = ACTIVITY_MESSAGES[type](userFullName, meta);
  return db.userActivity.create({
    data: {
      type,
      description,
      userId,
      metadata: meta ? JSON.stringify(meta) : null,
      isPublic,
    },
  });
}
