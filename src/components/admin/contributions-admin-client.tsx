"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Tag,
  Star,
  Calendar,
  Heart,
  Inbox,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";

type ContribType = "priceReport" | "serviceReview" | "eventProposal" | "story";

interface BaseContrib {
  id: string;
  status: string;
  createdAt: string;
  reviewedAt: string | null;
  adminNote: string | null;
}

interface PriceReportItem extends BaseContrib {
  type: "priceReport";
  productNameAr: string;
  productName: string;
  category: string;
  price: number;
  unit: string;
  marketName: string | null;
  notes: string | null;
  user?: { fullName: string };
}

interface ServiceReviewItem extends BaseContrib {
  type: "serviceReview";
  title: string;
  body: string;
  rating: number;
  service?: { title: string };
  user?: { fullName: string };
}

interface EventProposalItem extends BaseContrib {
  type: "eventProposal";
  title: string;
  description: string;
  proposedDate: string;
  location: string | null;
  expectedAttendees: number | null;
  budget: number | null;
  user?: { fullName: string };
}

interface StoryItem extends BaseContrib {
  type: "story";
  title: string;
  body: string;
  consentGiven: boolean;
  anonymize: boolean;
  user?: { fullName: string };
}

type ContribItem =
  | PriceReportItem
  | ServiceReviewItem
  | EventProposalItem
  | StoryItem;

interface Props {
  data: {
    priceReports: PriceReportItem[];
    serviceReviews: ServiceReviewItem[];
    eventProposals: EventProposalItem[];
    stories: StoryItem[];
  };
}

const TYPE_LABELS: Record<ContribType, string> = {
  priceReport: "تقرير سعر",
  serviceReview: "تقييم خدمة",
  eventProposal: "اقتراح فعالية",
  story: "قصة نجاح",
};

