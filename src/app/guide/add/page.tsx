// ===================================================================
//  صفحة إضافة مكان — /guide/add
//  Server Component — نموذج بسيط لإضافة مكان جديد للدليل
//  - مفتوح للجميع (إن لم يُسجّل المستخدم، يُسجَّل createdBy=null)
//  - يُوجَّه للصفحة الرئيسية بعد الإضافة
// ===================================================================

import Link from "next/link";
import { ChevronLeft, Plus, MapPin } from "lucide-react";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ZelligeDivider } from "@/components/shared/zellige-divider";
import { GUIDE_CATEGORIES } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const metadata = { title: "أضف مكاناً للدليل" };

export default async function AddPlacePage() {
  const user = await getCurrentUser();

  async function addPlaceAction(formData: FormData) {
    "use server";
    const name = String(formData.get("name") ?? "").trim();
    const category = String(formData.get("category") ?? "CAFE");
    const address = String(formData.get("address") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();

    if (!name || name.length < 3) {
      throw new Error("الاسم مطلوب (3 أحرف على الأقل)");
    }

    const u = await getCurrentUser();
    await db.guideItem.create({
      data: {
        name,
        category,
        address: address || null,
        phone: phone || null,
        description: description || null,
        districtId: u?.districtId ?? null,
        createdBy: u?.id ?? null,
      },
    });
    revalidatePath("/guide");
  }

  return (
    <section className="container mx-auto px-4 py-8 md:py-12 max-w-2xl">
      <header className="text-center mb-6">
        <Badge
          variant="secondary"
          className="bg-primary/10 text-primary border-primary/20 mb-3"
        >
          <Plus className="size-3 ms-1.5" />
          إضافة مكان
        </Badge>
        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-foreground mb-2">
          أضف مكاناً للدليل
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          ساهم في إثراء دليل الحي بمعلومة عن مكان تعرفه — مقهى، مطعم، محل،
          مدرسة، مركز صحي، مسجد، خدمة، أو جمعية.
        </p>
        <ZelligeDivider variant="minimal" className="opacity-60 mt-4" />
      </header>

      <Card className="warm-shadow border-border/60">
        <CardHeader className="border-b border-border/60">
          <CardTitle className="font-heading flex items-center gap-2">
            <MapPin className="size-5 text-primary" />
            تفاصيل المكان
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form action={addPlaceAction} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-medium">
                الاسم <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                required
                minLength={3}
                placeholder="مثال: مقهى الأطلس"
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="category" className="text-sm font-medium">
                الفئة <span className="text-destructive">*</span>
              </Label>
              <Select name="category" defaultValue="CAFE">
                <SelectTrigger id="category" className="h-11">
                  <SelectValue placeholder="اختر الفئة" />
                </SelectTrigger>
                <SelectContent>
                  {GUIDE_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.icon} {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address" className="text-sm font-medium">
                العنوان
              </Label>
              <Input
                id="address"
                name="address"
                placeholder="شارع، رقم، حي..."
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-sm font-medium">
                الهاتف
              </Label>
              <Input
                id="phone"
                name="phone"
                dir="ltr"
                placeholder="06XXXXXXXX"
                className="h-11 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-sm font-medium">
                وصف موجز
              </Label>
              <Textarea
                id="description"
                name="description"
                rows={4}
                placeholder="أبرز الميزات، ساعات العمل، التخصص..."
              />
            </div>

            {!user && (
              <p className="text-xs text-muted-foreground bg-muted/40 rounded-md p-3 leading-relaxed">
                💡 تسجيل دخولك يربط مساهمتك بحسابك ويتيح لك تعديل ما أضفت.
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-end pt-2">
              <Button asChild variant="outline" className="h-11">
                <Link href="/guide">
                  <ChevronLeft className="size-4" />
                  <span>إلغاء</span>
                </Link>
              </Button>
              <Button type="submit" className="h-11 gap-1.5">
                <Plus className="size-4" />
                <span>أضف للدليل</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
