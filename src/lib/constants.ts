// ===================================================================
//  ثوابت المنصة — سيدي يوسف بن علي العاصمة
//  كل القيم الديناميكية بالعربية الفصحى/المغربية
// ===================================================================

import type {
  ContributionMethod,
  ContributionStatus,
  FundRequestType,
  FundRequestStatus,
  EventType,
  EventStatus,
  Role,
  UserStatus,
  ApprovalDecision,
  RegistrationStatus,
  NotificationType,
  ComplaintType,
  ComplaintStatus,
  AdStatus,
  AdPackage,
} from "@prisma/client";

// ===================================================================
//  خرائط العرض العربية (Display labels) لكل Enum
//  الاستخدام: ROLE_LABELS[role], FUND_REQUEST_TYPE_LABELS[type]
// ===================================================================

export const ROLE_LABELS: Record<Role, { label: string; description: string }> = {
  GUEST: { label: "زائر", description: "زائر غير مسجّل، يصلح للاطّلاع العام فقط" },
  MEMBER: { label: "عضو", description: "عضو مسجّل في حيّه، يحقّ له المساهمة وطلب المعروف" },
  GROUP_LEADER: { label: "رئيس مجموعة", description: "مشرف على مجموعة اهتمام داخل الحي" },
  DISTRICT_MOD: { label: "مشرف الحي", description: "مشرف على حي كامل، يدير المحتوى والأعضاء" },
  TREASURER: { label: "أمين الصندوق", description: "مسؤول عن الصندوق، يصادق على المساهمات والصرف" },
  ETHICS_COMMITTEE: { label: "لجنة النزاهة", description: "عضو لجنة، يصوّت على الطلبات فوق 1000 درهم" },
  SUPER_ADMIN: { label: "مشرف عام", description: "صلاحيات كاملة على المنصة" },
  ADS_MANAGER: { label: "مسؤول الإعلانات", description: "مسؤول عن إدارة الإعلانات والرعايات" },
};

export const ROLE_VALUES = Object.keys(ROLE_LABELS) as Role[];

// ترتيب الصلاحيات (مستوى الهرمية)
export const ROLE_HIERARCHY: Record<Role, number> = {
  GUEST: 0,
  MEMBER: 10,
  GROUP_LEADER: 20,
  ADS_MANAGER: 25,
  ETHICS_COMMITTEE: 30,
  TREASURER: 35,
  DISTRICT_MOD: 40,
  SUPER_ADMIN: 100,
};

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: "نشط",
  PENDING: "بانتظار التحقق",
  SUSPENDED: "موقوف مؤقتاً",
  DISABLED: "معطّل",
};

// ─────────── صندوق المعروف ───────────

export const CONTRIBUTION_METHOD_LABELS: Record<ContributionMethod, string> = {
  BANK_TRANSFER: "تحويل بنكي",
  CASH: "نقداً عبر أمين الصندوق",
  CMI: "CMI (بطاقة بنكية)",
};

export const CONTRIBUTION_STATUS_LABELS: Record<ContributionStatus, string> = {
  PENDING: "بانتظار التأكيد",
  CONFIRMED: "مؤكَّد",
  REJECTED: "مرفوض",
  REFUNDED: "مُعاد",
};

export const FUND_REQUEST_TYPE_LABELS: Record<
  FundRequestType,
  { label: string; emoji: string; color: string; description: string }
> = {
  MEDICAL: {
    label: "مرض",
    emoji: "🩺",
    color: "rose",
    description: "مساعدة طبية (دواء، مستشفى، عملية)",
  },
  DEATH: {
    label: "وفاة",
    emoji: "🕊️",
    color: "slate",
    description: "مساعدة في مصاريف الجنازة والتعزية",
  },
  WEDDING: {
    label: "عرس",
    emoji: "💍",
    color: "amber",
    description: "مساعدة أسرة معوزة في إتمام عرس ابنها/ابنتها",
  },
  EDUCATION: {
    label: "تعليم",
    emoji: "📚",
    color: "blue",
    description: "رسوم دراسية، كتب، أدوات مدرسية",
  },
  EMERGENCY: {
    label: "طوارئ",
    emoji: "🚨",
    color: "red",
    description: "حريق، طرد من السكن، كارثة",
  },
  MICRO_PROJECT: {
    label: "مشروع صغير",
    emoji: "🌱",
    color: "emerald",
    description: "قرض حسن بدون فوائد لمشروع مدٍّ للدخل",
  },
};

export const FUND_REQUEST_STATUS_LABELS: Record<
  FundRequestStatus,
  { label: string; color: string; step: number }
