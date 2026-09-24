import { BlogEditor } from "@/components/admin/blog-editor";

export const dynamic = "force-dynamic";

export default function NewBlogPage() {
  return <BlogEditor post={null} mode="create" />;
}
