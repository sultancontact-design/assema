// ===================================================================
//  /admin/blog — قائمة إدارة المدوّنة + زر إنشاء مقال جديد
// ===================================================================

import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Edit3,
  Eye,
  Star,
  StarOff,
  CalendarDays,
  User,
} from "lucide-react";
import { BLOG_CATEGORY_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function AdminBlogListPage() {
  const user = await getCurrentUser();
  if (!user || !["SUPER_ADMIN", "DISTRICT_MOD"].includes(user.role)) {
    redirect("/login?callbackUrl=/admin/blog");
  }

  const posts = await db.blogPost.findMany({
    orderBy: { createdAt: "desc" },
    include: { author: { select: { fullName: true } } },
    take: 50,
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold mb-1">
            📝 إدارة المدوّنة
          </h1>
          <p className="text-sm text-muted-foreground">
            {posts.length} مقالاً — استعمل محرّر TipTap لإنشاء مقالات
            احترافية بصيغة HTML/JSON.
          </p>
        </div>
        <Button asChild size="lg" className="h-11">
          <Link href="/admin/blog/new">
            <Plus className="size-4" />
            <span>مقال جديد</span>
          </Link>
        </Button>
      </header>

      {posts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              لا توجد مقالات بعد. ابدأ بإنشاء مقالك الأول.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {posts.map((post) => {
            const cat = BLOG_CATEGORY_LABELS[post.category] ?? post.category;
            const statusBadge =
              post.status === "published" ? (
                <Badge variant="default">منشور</Badge>
              ) : post.status === "draft" ? (
                <Badge variant="secondary">مسوّدة</Badge>
              ) : (
                <Badge variant="outline">مؤرشف</Badge>
              );
            return (
              <Card key={post.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {statusBadge}
                        <Badge variant="outline">{cat}</Badge>
                        {post.featured && (
                          <Badge
                            variant="default"
                            className="bg-amber-500 text-amber-50"
                          >
                            <Star className="size-3" /> مميّز
                          </Badge>
                        )}
                        {post.tiptapContent && (
                          <Badge variant="secondary" className="text-[10px]">
                            TipTap
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-heading font-bold text-foreground line-clamp-1">
                        {post.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                        <span className="flex items-center gap-1">
                          <User className="size-3" />
                          {post.author?.fullName ?? "كاتب المنصة"}
                        </span>
                        <span className="flex items-center gap-1">
                          <CalendarDays className="size-3" />
                          {new Date(post.createdAt).toLocaleDateString(
                            "ar-MA",
                          )}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="size-3" />
                          {post.views} قراءة
                        </span>
                        {post.readingTime && (
                          <span>{post.readingTime} دقائق قراءة</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/blog/${post.slug}`} target="_blank">
                          <Eye className="size-4" />
                          <span className="sr-only">عرض</span>
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/blog/${post.id}/edit`}>
                          <Edit3 className="size-4" />
                          <span className="sr-only">تحرير</span>
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
