import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ContributionsAdminClient } from "@/components/admin/contributions-admin-client";

export const dynamic = "force-dynamic";

export default async function AdminContributionsPage() {
  const user = await getCurrentUser();
  if (!user || !["SUPER_ADMIN", "DISTRICT_MOD"].includes(user.role)) {
    redirect("/login?callbackUrl=/admin/contributions");
  }

  // Fetch all 4 types (latest 50 each, pending first)
  const [priceReports, serviceReviews, eventProposals, stories] = await Promise.all([
    db.priceReport.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 50,
      include: { user: { select: { fullName: true } } },
    }),
    db.serviceReviewSubmission.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 50,
      include: {
        user: { select: { fullName: true } },
        service: { select: { title: true } },
      },
    }),
    db.eventProposal.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 50,
      include: { user: { select: { fullName: true } } },
    }),
    db.storySubmission.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 50,
      include: { user: { select: { fullName: true } } },
    }),
  ]);

  const data = {
    priceReports: priceReports.map((p) => ({
      type: "priceReport" as const,
      id: p.id,
      productNameAr: p.productNameAr,
      productName: p.productName,
      category: p.category,
      price: p.price,
      unit: p.unit,
      marketName: p.marketName,
      notes: p.notes,
      status: p.status,
      adminNote: p.adminNote,
      reviewedAt: p.reviewedAt?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
      user: p.user ? { fullName: p.user.fullName } : undefined,
    })),
    serviceReviews: serviceReviews.map((r) => ({
      type: "serviceReview" as const,
      id: r.id,
      title: r.title,
      body: r.body,
      rating: r.rating,
      status: r.status,
      adminNote: r.adminNote,
      reviewedAt: r.reviewedAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
      service: r.service ? { title: r.service.title } : undefined,
      user: r.user ? { fullName: r.user.fullName } : undefined,
    })),
    eventProposals: eventProposals.map((e) => ({
      type: "eventProposal" as const,
      id: e.id,
      title: e.title,
      description: e.description,
      proposedDate: e.proposedDate.toISOString(),
      location: e.location,
      expectedAttendees: e.expectedAttendees,
      budget: e.budget,
      status: e.status,
      adminNote: e.adminNote,
      reviewedAt: e.reviewedAt?.toISOString() ?? null,
      createdAt: e.createdAt.toISOString(),
      user: e.user ? { fullName: e.user.fullName } : undefined,
    })),
    stories: stories.map((s) => ({
      type: "story" as const,
      id: s.id,
      title: s.title,
      body: s.body,
      consentGiven: s.consentGiven,
      anonymize: s.anonymize,
      status: s.status,
      adminNote: s.adminNote,
      reviewedAt: s.reviewedAt?.toISOString() ?? null,
      createdAt: s.createdAt.toISOString(),
      user: s.user ? { fullName: s.user.fullName } : undefined,
    })),
  };

  return <ContributionsAdminClient data={data} />;
}
