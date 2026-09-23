// ===================================================================
//  ستاز الإدمان — المحور 6: الإشعارات الذكية (Smart Notifications)
//  يحترم تفضيلات المستخدم + ساعات الهدوء + الحدّ اليومي
// ===================================================================

import { db } from "@/lib/db";

export type SmartNotificationType =
  | "STREAK"
  | "MYSTERY_BOX"
  | "SOCIAL"
  | "URGENCY"
  | "REWARD"
  | "CHALLENGE"
  | "LOSS"
  | "ACHIEVEMENT"
  | "RECOMMENDATION"
  | "WELCOME_BACK";

// خريطة: نوع الإشعار → حقل التفضيل المناسب
const TYPE_TO_PREF: Record<SmartNotificationType, keyof NotificationPref> = {
  STREAK: "streakAlerts",
  MYSTERY_BOX: "mysteryBoxAlerts",
  SOCIAL: "socialAlerts",
  URGENCY: "urgencyAlerts",
  REWARD: "rewardAlerts",
  CHALLENGE: "challengeAlerts",
  LOSS: "lossAlerts",
  ACHIEVEMENT: "achievementAlerts",
  RECOMMENDATION: "recommendationAlerts",
  WELCOME_BACK: "welcomeBackAlerts",
};

interface NotificationPref {
  streakAlerts: boolean;
  mysteryBoxAlerts: boolean;
  socialAlerts: boolean;
  urgencyAlerts: boolean;
  rewardAlerts: boolean;
  challengeAlerts: boolean;
  lossAlerts: boolean;
  achievementAlerts: boolean;
  recommendationAlerts: boolean;
  welcomeBackAlerts: boolean;
  quietHoursStart: number;
  quietHoursEnd: number;
  dailyLimit: number;
}

// ===================================================================
//  sendSmartNotification — إنشاء إشعار ذكي
// ===================================================================

export interface SendNotificationInput {
  userId: string;
  type: SmartNotificationType;
  title: string;
  body: string;
  actionUrl?: string;
  icon?: string;
  expiresAt?: Date;
  /** تجاوز فحص التفضيلات (للإشعارات الحرجة) */
  force?: boolean;
}

export interface SendNotificationResult {
  sent: boolean;
  notificationId?: string;
  reason?: string;
}

export async function sendSmartNotification(
  input: SendNotificationInput
): Promise<SendNotificationResult> {
  // 1) جلب التفضيلات
  const pref = (await db.notificationPreference.upsert({
    where: { userId: input.userId },
    update: {},
    create: { userId: input.userId },
  })) as unknown as NotificationPref;

  // 2) فحص التفضيل (إذا لم يكن forced)
  if (!input.force) {
    const prefField = TYPE_TO_PREF[input.type];
    if (prefField && !pref[prefField]) {
      return { sent: false, reason: "النوع معطّل في تفضيلاتك" };
    }
  }

  // 3) فحص ساعات الهدوء (تجاوزها للإشعارات الحرجة فقط)
  const hour = new Date().getHours();
  const inQuietHours = isQuietHours(hour, pref.quietHoursStart, pref.quietHoursEnd);
  const isCritical = input.type === "URGENCY" || input.type === "LOSS";
  if (inQuietHours && !isCritical && !input.force) {
    // خلال ساعات الهدوء: نقفز الإشعار ولكن نُخزّنه (سيُرى عند فتح المركز)
    // نُنشئ السجل لكن لا يُعدّ "مُرسلاً" — نُرجع notificationId
    const created = await db.smartNotification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        actionUrl: input.actionUrl ?? null,
        icon: input.icon ?? null,
        expiresAt: input.expiresAt ?? null,
      },
    });
    return {
      sent: false,
      notificationId: created.id,
      reason: "خلال ساعات الهدوء — سيظهر عند الاستيقاظ",
    };
  }

  // 4) فحص الحدّ اليومي
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const sentToday = await db.smartNotification.count({
    where: {
      userId: input.userId,
      sentAt: { gte: todayStart },
    },
  });
  if (sentToday >= pref.dailyLimit && !input.force) {
    return { sent: false, reason: `بلغت حدّك اليومي (${pref.dailyLimit})` };
  }

  // 5) إنشاء الإشعار
  const notification = await db.smartNotification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      actionUrl: input.actionUrl ?? null,
      icon: input.icon ?? null,
      expiresAt: input.expiresAt ?? null,
    },
  });

  return { sent: true, notificationId: notification.id };
}

// ===================================================================
//  قراءات
// ===================================================================

export async function getSmartNotifications(
  userId: string,
  unreadOnly = false
) {
  return db.smartNotification.findMany({
    where: {
      userId,
      ...(unreadOnly ? { openedAt: null } : {}),
    },
    orderBy: { sentAt: "desc" },
    take: 50,
  });
}

export async function getUnreadCount(userId: string): Promise<number> {
  return db.smartNotification.count({
    where: {
      userId,
      openedAt: null,
      expiresAt: { gt: new Date() },
    },
  });
}

export async function markAsRead(notificationId: string): Promise<void> {
  await db.smartNotification.update({
    where: { id: notificationId },
    data: { openedAt: new Date() },
  });
}

export async function markAllRead(userId: string): Promise<void> {
  await db.smartNotification.updateMany({
    where: { userId, openedAt: null },
    data: { openedAt: new Date() },
  });
}

// ===================================================================
//  مساعد: فحص ساعات الهدوء (يدعم التقاطع عبر منتصف الليل)
// ===================================================================

function isQuietHours(hour: number, start: number, end: number): boolean {
  if (start === end) return false;
  // مثال: start=22, end=7 → 22-23-0-1-2-3-4-5-6
  if (start > end) {
    return hour >= start || hour < end;
  }
  // مثال: start=2, end=5
  return hour >= start && hour < end;
}
