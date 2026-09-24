"use client";

import * as React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function DiscussionDetail({
  discussion,
  currentUserId,
}: {
  discussion: {
    id: string;
    title: string;
    content: string;
    category: string;
    views: number;
    author: { fullName: string };
    replies: { id: string; content: string; author: { fullName: string } }[];
  };
  currentUserId: string;
}) {
  const [reply, setReply] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const submit = async () => {
    if (!reply.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/community/discussions/${discussion.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: reply }),
      });
      if (res.ok) {
        toast.success("تم نشر الرد");
        setReply("");
        setTimeout(() => window.location.reload(), 500);
      }
    } catch {
      toast.error("فشل");
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <h1 className="font-heading text-xl font-bold">{discussion.title}</h1>
            <Badge variant="secondary">{discussion.category}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-foreground">{discussion.content}</p>
          <p className="text-xs text-muted-foreground mt-3">
            بواسطة {discussion.author.fullName}
          </p>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h2 className="font-heading font-bold">
          الردود ({discussion.replies.length})
        </h2>
        {discussion.replies.map((r) => (
          <Card key={r.id}>
            <CardContent className="p-3">
              <p className="text-sm">{r.content}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {r.author.fullName}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-4 space-y-2">
          <Textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="اكتب رداً..."
            className="min-h-20"
          />
          <Button onClick={submit} disabled={submitting} className="h-11">
            {submitting ? "جارٍ..." : "رد"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
