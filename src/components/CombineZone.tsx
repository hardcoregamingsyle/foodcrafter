import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Plus, Sparkles } from "lucide-react";

interface CombineZoneProps {
  ingredient1: { name: string; emoji: string } | null;
  ingredient2: { name: string; emoji: string } | null;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  isProcessing: boolean;
}

export function CombineZone({
  ingredient1,
  ingredient2,
  onDrop,
  onDragOver,
  isProcessing,
}: CombineZoneProps) {
  return (
    <Card
      className="p-8 border-4 border-dashed border-primary/30 bg-primary/5 hover:border-primary/50 transition-all"
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <div className="flex items-center justify-center gap-4 min-h-[120px]">
        <AnimatePresence mode="wait">
          {isProcessing ? (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-2 text-primary"
            >
              <Sparkles className="w-6 h-6 animate-spin" />
              <span className="font-semibold">Creating magic...</span>
            </motion.div>
          ) : ingredient1 && ingredient2 ? (
            <motion.div
              key="both"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-center gap-4"
            >
              <div className="text-center">
                <div className="text-5xl mb-2">{ingredient1.emoji}</div>
                <p className="text-sm font-medium">{ingredient1.name}</p>
              </div>
              <Plus className="w-8 h-8 text-primary" />
              <div className="text-center">
                <div className="text-5xl mb-2">{ingredient2.emoji}</div>
                <p className="text-sm font-medium">{ingredient2.name}</p>
              </div>
            </motion.div>
          ) : ingredient1 ? (
            <motion.div
              key="one"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="text-5xl mb-2">{ingredient1.emoji}</div>
              <p className="text-sm font-medium">{ingredient1.name}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Drop another ingredient
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-muted-foreground"
            >
              <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="font-medium">Drag ingredients here to combine</p>
              <p className="text-sm mt-1">Discover new dishes!</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}
