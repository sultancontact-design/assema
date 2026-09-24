// ===================================================================
//  صفحة مقال — /blog/[slug]
//  Server Component يعرض مقالاً كاملاً + الكاتب + مقالات ذات صلة
//  - يُزيد عدّاد المشاهدات بمقدار 1 (noawait — مباح بلا انتظار)
//  - 3 مقالات ذات صلة (نفس الفئة، 3 الأخيرة، ليس نفس المقال)
//  - أزرار مشاركة (ShareButtons)
// ===================================================================

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BookOpen,
  ChevronLeft,
  CalendarDays,
  User,
  Eye,
  ArrowRight,
  Clock,
  Star,
} from "lucide-react";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ZelligeDivider } from "@/components/shared/zellige-divider";
import { EmptyState } from "@/components/shared/empty-state";
import { ShareButtons } from "@/components/community/share-buttons";
import {
  BLOG_CATEGORIES,
  BLOG_CATEGORY_LABELS,
  formatDateArabic,
} from "@/lib/constants";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// ─────────── توليد metadata ديناميكي ───────────
export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const post = await db.blogPost.findUnique({
    where: { slug },
    select: { title: true, excerpt: true },
  });
  if (!post) {
    return { title: "مقال غير موجود" };
  }
  return {
    title: post.title,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;

  // 1) جلب المقال
  const post = await db.blogPost.findUnique({
    where: { slug },
    include: {
      author: {
        select: { fullName: true, avatar: true, profession: true },
      },
    },
  });

  if (!post || post.status !== "published") {
    notFound();
  }

  // 2) زيادة عدّاد المشاهدات (fire-and-forget — بدون انتظار)
  db.blogPost
    .update({
      where: { id: post.id },
      data: { views: { increment: 1 } },
    })
    .catch(() => {
      // تجاهل — فشل عدّاد المشاهدات لا يكسر الصفحة
    });

  // 3) 3 مقالات ذات صلة (نفس الفئة، ليست المقال الحالي)
  const related = await db.blogPost.findMany({
    where: {
      status: "published",
      category: post.category,
      id: { not: post.id },
    },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  const cat = BLOG_CATEGORIES.find((c) => c.value === post.category);

  return (
    <article className="container mx-auto px-4 py-8 md:py-12 max-w-3xl">
      {/* ─────────── رجوع للمدوّنة ─────────── */}
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm" className="h-9">
          <Link href="/blog">
            <ChevronLeft className="size-4" />
            <span>العودة للمدوّنة</span>
          </Link>
        </Button>
      </div>

      {/* ─────────── رأس المقال ─────────── */}
      <header className="mb-6">
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <Badge
            variant="secondary"
            className="bg-primary/10 text-primary border-primary/20"
          >
            {cat?.icon} {BLOG_CATEGORY_LABELS[post.category] ?? post.category}
          </Badge>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Eye className="size-3" />
            {post.views} قراءة
          </span>
          {post.readingTime && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3" />
              {post.readingTime} دقائق قراءة
            </span>
          )}
          {post.featured && (
            <Badge className="bg-amber-500 text-amber-50 text-[10px]">
              <Star className="size-3 inline" /> مقال مميّز
            </Badge>
          )}
        </div>
        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-foreground leading-tight mb-3">
          {post.title}
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed mb-4">
          {post.excerpt}
        </p>
        {/* صورة الغلاف */}
        {post.coverImage && (
          <div className="aspect-video rounded-lg overflow-hidden bg-muted mb-4 max-h-96">
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="flex items-center justify-between gap-3 flex-wrap text-sm text-muted-foreground border-y border-border/60 py-3">
          <span className="flex items-center gap-2">
            <span className="grid place-items-center size-9 rounded-full bg-primary/10 text-primary shrink-0">
              <User className="size-4" />
            </span>
            <span className="flex flex-col">
              <span className="font-medium text-foreground">
                {post.author?.fullName ?? "كاتب المنصة"}
              </span>
              {post.author?.profession && (
                <span className="text-xs">{post.author.profession}</span>
              )}
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-4" />
            {formatDateArabic(post.createdAt)}
          </span>
        </div>
        <ZelligeDivider variant="minimal" className="opacity-60 mt-4" />
      </header>

      {/* ─────────── المحتوى ─────────── */}
      <div
        className="prose prose-sm sm:prose-base max-w-none text-foreground
          [&>p]:text-base [&>p]:leading-relaxed [&>p]:mb-4
          [&>h2]:font-heading [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:mt-6 [&>h2]:mb-3
          [&>h3]:font-heading [&>h3]:text-xl [&>h3]:font-bold [&>h3]:mt-5 [&>h3]:mb-2
          [&>ul]:list-disc [&>ul]:ps-6 [&>ul]:space-y-1.5 [&>ul]:mb-4
          [&>ol]:list-decimal [&>ol]:ps-6 [&>ol]:space-y-1.5 [&>ol]:mb-4
          [&>blockquote]:border-s-4 [&>blockquote]:border-primary [&>blockquote]:bg-muted/30 [&>blockquote]:p-4 [&>blockquote]:rounded-md
        "
      >
        {post.content
          .split(/\n\n+/)
          .map((para, idx) => {
            const trimmed = para.trim();
            if (!trimmed) return null;
            if (trimmed.startsWith("## ")) {
              return (
                <h2 key={idx}>{trimmed.slice(3)}</h2>
              );
            }
            if (trimmed.startsWith("### ")) {
              return (
                <h3 key={idx}>{trimmed.slice(4)}</h3>
              );
            }
            if (trimmed.startsWith("- ")) {
              const items = trimmed.split("\n").map((l) => l.slice(2));
              return (
                <ul key={idx}>
                  {items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              );
            }
            if (/^\d+\. /.test(trimmed)) {
              const items = trimmed.split("\n").map((l) => l.replace(/^\d+\. /, ""));
              return (
                <ol key={idx}>
                  {items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ol>
              );
            }
            if (trimmed.startsWith("> ")) {
              return (
                <blockquote key={idx}>{trimmed.slice(2)}</blockquote>
              );
            }
            return <p key={idx}>{trimmed}</p>;
          })}
      </div>

      <ZelligeDivider variant="wave" className="opacity-60 my-8" />

      {/* ─────────── أزرار المشاركة ─────────── */}
      <section aria-labelledby="share-heading" className="mb-10">
        <h2 id="share-heading" className="font-heading text-lg font-bold text-foreground mb-3">
          شارك المقال مع من تحب
        </h2>
        <ShareButtons
          url={`/blog/${post.slug}`}
          title={post.title}
          text={post.excerpt}
          variant="default"
        />
      </section>

      {/* ─────────── مقالات ذات صلة ─────────── */}
      <section aria-labelledby="related-heading">
        <h2 id="related-heading" className="font-heading text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <BookOpen className="size-5 text-primary" />
          مقالات ذات صلة
        </h2>
        {related.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="لا توجد مقالات ذات صلة بعد"
            message="ما زلنا نكتب مقالات لهذه الفئة. عُد قريباً."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {related.map((r) => {
              const rCat = BLOG_CATEGORIES.find((c) => c.value === r.category);
              return (
                <Card
                  key={r.id}
                  className="warm-shadow border-border/60 h-full transition-all hover:border-primary/30 hover:-translate-y-0.5"
                >
                  <CardContent className="p-4 space-y-2">
                    <div className="h-20 grid place-items-center rounded-md bg-gradient-to-br from-primary/10 to-accent/10 text-3xl opacity-70">
                      {rCat?.icon ?? "📝"}
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-primary/10 text-primary border-primary/20 text-xs"
                    >
                      {BLOG_CATEGORY_LABELS[r.category] ?? r.category}
                    </Badge>
                    <h3 className="font-heading font-bold text-foreground text-sm leading-snug">
                      <Link
                        href={`/blog/${r.slug}`}
                        className="hover:text-primary transition-colors"
                      >
                        {r.title}
                      </Link>
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {r.excerpt}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* ─────────── CTA سفلي ─────────── */}
      <Card className="warm-shadow border-primary/30 bg-primary/5 mt-10">
        <CardContent className="p-5 text-center">
          <p className="text-sm text-foreground leading-relaxed mb-4">
            مقالاتنا تنشر مجاناً لإفادة أهل الحي. ساهم في صندوق المعروف
            لندومن في إنتاج المحتوى التوعوي.
          </p>
          <Button asChild size="lg" className="h-11">
            <Link href="/community/fund">
              <span>ساهم الآن</span>
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </article>
  );
}
