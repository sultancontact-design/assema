import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHero } from "@/components/community/page-hero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Save, Video, Link as LinkIcon, Tag } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "شارك فيديو" };

export default async function AddVideoPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/community/videos/add");

  return (
    <div className="flex flex-col">
      <PageHero title="شارك فيديو" subtitle="أضف فيديو من TikTok أو YouTube أو Instagram — شارك لحظات الحي." image="https://images.unsplash.com/photo-1611162616475-46b5b6bd0a1a?auto=format&fit=crop&w=1920&q=80" imageAlt="شارك فيديو" badge="مساهمة مجتمعية" />
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AddVideoForm />
      </div>
    </div>
  );
}

function AddVideoForm() {
  return (
    <Card className="max-w-2xl">
      <CardHeader><CardTitle className="flex items-center gap-2"><Video className="size-5 text-primary" />إضافة فيديو</CardTitle></CardHeader>
      <CardContent>
        <form action="/api/videos" method="POST" className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground flex items-center gap-1"><LinkIcon className="size-3.5" />رابط الفيديو</Label>
            <Input name="sourceUrl" type="url" required placeholder="https://www.tiktok.com/@user/video/..." className="h-10" />
            <p className="text-[10px] text-muted-foreground">يدعم: TikTok، YouTube، Instagram، Facebook</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">العنوان</Label>
            <Input name="title" required placeholder="عنوان الفيديو" className="h-10" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">الوصف (اختياري)</Label>
            <textarea name="description" rows={3} placeholder="وصف الفيديو..." className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground flex items-center gap-1"><Tag className="size-3.5" />التصنيف</Label>
            <select name="category" className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">اختر التصنيف</option>
              <option value="MUSIC">موسيقى</option>
              <option value="COOKING">طبخ</option>
              <option value="SPORTS">رياضة</option>
              <option value="COMEDY">كوميديا</option>
              <option value="EDUCATION">تعليمي</option>
              <option value="RELIGIOUS">ديني</option>
              <option value="FAMILY">عائلي</option>
              <option value="OTHER">آخر</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="flex-1 h-11"><Save className="size-4" />نشر الفيديو</Button>
            <Button type="button" variant="outline" asChild><Link href="/videos">إلغاء</Link></Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
