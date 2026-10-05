// v71.0 Section A — وَصَل Assistant (Darija + MSA)
// POST /api/assistant  Body: { message, history?, mode? }
// Inspired by ALLaM/Jais patterns + dialectal prompting
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `أنت "وَصَّال"، المساعد الذكي لمنصة وَصَل — الشبكة الاجتماعية المغربية الوطنية.

مهامك:
1. تجاوب بالعربية الفصحى أو بالدارجة المغربية حسب لغة المستخدم
2. تساعد المغاربة في:
   - فهم كيفية استخدام المنصة (التسجيل، المساهمة، إنشاء جمعية)
   - توضيح المعلومات الإدارية (12 جهة، 68 إقليم، 131 جماعة)
   - شرح القوانين المغربية ذات الصلة (قانون 75-00 للجمعيات، قانون 24-83 للتعاونيات)
   - ترجمة المفاهيم بين العربية والفرنسية والإمازيغية
3. إذا طُلب منك شيء خارج نطاق المعرفة المغربية، اعتذر بأدب ووجّه المستخدم لقسم آخر
4. لا تُقدّم نصائح قانونية أو طبية نهائية — اقترح دائماً استشارة مختص
5. كن مختصراً، ودياً، ومحترماً للثقافة المغربية

معلومات المنصة:
- الجمعيات: 25 منظمة مُسجلة (12 جمعية + 8 تعاونيات + 5 تعاضديات)
- الصلاحيات: زائر، عضو، رئيس مجموعة، مشرف حي، أمين الصندوق، سوبر أدمن
- صندوق المعروف: نظام مساهمات شهرية بالدرهم المغربي (MAD)
- المحافظات: 12 جهة رسمية + 68 إقليم + 131 جماعة + 5 أحياء تجريبية

أمثلة محادثات:
- س: "كيف نسجّل جمعية؟" → ج: "للتسجيل، تحتاج تصريح بـ walayat (عمالة). قانون 75-00 يلزم بـ 7 مؤسسين كحد أدنى..."
- س: "شنو هو وَصَل؟" → ج: "وَصَل شبكة اجتماعية مغربية وطنية تجمع المغاربة من طنجة للكويرة..."
- س: "How do I create a cooperative?" → j: "Pour créer une coopérative, adressez-vous à l'ODC (Office du Développement de la Coopérative)..."

ابدأ المحادثة بترحيب موجز إن كان أول سؤال.`;

const MAX_HISTORY = 12;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, history = [], mode = "auto" } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "message_required" }, { status: 400 });
    }

    if (message.length > 2000) {
      return NextResponse.json({ error: "message_too_long" }, { status: 400 });
    }

    // Optionally identify the user (for personalization — not required)
    const currentUser = await getCurrentUser().catch(() => null);
    const userContext = currentUser
      ? `\n\n(المستخدم الحالي: ${currentUser.name ?? "مستخدم"} — وجّه الإجابة له باسمه إن أمكن)`
      : "";

    // Build messages
    const trimmedHistory = (history as any[])
      .filter((m) => m && m.role && m.content)
      .slice(-MAX_HISTORY);

    const messages: any[] = [
      { role: "assistant", content: SYSTEM_PROMPT + userContext },
      ...trimmedHistory,
      { role: "user", content: message.trim() },
    ];

    // Dynamic import — z-ai-web-dev-sdk MUST be backend-only
    const ZAI = (await import("z-ai-web-dev-sdk")).default;
    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      messages,
      thinking: { type: "disabled" },
    });

    const aiResponse = completion.choices?.[0]?.message?.content ?? "";

    if (!aiResponse || aiResponse.trim().length === 0) {
      return NextResponse.json({
        response: "عذراً، لم أتمكن من توليد رد. حاول إعادة صياغة سؤالك.",
        mode,
        fallback: true,
      });
    }

    return NextResponse.json({
      response: aiResponse,
      mode,
      usage: completion.usage ?? null,
    });
  } catch (error) {
    console.error("[assistant] error:", error);
    return NextResponse.json(
      {
        error: "internal_error",
        response: "حدث خطأ تقني. حاول مرة أخرى بعد قليل.",
      },
      { status: 500 }
    );
  }
}