const TYPE_ICONS = {
  priceReport: Tag,
  serviceReview: Star,
  eventProposal: Calendar,
  story: Heart,
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "قيد المراجعة",
  APPROVED: "مقبول",
  REJECTED: "مرفوض",
  FLAGGED: "مُعلَّم",
  CONVERTED: "حوّل لحدث",
  PUBLISHED: "نُشر",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 border-amber-200",
  APPROVED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  REJECTED: "bg-red-100 text-red-800 border-red-200",
  FLAGGED: "bg-orange-100 text-orange-800 border-orange-200",
  CONVERTED: "bg-blue-100 text-blue-800 border-blue-200",
  PUBLISHED: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

export function ContributionsAdminClient({ data }: Props) {
  const [activeType, setActiveType] = React.useState<ContribType>("priceReport");
  const [filter, setFilter] = React.useState("PENDING");
  const [items, setItems] = React.useState(data);
  const [processing, setProcessing] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<ContribItem | null>(null);
  const [newStatus, setNewStatus] = React.useState("APPROVED");
  const [adminNote, setAdminNote] = React.useState("");

  const getCurrentItems = (): ContribItem[] => {
    switch (activeType) {
      case "priceReport":
        return items.priceReports;
      case "serviceReview":
        return items.serviceReviews;
      case "eventProposal":
        return items.eventProposals;
      case "story":
        return items.stories;
    }
  };

  const currentItems = getCurrentItems();
  const filtered = filter === "ALL"
    ? currentItems
    : currentItems.filter((i) => i.status === filter);

  const countBy = (arr: ContribItem[], status: string) =>
    arr.filter((i) => i.status === status).length;

  const counts = {
    priceReport: items.priceReports.length,
    serviceReview: items.serviceReviews.length,
    eventProposal: items.eventProposals.length,
    story: items.stories.length,
  };

  const pendingTotal =
    countBy(items.priceReports, "PENDING") +
    countBy(items.serviceReviews, "PENDING") +
    countBy(items.eventProposals, "PENDING") +
    countBy(items.stories, "PENDING");

  const openReview = (item: ContribItem) => {
    setSelected(item);
    setNewStatus(item.status === "PENDING" ? "APPROVED" : item.status);
    setAdminNote(item.adminNote ?? "");
  };

  const submitReview = async () => {
    if (!selected) return;
    setProcessing(selected.id);
    try {
      // camelCase → kebab-case for URL
      const kebabType = selected.type
        .replace(/([A-Z])/g, "-$1")
        .toLowerCase()
        .replace(/^-/, "");
      const res = await fetch(
        `/api/admin/contributions/review/${kebabType}/${selected.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: newStatus,
            adminNote,
          }),
        },
      );
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error ?? "فشل التحديث");
        setProcessing(null);
        return;
      }
      const data = await res.json();

      // Update local state
      setItems((prev) => {
        const updated = data.item;
        switch (selected.type) {
          case "priceReport":
            return {
              ...prev,
              priceReports: prev.priceReports.map((i) =>
                i.id === selected.id ? { ...i, ...updated } : i,
              ),
            };
          case "serviceReview":
            return {
              ...prev,
              serviceReviews: prev.serviceReviews.map((i) =>
                i.id === selected.id ? { ...i, ...updated } : i,
              ),
            };
          case "eventProposal":
            return {
              ...prev,
              eventProposals: prev.eventProposals.map((i) =>
                i.id === selected.id ? { ...i, ...updated } : i,
              ),
            };
          case "story":
            return {
              ...prev,
              stories: prev.stories.map((i) =>
                i.id === selected.id ? { ...i, ...updated } : i,
              ),
            };
        }
      });
      setSelected(null);
      toast.success("حُدّثت حالة المساهمة");
    } catch {
      toast.error("فشل الاتصال");
    }
    setProcessing(null);
  };

  const renderItemDetails = (item: ContribItem) => {
    switch (item.type) {
      case "priceReport":
        return (
          <div className="space-y-1 text-sm">
            <p><span className="font-bold">المنتج:</span> {item.productNameAr} ({item.productName})</p>
            <p><span className="font-bold">السعر:</span> {item.price} {item.unit}</p>
            <p><span className="font-bold">الفئة:</span> {item.category}</p>
            {item.marketName && <p><span className="font-bold">السوق:</span> {item.marketName}</p>}
            {item.notes && <p><span className="font-bold">ملاحظات:</span> {item.notes}</p>}
          </div>
        );
      case "serviceReview":
        return (
          <div className="space-y-1 text-sm">
            <p><span className="font-bold">الخدمة:</span> {item.service?.title ?? "—"}</p>
            <p><span className="font-bold">التقييم:</span> {"⭐".repeat(item.rating)} ({item.rating}/5)</p>
            <p className="font-bold">{item.title}</p>
            <p>{item.body}</p>
          </div>
        );
      case "eventProposal":
        return (
          <div className="space-y-1 text-sm">
            <p className="font-bold">{item.title}</p>
            <p>{item.description}</p>
            <p><span className="font-bold">التاريخ المقترح:</span> {new Date(item.proposedDate).toLocaleDateString("ar-MA")}</p>
            {item.location && <p><span className="font-bold">المكان:</span> {item.location}</p>}
            {item.expectedAttendees && <p><span className="font-bold">المتوقع حضوره:</span> {item.expectedAttendees}</p>}
            {item.budget && <p><span className="font-bold">الميزانية:</span> {item.budget} د.م</p>}
          </div>
        );
      case "story":
        return (
          <div className="space-y-1 text-sm">
            <p className="font-bold">{item.title}</p>
            <p className="whitespace-pre-wrap">{item.body}</p>
            <div className="flex gap-3 text-xs text-muted-foreground pt-2">
              <span>الموافقة على النشر: {item.consentGiven ? "✅" : "❌"}</span>
              <span>النشر المجهول: {item.anonymize ? "نعم" : "لا"}</span>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <header className="mb-6">
        <h1 className="font-heading text-2xl font-bold mb-1 flex items-center gap-2">
          <Inbox className="size-7 text-primary" />
          <span>مراجعة مساهمات المستخدمين</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          {pendingTotal > 0
            ? `${pendingTotal} مساهمة قيد المراجعة — تنتظر قرارك.`
            : "كل المساهمات مُراجَعة. أحسنت."}
        </p>
      </header>

      {/* Type tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {(Object.keys(TYPE_LABELS) as ContribType[]).map((type) => {
          const Icon = TYPE_ICONS[type];
          const pending = countBy(
            type === "priceReport"
              ? items.priceReports
              : type === "serviceReview"
                ? items.serviceReviews
                : type === "eventProposal"
                  ? items.eventProposals
                  : items.stories,
            "PENDING",
          );
          return (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`p-3 rounded-md border text-sm transition-all flex items-center justify-between gap-2 ${
                activeType === type
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border hover:border-primary/30"
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon className="size-4" />
                <span className="font-medium">{TYPE_LABELS[type]}</span>
              </div>
              {pending > 0 && (
                <Badge className="bg-amber-500 text-amber-50 text-[10px]">
                  {pending}
                </Badge>
              )}
            </button>
          );
        })}
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setFilter("PENDING")}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            filter === "PENDING" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"
          }`}
        >
          قيد المراجعة ({countBy(currentItems, "PENDING")})
        </button>
        <button
          onClick={() => setFilter("APPROVED")}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            filter === "APPROVED" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"
          }`}
        >
          مقبولة ({countBy(currentItems, "APPROVED")})
        </button>
        <button
          onClick={() => setFilter("REJECTED")}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            filter === "REJECTED" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"
          }`}
        >
          مرفوضة ({countBy(currentItems, "REJECTED")})
        </button>
        <button
          onClick={() => setFilter("ALL")}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            filter === "ALL" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"
          }`}
        >
          الكل ({currentItems.length})
        </button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <AlertCircle className="size-8 mx-auto mb-2 opacity-50" />
            <p>لا توجد مساهمات في هذا القسم</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const Icon = TYPE_ICONS[item.type];
            return (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Icon className="size-4 text-muted-foreground" />
                        <Badge className={`${STATUS_COLORS[item.status] ?? ""} text-[10px]`}>
                          {STATUS_LABELS[item.status] ?? item.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {item.user?.fullName ?? "مستخدم"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.createdAt).toLocaleDateString("ar-MA")}
                        </span>
                      </div>
                      {/* Compact preview */}
                      {item.type === "priceReport" && (
                        <p className="text-sm font-medium">
                          {item.productNameAr} — {item.price} {item.unit}
                          {item.marketName ? ` — ${item.marketName}` : ""}
                        </p>
                      )}
                      {item.type === "serviceReview" && (
                        <p className="text-sm font-medium">
                          {"⭐".repeat(item.rating)} — {item.title}
                        </p>
                      )}
                      {item.type === "eventProposal" && (
                        <p className="text-sm font-medium">{item.title}</p>
                      )}
                      {item.type === "story" && (
                        <p className="text-sm font-medium">{item.title}</p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openReview(item)}
                    >
                      <CheckCircle2 className="size-4" />
                      <span className="sr-only sm:not-sr-only sm:ms-1">مراجعة</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Review dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selected && (() => {
                const Icon = TYPE_ICONS[selected.type];
                return <Icon className="size-5" />;
              })()}
              <span>مراجعة {selected ? TYPE_LABELS[selected.type] : ""}</span>
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              <div className="rounded-md bg-muted/30 p-3">
                {renderItemDetails(selected)}
              </div>
              {selected.user && (
                <div className="text-sm">
                  <span className="text-muted-foreground">المُساهم:</span>{" "}
                  <span className="font-bold">{selected.user.fullName}</span>
                </div>
              )}
              <div>
                <label className="text-sm font-bold mb-1.5 block">القرار</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="APPROVED">مقبول</SelectItem>
                    <SelectItem value="REJECTED">مرفوض</SelectItem>
                    {selected.type === "serviceReview" && (
                      <SelectItem value="FLAGGED">مُعلَّم (مخالف)</SelectItem>
                    )}
                    {selected.type === "eventProposal" && (
                      <SelectItem value="CONVERTED">حوّل لحدث فعلي</SelectItem>
                    )}
                    {selected.type === "story" && (
                      <SelectItem value="PUBLISHED">نُشر كمقال</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-bold mb-1.5 block">ملاحظة المشرف</label>
                <Textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="اشرح سبب القبول أو الرفض (يُرسل للمستخدم)..."
                  className="min-h-[80px]"
                />
              </div>
              {newStatus === "REJECTED" && (
                <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-900">
                  <XCircle className="size-4 inline me-1" />
                  الرفض يُرسل إشعاراً للمستخدم. يُستحسَن ذكر السبب بوضوح.
                </div>
              )}
              {newStatus === "APPROVED" && (
                <div className="rounded-md bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-900">
                  <CheckCircle2 className="size-4 inline me-1" />
                  القبول ينشر المحتوى عمومياً (وفقاً لنوعه).
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>
              إلغاء
            </Button>
            <Button onClick={submitReview} disabled={processing === selected?.id}>
              {processing === selected?.id ? "جاري..." : "حفظ القرار"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