> = {
  SUBMITTED: { label: "مُقدَّم", color: "slate", step: 1 },
  UNDER_REVIEW: { label: "قيد المراجعة", color: "amber", step: 2 },
  APPROVED: { label: "موافَق عليه", color: "blue", step: 3 },
  REJECTED: { label: "مرفوض", color: "rose", step: 0 },
  DISBURSED: { label: "مَصروف", color: "emerald", step: 4 },
  COMPLETED: { label: "مكتمل", color: "secondary", step: 5 },
};

export const APPROVAL_DECISION_LABELS: Record<ApprovalDecision, string> = {
  APPROVE: "موافقة",
  REJECT: "رفض",
  ABSTAIN: "امتناع",
};

// ─────────── الفعاليات ───────────

export const EVENT_TYPE_LABELS: Record<EventType, { label: string; emoji: string }> = {
  MONTHLY: { label: "شهري", emoji: "📅" },
  SEASONAL: { label: "موسمي", emoji: "🌙" },
  SPECIAL: { label: "خاص", emoji: "✨" },
  SOLIDARITY: { label: "تضامني", emoji: "🤝" },
  CULTURAL: { label: "ثقافي", emoji: "🎭" },
};

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  DRAFT: "مسودة",
  PUBLISHED: "منشور",
  ONGOING: "جارٍ الآن",
  COMPLETED: "مكتمل",
  CANCELLED: "ملغى",
};

export const REGISTRATION_STATUS_LABELS: Record<RegistrationStatus, string> = {
  REGISTERED: "مسجَّل",
  ATTENDED: "حاضر",
  CANCELLED: "ألغى",
  NO_SHOW: "لم يحضر",
};

// ─────────── الإشعارات ───────────

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  SYSTEM: "نظام",
  CONTRIBUTION: "صندوق المعروف",
  FUND_REQUEST: "طلب معروف",
  EVENT: "فعالية",
  GROUP: "مجموعة",
  COMPLAINT: "شكوى",
  ANNOUNCEMENT: "إعلان عام",
};

// ─────────── الشكاوى ───────────

export const COMPLAINT_TYPE_LABELS: Record<ComplaintType, string> = {
  FINANCIAL: "مالية",
  BEHAVIORAL: "سلوكية",
  TECHNICAL: "تقنية",
  SUGGESTION: "اقتراح",
  OTHER: "أخرى",
};

export const COMPLAINT_STATUS_LABELS: Record<ComplaintStatus, string> = {
  OPEN: "مفتوحة",
  IN_PROGRESS: "قيد المعالجة",
  RESOLVED: "تم حلّها",
  CLOSED: "مغلقة",
  REJECTED: "مرفوضة",
};

export const COMPLAINT_PRIORITY_LABELS: Record<string, string> = {
  low: "منخفضة",
  normal: "عادية",
  high: "مرتفعة",
  urgent: "عاجلة",
};

// ─────────── الإعلانات ───────────

export const AD_STATUS_LABELS: Record<AdStatus, string> = {
  DRAFT: "مسودة",
  PENDING: "بانتظار الموافقة",
  ACTIVE: "نشط",
  PAUSED: "متوقّف مؤقتاً",
  EXPIRED: "منتهٍ",
  REJECTED: "مرفوض",
};

export const AD_PACKAGE_LABELS: Record<AdPackage, { label: string; price: number; duration: string }> = {
  BRONZE: { label: "برونزية", price: 300, duration: "شهر" },
  SILVER: { label: "فضية", price: 600, duration: "شهر" },
  GOLD: { label: "ذهبية", price: 1200, duration: "شهر" },
  PLATINUM: { label: "بلاتينية", price: 3000, duration: "3 أشهر" },
  SPONSOR: { label: "راعي رسمي", price: 10000, duration: "سنة" },
};

export const AD_PLACEMENT_LABELS: Record<string, string> = {
  header: "رأس الصفحة (Leaderboard)",
  sidebar: "الشريط الجانبي",
  "in-feed": "داخل التغذية",
  "in-article": "داخل المقال",
  footer: "أسفل الصفحة",
  popup: "نافذة منبثقة",
  sticky: "شريط لاصق",
  "event-page": "صفحة الفعالية",
  "group-page": "صفحة المجموعة",
  "market-page": "صفحة السوق",
  newsletter: "النشرة البريدية",
};

// ===================================================================
//  ثوابت الصندوق
// ===================================================================

// المبلغ الذي يتطلّب موافقة لجنة النزاهة
export const ETHICS_COMMITTEE_THRESHOLD = 1000;

// أقصى مدة للصرف (ساعات)
export const DISBURSEMENT_DEADLINE_HOURS = 72;

