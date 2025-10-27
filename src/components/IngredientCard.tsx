import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

interface IngredientCardProps {
  id: string;
  name: string;
  emoji: string;
  imageUrl?: string;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onClick?: (id: string) => void;
  isNew?: boolean;
}

export function IngredientCard({
  id,
  name,
  emoji,
  imageUrl,
  onDragStart,
  onDragEnd,
  onClick,
  isNew = false,
}: IngredientCardProps) {
  return (
    <motion.div
      initial={isNew ? { scale: 0, rotate: -180 } : false}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      draggable
      onDragStart={() => onDragStart(id)}
      onDragEnd={onDragEnd}
      onClick={() => onClick?.(id)}
      className="cursor-pointer active:cursor-grabbing"
    >
      <Card className="p-3 hover:shadow-lg transition-all hover:scale-105 border-2">
        <div className="flex flex-col items-center gap-2">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className="w-12 h-12 object-cover rounded-md"
            />
          ) : (
            <div className="text-4xl">{emoji}</div>
          )}
          <p className="text-xs font-medium text-center line-clamp-2">{name}</p>
        </div>
      </Card>
    </motion.div>
  );
}