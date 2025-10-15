import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { IngredientCard } from "@/components/IngredientCard";
import { CombineZone } from "@/components/CombineZone";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Copy, Home, RotateCcw, Save } from "lucide-react";

interface Ingredient {
  id: string;
  name: string;
  emoji: string;
  imageUrl?: string;
  isBase: boolean;
}

const BASE_INGREDIENTS: Ingredient[] = [
  { id: "water", name: "Water", emoji: "💧", isBase: true },
  { id: "fire", name: "Fire", emoji: "🔥", isBase: true },
  { id: "earth", name: "Earth", emoji: "🌍", isBase: true },
  { id: "air", name: "Air", emoji: "💨", isBase: true },
];

export default function Game() {
  const navigate = useNavigate();
  const [gameId, setGameId] = useState<string>("");
  const [ingredients, setIngredients] = useState<Ingredient[]>(BASE_INGREDIENTS);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [combineSlot1, setCombineSlot1] = useState<Ingredient | null>(null);
  const [combineSlot2, setCombineSlot2] = useState<Ingredient | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const saveGameState = useMutation(api.gameStates.saveGameState);
  const updateLastAccessed = useMutation(api.gameStates.updateLastAccessed);
  const generateDish = useAction(api.ai.generateDish);

  // Load game from URL parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const loadGameId = params.get("load");
    if (loadGameId) {
      setGameId(loadGameId);
    } else {
      // Generate new game ID
      const newGameId = Math.random().toString(36).substring(2, 15);
      setGameId(newGameId);
    }
  }, []);

  const loadGameQuery = useQuery(
    api.gameStates.loadGameState,
    gameId ? { gameId } : "skip"
  );

  useEffect(() => {
    if (loadGameQuery && gameId) {
      setIngredients(loadGameQuery.discoveries);
      // Update last accessed time
      updateLastAccessed({ gameId });
      toast.success("Game loaded successfully!");
    }
  }, [loadGameQuery, gameId]);

  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedId) return;

    const ingredient = ingredients.find((i) => i.id === draggedId);
    if (!ingredient) return;

    if (!combineSlot1) {
      setCombineSlot1(ingredient);
    } else if (!combineSlot2 && ingredient.id !== combineSlot1.id) {
      setCombineSlot2(ingredient);
      // Trigger combination
      await combineIngredients(combineSlot1, ingredient);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const combineIngredients = async (ing1: Ingredient, ing2: Ingredient) => {
    setIsProcessing(true);
    try {
      const result = await generateDish({
        ingredient1: ing1.name,
        ingredient2: ing2.name,
      });

      const newIngredient: Ingredient = {
        id: `${ing1.id}-${ing2.id}-${Date.now()}`,
        name: result.name,
        emoji: result.emoji,
        imageUrl: result.imageUrl,
        isBase: false,
      };

      // Check if already discovered
      const exists = ingredients.some((i) => i.name === newIngredient.name);
      if (exists) {
        toast.info(`You already discovered ${result.name}!`);
      } else {
        setIngredients((prev) => [...prev, newIngredient]);
        toast.success(`Discovered: ${result.name} ${result.emoji}`);
      }
    } catch (error) {
      toast.error("Failed to combine ingredients. Check API keys.");
      console.error(error);
    } finally {
      setIsProcessing(false);
      setCombineSlot1(null);
      setCombineSlot2(null);
    }
  };

  const handleSaveGame = async () => {
    try {
      await saveGameState({
        gameId,
        discoveries: ingredients,
      });
      setShowSaveDialog(true);
    } catch (error) {
      toast.error("Failed to save game");
      console.error(error);
    }
  };

  const handleCopyGameId = () => {
    const url = `${window.location.origin}/game?load=${gameId}`;
    navigator.clipboard.writeText(url);
    toast.success("Game link copied to clipboard!");
  };

  const handleNewGame = () => {
    const newGameId = Math.random().toString(36).substring(2, 15);
    setGameId(newGameId);
    setIngredients(BASE_INGREDIENTS);
    setCombineSlot1(null);
    setCombineSlot2(null);
    navigate("/game");
    toast.success("New game started!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-green-50 dark:from-orange-950 dark:via-yellow-950 dark:to-green-950">
      {/* Header */}
      <div className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
            >
              <Home className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">
              🍳 FoodCraft
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleNewGame}>
              <RotateCcw className="w-4 h-4 mr-2" />
              New Game
            </Button>
            <Button size="sm" onClick={handleSaveGame}>
              <Save className="w-4 h-4 mr-2" />
              Save Game
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[1fr_400px] gap-6">
          {/* Combine Zone */}
          <div className="space-y-6">
            <CombineZone
              ingredient1={combineSlot1}
              ingredient2={combineSlot2}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              isProcessing={isProcessing}
            />

            <div className="text-center text-sm text-muted-foreground">
              <p>Discoveries: {ingredients.length}</p>
            </div>
          </div>

          {/* Ingredients Panel */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="bg-card border rounded-xl p-4 shadow-sm">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <span>Your Ingredients</span>
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                  {ingredients.length}
                </span>
              </h2>
              <ScrollArea className="h-[calc(100vh-250px)]">
                <div className="grid grid-cols-2 gap-3 pr-4">
                  {ingredients.map((ingredient, index) => (
                    <IngredientCard
                      key={ingredient.id}
                      {...ingredient}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      isNew={index >= BASE_INGREDIENTS.length && index === ingredients.length - 1}
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </div>

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Game Saved!</DialogTitle>
            <DialogDescription>
              Share this link to continue your game later or on another device.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={`${window.location.origin}/game?load=${gameId}`}
                readOnly
                className="font-mono text-sm"
              />
              <Button size="icon" onClick={handleCopyGameId}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Note: Games inactive for 30+ days will be automatically deleted.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}