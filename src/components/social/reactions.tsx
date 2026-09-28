"use client";
import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThumbsUp, Heart, Laugh, Zap, HeartHandshake, PartyPopper } from "lucide-react";

const REACTION_TYPES = [
  { type: "LIKE", icon: ThumbsUp, color: "#3B82F6", label: "إعجاب" },
  { type: "LOVE", icon: Heart, color: "#EF4444", label: "أحببته" },
  { type: "HAHA", icon: Laugh, color: "#F59E0B", label: "هاها" },
  { type: "WOW", icon: Zap, color: "#8B5CF6", label: "مذهل" },
  { type: "CARE", icon: HeartHandshake, color: "#10B981", label: "أهتم" },
  { type: "CELEBRATE", icon: PartyPopper, color: "#EC4899", label: "أحتفل" },
] as const;

export function Reactions({ targetType, targetId, initialCounts = {} }: {
  targetType: string;
  targetId: string;
  initialCounts?: Record<string, number>;
}) {
  const [counts, setCounts] = React.useState(initialCounts);
  const [userReaction, setUserReaction] = React.useState<string | null>(null);
  const [showPicker, setShowPicker] = React.useState(false);

  const react = async (type: string) => {
    setUserReaction(type);
    setCounts(prev => ({ ...prev, [type]: (prev[type] || 0) + 1 }));
    setShowPicker(false);
    try {
      await fetch("/api/social/react", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, type }),
      });
    } catch {}
  };

  const totalReactions = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="relative" onMouseEnter={() => setShowPicker(true)} onMouseLeave={() => setShowPicker(false)}>
      <button
        onClick={() => userReaction ? null : react("LIKE")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${userReaction ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground"}`}
      >
        <ThumbsUp className="w-4 h-4" />
        <span className="text-sm font-medium">{totalReactions || "إعجاب"}</span>
      </button>
      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.9 }}
            className="absolute bottom-full mb-2 start-0 bg-background border rounded-full shadow-lg p-1 flex gap-1 z-50"
          >
            {REACTION_TYPES.map(r => {
              const Icon = r.icon;
              return (
                <button
                  key={r.type}
                  onClick={() => react(r.type)}
                  className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center transition-transform hover:scale-125"
                  title={r.label}
                >
                  <Icon className="w-5 h-5" style={{ color: r.color }} />
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
