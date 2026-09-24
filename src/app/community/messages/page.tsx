import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { MessageChat } from "@/components/community/message-chat";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/community/messages");
  const conversations = await db.directMessage.findMany({
    where: { OR: [{ senderId: user.id }, { receiverId: user.id }] },
    include: {
      sender: { select: { id: true, fullName: true } },
      receiver: { select: { id: true, fullName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const partners = new Map<string, { id: string; name: string; lastMessage: string; createdAt: Date }>();
  for (const msg of conversations) {
    const partner = msg.senderId === user.id ? msg.receiver : msg.sender;
    const existing = partners.get(partner.id);
    if (!existing || msg.createdAt > existing.createdAt) {
      partners.set(partner.id, { id: partner.id, name: partner.fullName, lastMessage: msg.content, createdAt: msg.createdAt });
    }
  }
  const partnerList = Array.from(partners.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-heading text-2xl font-bold mb-6">الرسائل</h1>
      {partnerList.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg">لا توجد رسائل بعد</p>
          <p className="text-sm mt-2">ابدأ محادثة مع أحد أعضاء الحي!</p>
        </div>
      ) : (
        <MessageChat conversations={partnerList} currentUserId={user.id} />
      )}
    </div>
  );
}
