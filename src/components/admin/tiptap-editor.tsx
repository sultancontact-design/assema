"use client";

import * as React from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Code,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  Strikethrough,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface TipTapEditorProps {
  value: string; // HTML
  onChange: (html: string, json: unknown) => void;
  placeholder?: string;
  minHeight?: number;
}

export function TipTapEditor({
  value,
  onChange,
  placeholder = "اكتب مقالك هنا...",
  minHeight = 400,
}: TipTapEditorProps) {
  const [linkDialogOpen, setLinkDialogOpen] = React.useState(false);
  const [linkUrl, setLinkUrl] = React.useState("");
  const [imageDialogOpen, setImageDialogOpen] = React.useState(false);
  const [imageUrl, setImageUrl] = React.useState("");
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline underline-offset-2",
          rel: "noopener noreferrer",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "rounded-md max-w-full my-3",
        },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "prose prose-lg max-w-none focus:outline-none p-4 min-h-[400px] prose-headings:font-heading prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:leading-relaxed prose-a:text-primary prose-img:rounded-md",
        style: `min-height: ${minHeight}px;`,
        dir: "rtl",
        lang: "ar",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML(), editor.getJSON());
    },
  });

  // Sync external value -> editor (when not focused)
  React.useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || "", false);
    }
  }, [value, editor]);

  if (!editor) {
    return (
      <div
        className="border rounded-md animate-pulse bg-muted/40"
        style={{ minHeight }}
      />
    );
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    setLinkUrl(previousUrl ?? "");
    setLinkDialogOpen(true);
  };

  const confirmLink = () => {
    const url = linkUrl.trim();
    if (!url) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      toast.success("أُزيل الرابط");
    } else {
      // Add https:// if missing
      const finalUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: finalUrl })
        .run();
      toast.success("أُضيف الرابط");
    }
    setLinkDialogOpen(false);
    setLinkUrl("");
  };

  const addImage = () => {
    setImageDialogOpen(true);
  };

  const confirmImage = () => {
    const url = imageUrl.trim();
    if (!url) {
      toast.error("أدخل رابط صورة صالح");
      return;
    }
    editor.chain().focus().setImage({ src: url, alt: "صورة" }).run();
    toast.success("أُضيفت الصورة");
    setImageDialogOpen(false);
    setImageUrl("");
  };

  return (
    <div className="border rounded-md bg-background overflow-hidden">
      {/* Toolbar */}
      <div
        className="border-b bg-muted/30 p-2 flex flex-wrap gap-1 sticky top-0 z-10"
        dir="rtl"
      >
        <ToolbarButton
          active={editor.isActive("bold")}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          onClick={() => editor.chain().focus().toggleBold().run()}
          icon={Bold}
          label="عريض"
        />
        <ToolbarButton
          active={editor.isActive("italic")}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          icon={Italic}
          label="مائل"
        />
        <ToolbarButton
          active={editor.isActive("strike")}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          icon={Strikethrough}
          label="مشطوب"
        />
        <ToolbarButton
          active={editor.isActive("code")}
          disabled={!editor.can().chain().focus().toggleCode().run()}
          onClick={() => editor.chain().focus().toggleCode().run()}
          icon={Code}
          label="كود"
        />

        <Separator />

        <ToolbarButton
          active={editor.isActive("heading", { level: 1 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          icon={Heading1}
          label="عنوان 1"
        />
        <ToolbarButton
          active={editor.isActive("heading", { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          icon={Heading2}
          label="عنوان 2"
        />
        <ToolbarButton
          active={editor.isActive("heading", { level: 3 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          icon={Heading3}
          label="عنوان 3"
        />

        <Separator />

        <ToolbarButton
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          icon={List}
          label="نقاط"
        />
        <ToolbarButton
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          icon={ListOrdered}
          label="ترقيم"
        />
        <ToolbarButton
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          icon={Quote}
          label="اقتباس"
        />
        <ToolbarButton
          active={editor.isActive("horizontalRule")}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          icon={Minus}
          label="فاصل"
        />

        <Separator />

        <ToolbarButton
          active={editor.isActive("link")}
          onClick={setLink}
          icon={LinkIcon}
          label="رابط"
        />
        <ToolbarButton onClick={addImage} icon={ImageIcon} label="صورة" />

        <Separator />

        <ToolbarButton
          disabled={!editor.can().chain().focus().undo().run()}
          onClick={() => editor.chain().focus().undo().run()}
          icon={Undo}
          label="تراجع"
        />
        <ToolbarButton
          disabled={!editor.can().chain().focus().redo().run()}
          onClick={() => editor.chain().focus().redo().run()}
          icon={Redo}
          label="إعادة"
        />
      </div>

      <EditorContent editor={editor} />

      {/* Link dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة / تعديل رابط</DialogTitle>
          </DialogHeader>
          <Input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://example.com"
            className="h-11"
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={confirmLink}>تأكيد</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة صورة</DialogTitle>
          </DialogHeader>
          <Input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="h-11"
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setImageDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={confirmImage}>إضافة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ToolbarButton({
  active,
  disabled,
  onClick,
  icon: Icon,
  label,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "ghost"}
      size="icon"
      className="size-9"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
    >
      <Icon className="size-4" />
    </Button>
  );
}

function Separator() {
  return <div className="w-px h-6 bg-border mx-1 self-center" aria-hidden />;
}

// Helper to estimate reading time
export function estimateReadingTime(html: string): number {
  if (!html) return 1;
  // Strip HTML tags
  const text = html.replace(/<[^>]*>/g, " ").trim();
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  // Average Arabic reading speed: ~180 wpm
  return Math.max(1, Math.ceil(wordCount / 180));
}