// قفف المساهمة الشهرية المتاحة (درهم)
export const CONTRIBUTION_TIERS = [10, 20, 50, 100, 200] as const;

// ===================================================================
//  أهداف المرحلة الأولى (مؤشرات النجاح)
// ===================================================================

export const GROWTH_TARGETS = {
  families: 500,        // هدف 500 أسرة مسجّلة
  monthlyContributions: 100, // 100 مساهمة شهرية
  events: 10,           // 10 فعاليات منظمة
  marketListings: 50,   // 50 إعلان في السوق المحلي
  monthlyGrowth: 20,    // نمو 20% شهرياً لمدة 3 أشهر
} as const;

// ===================================================================
//  المجموعات الافتراضية
// ===================================================================

export const DEFAULT_GROUPS = [
  {
    name: "مجموعة الأمهات",
    slug: "mothers",
    category: "عائلي",
    description: "تنسيق، وصفات، تربية، ودعم بين الأمهات في الحي",
  },
  {
    name: "مجموعة الآباء",
    slug: "fathers",
    category: "عائلي",
    description: "عمل، مسؤولية، تربية، وتبادل الخبرات بين الآباء",
  },
  {
    name: "مجموعة الشباب",
    slug: "youth",
    category: "تنمية",
    description: "رياضة، تكوين، مشاريع، وتبادل الأفكار بين الشباب",
  },
  {
    name: "مجموعة الأطفال",
    slug: "children",
    category: "تعليم",
    description: "مسابقات، تعلّم، ألعاب — بإشراف الأمهات",
  },
  {
    name: "مجموعة كبار السن",
    slug: "elders",
    category: "تراث",
    description: "ذكريات الحي، حكمة، ودعم بين كبار السن",
  },
] as const;

// ===================================================================
//  المبادئ الخمسة
// ===================================================================

export const PRINCIPLES = [
  {
    id: "dignity",
    title: "الكرامة أولاً",
    description:
      "لا نكشف أسماء المستفيدين في العلن. كل طلب يُعالَج بحفظ الكرامة والسرية التامة.",
  },
  {
    id: "transparency",
    title: "الشفافية الكاملة",
    description:
      "لوحة عامة تُظهر إجمالي المساهمات والصرف والرصيد. كل درهم له إيصال رقمي قابل للتحميل.",
  },
  {
    id: "sustainability",
    title: "الاستدامة",
    description:
      "نبدأ مجاناً 100%، نُثبت الفكرة، ثم ننتقل للمدفوع بعد تحقيق مؤشرات النجاح.",
  },
  {
    id: "expansion",
    title: "من حي إلى عاصمة",
    description:
      "نبدأ بسيدي يوسف بن علي، ثم نتوسّع لأحياء مراكش أخرى، ثم لمدن المغرب كلها.",
  },
  {
    id: "maarouf",
    title: "المعروف المغربي",
    description:
      "رقمنة صندوق الأفراح والأتراح التقليدي بروح الجماعة والدّين المتين.",
  },
] as const;

// ===================================================================
//  معلومات الحي الرئيسي
// ===================================================================

export const HOME_DISTRICT = {
  name: "سيدي يوسف بن علي",
  city: "مراكش",
  region: "مراكش آسفي",
  population: 125000, // عدد سكان الحي التقريبي
  tagline: "حي عريق يحتضن أسراً مغربية أصيلة تجمعها رابطة المعروف",
} as const;

// ===================================================================
//  المنصب الرسمي
// ===================================================================

export const SITE = {
  name: "سيدي يوسف بن علي العاصمة",
  tagline: "من حي إلى عاصمة... المعروف الرقمي",
  description:
    "منصة ويب اجتماعية تضامنية لرقمنة المعروف المغربي في حي سيدي يوسف بن علي بمراكش.",
  email: "contact@syba-community.ma",
  phone: "+212 5XX-XXXXXX",
  address: "حي سيدي يوسف بن علي، مراكش، المغرب",
  locale: "ar_MA",
  currency: "MAD", // درهم مغربي
  timezone: "Africa/Casablanca",
} as const;

// ===================================================================
//  قوالب المساعدات (للأرقام الكبيرة)
// ===================================================================

/** تنسيق المبلغ بالدرهم المغربي */
export function formatMAD(amount: number): string {
  return new Intl.NumberFormat("ar-MA", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount) + " د.م";
}

/** تنسيق المبلغ بدون "د.م" (للأماكن المختصرة) */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("ar-MA").format(value);
}

/** تنسيق التاريخ بالعربية */
export function formatDateArabic(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("ar-MA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

/** تنسيق التاريخ والوقت */
export function formatDateTimeArabic(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("ar-MA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/** تنسيق نسبة (للرسوم البيانية) */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}
