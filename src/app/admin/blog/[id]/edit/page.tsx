import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BlogEditor } from "@/components/admin/blog-editor";

export const dynamic = "force-dynamic";

export default async function EditBlogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || !["SUPER_ADMIN", "DISTRICT_MOD"].includes(user.role)) {
    redirect("/login?callbackUrl=/admin/blog");
  }

  const { id } = await params;
  const post = await db.blogPost.findUnique({ where: { id } });
  if (!post) notFound();

  const serialized = {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    tiptapContent: post.tiptapContent,
    coverImage: post.coverImage,
    category: post.category,
    tags: post.tags,
    status: post.status as "draft" | "published" | "archived",
    featured: post.featured,
  };

  return <BlogEditor post={serialized} mode="edit" />;
}
