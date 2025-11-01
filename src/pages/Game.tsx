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
import confetti from "canvas-confetti";

interface Ingredient {
  id: string;
  name: string;
  emoji: string;
  imageUrl?: string;
  isBase: boolean;
  madeFrom?: string[]; // parent ingredient names
}

// Indian cooking fundamentals as base ingredients
const BASE_INGREDIENTS: Ingredient[] = [
  { id: "water", name: "Water", emoji: "💧", isBase: true },
  { id: "heat", name: "Heat", emoji: "🔥", isBase: true },
  { id: "soil", name: "Soil", emoji: "🌱", isBase: true },
  { id: "wheat", name: "Wheat", emoji: "🌾", isBase: true },
  { id: "rice", name: "Rice", emoji: "🍚", isBase: true },
  { id: "seed", name: "Seed", emoji: "🌰", isBase: true },
  { id: "lentil", name: "Lentil", emoji: "🥣", isBase: true },
  { id: "stone", name: "Stone", emoji: "🪨", isBase: true },
  { id: "pot", name: "Pot", emoji: "🏺", isBase: true },
  { id: "milk", name: "Milk", emoji: "🥛", isBase: true },
  { id: "salt", name: "Salt", emoji: "🧂", isBase: true },
  { id: "sugar", name: "Sugar", emoji: "🍬", isBase: true },
];

// Comprehensive seed database organized by category - Authentic Indian Cuisine Seeds
const SEED_DATABASE = [
  // Spice Seeds
  { name: "Cumin Seed", emoji: "🌿", category: "Spice Seeds" },
  { name: "Black Mustard Seed", emoji: "⚫", category: "Spice Seeds" },
  { name: "Yellow Mustard Seed", emoji: "🟡", category: "Spice Seeds" },
  { name: "Coriander Seed", emoji: "🌿", category: "Spice Seeds" },
  { name: "Fennel Seed", emoji: "🌿", category: "Spice Seeds" },
  { name: "Fenugreek Seed", emoji: "🌿", category: "Spice Seeds" },
  { name: "Carom Seed", emoji: "🌿", category: "Spice Seeds" },
  { name: "Nigella Seed", emoji: "⚫", category: "Spice Seeds" },
  { name: "Green Cardamom", emoji: "💚", category: "Spice Seeds" },
  { name: "Black Cardamom", emoji: "🖤", category: "Spice Seeds" },
  { name: "Black Peppercorn", emoji: "⚫", category: "Spice Seeds" },
  { name: "Clove", emoji: "🌰", category: "Spice Seeds" },
  { name: "Pomegranate Seed", emoji: "🔴", category: "Spice Seeds" },
  { name: "Dill Seed", emoji: "🌿", category: "Spice Seeds" },
  { name: "Celery Seed", emoji: "🌿", category: "Spice Seeds" },
  
  // Grains & Millets
  { name: "Basmati Rice", emoji: "🍚", category: "Grains & Millets" },
  { name: "Sona Masuri Rice", emoji: "🍚", category: "Grains & Millets" },
  { name: "Whole Wheat", emoji: "🌾", category: "Grains & Millets" },
  { name: "Pearl Millet", emoji: "🌾", category: "Grains & Millets" },
  { name: "Sorghum", emoji: "🌾", category: "Grains & Millets" },
  { name: "Finger Millet", emoji: "🌾", category: "Grains & Millets" },
  { name: "Foxtail Millet", emoji: "🌾", category: "Grains & Millets" },
  { name: "Barley", emoji: "🌾", category: "Grains & Millets" },
  { name: "Amaranth Seed", emoji: "🌾", category: "Grains & Millets" },
  { name: "Buckwheat", emoji: "🌾", category: "Grains & Millets" },
  
  // Lentils, Beans & Pulses
  { name: "Toor Dal", emoji: "🟡", category: "Lentils & Pulses" },
  { name: "Masoor Dal", emoji: "🔴", category: "Lentils & Pulses" },
  { name: "Mung Dal", emoji: "🟢", category: "Lentils & Pulses" },
  { name: "Urad Dal", emoji: "⚫", category: "Lentils & Pulses" },
  { name: "Chana Dal", emoji: "🟡", category: "Lentils & Pulses" },
  { name: "Whole Mung Bean", emoji: "🟢", category: "Lentils & Pulses" },
  { name: "Whole Urad", emoji: "⚫", category: "Lentils & Pulses" },
  { name: "Kabuli Chickpea", emoji: "🤍", category: "Lentils & Pulses" },
  { name: "Brown Chickpea", emoji: "🟤", category: "Lentils & Pulses" },
  { name: "Kidney Bean", emoji: "🔴", category: "Lentils & Pulses" },
  { name: "Black-Eyed Pea", emoji: "⚪", category: "Lentils & Pulses" },
  { name: "Moth Bean", emoji: "🟤", category: "Lentils & Pulses" },
  { name: "Horse Gram", emoji: "🟤", category: "Lentils & Pulses" },
  { name: "Soybean", emoji: "🟡", category: "Lentils & Pulses" },
  { name: "Field Bean", emoji: "🟢", category: "Lentils & Pulses" },
  { name: "Green Pea", emoji: "🟢", category: "Lentils & Pulses" },
  { name: "Cowpea", emoji: "🤍", category: "Lentils & Pulses" },
  { name: "Whole Red Lentil", emoji: "🔴", category: "Lentils & Pulses" },
  { name: "Dew Bean", emoji: "🟢", category: "Lentils & Pulses" },
  { name: "Lima Bean", emoji: "🤍", category: "Lentils & Pulses" },
  
  // Nuts & Dry Fruits
  { name: "Almond", emoji: "🌰", category: "Nuts & Dry Fruits" },
  { name: "Cashew Nut", emoji: "🥜", category: "Nuts & Dry Fruits" },
  { name: "Pistachio", emoji: "🟢", category: "Nuts & Dry Fruits" },
  { name: "Walnut", emoji: "🌰", category: "Nuts & Dry Fruits" },
  { name: "Peanut", emoji: "🥜", category: "Nuts & Dry Fruits" },
  { name: "Coconut", emoji: "🥥", category: "Nuts & Dry Fruits" },
  { name: "Fox Nut", emoji: "⚪", category: "Nuts & Dry Fruits" },
  { name: "Pine Nut", emoji: "🌰", category: "Nuts & Dry Fruits" },
  { name: "Apricot Kernel", emoji: "🟠", category: "Nuts & Dry Fruits" },
  { name: "Chironji", emoji: "🌰", category: "Nuts & Dry Fruits" },
  { name: "Date Seed", emoji: "🟤", category: "Nuts & Dry Fruits" },
  { name: "Raisin", emoji: "🟣", category: "Nuts & Dry Fruits" },
  
  // Vegetable & Gourd Seeds
  { name: "Okra Seed", emoji: "🌱", category: "Vegetable Seeds" },
  { name: "Eggplant Seed", emoji: "🍆", category: "Vegetable Seeds" },
  { name: "Tomato Seed", emoji: "🍅", category: "Vegetable Seeds" },
  { name: "Chili Pepper Seed", emoji: "🌶️", category: "Vegetable Seeds" },
  { name: "Bell Pepper Seed", emoji: "🫑", category: "Vegetable Seeds" },
  { name: "Cucumber Seed", emoji: "🥒", category: "Vegetable Seeds" },
  { name: "Bottle Gourd Seed", emoji: "🌱", category: "Vegetable Seeds" },
  { name: "Bitter Gourd Seed", emoji: "🌱", category: "Vegetable Seeds" },
  { name: "Ridge Gourd Seed", emoji: "🌱", category: "Vegetable Seeds" },
  { name: "Pumpkin Seed", emoji: "🎃", category: "Vegetable Seeds" },
  { name: "Radish Seed", emoji: "🌱", category: "Vegetable Seeds" },
  { name: "Carrot Seed", emoji: "🥕", category: "Vegetable Seeds" },
  { name: "Onion Seed", emoji: "🧅", category: "Vegetable Seeds" },
  { name: "Cauliflower Seed", emoji: "🌱", category: "Vegetable Seeds" },
  { name: "Cabbage Seed", emoji: "🥬", category: "Vegetable Seeds" },
  
  // Fruit Seeds
  { name: "Mango Seed", emoji: "🥭", category: "Fruit Seeds" },
  { name: "Tamarind Seed", emoji: "🟤", category: "Fruit Seeds" },
  { name: "Jamun Seed", emoji: "🟣", category: "Fruit Seeds" },
  { name: "Jackfruit Seed", emoji: "🟡", category: "Fruit Seeds" },
  { name: "Guava Seed", emoji: "🟢", category: "Fruit Seeds" },
  { name: "Papaya Seed", emoji: "🟠", category: "Fruit Seeds" },
  { name: "Watermelon Seed", emoji: "🍉", category: "Fruit Seeds" },
  { name: "Muskmelon Seed", emoji: "🍈", category: "Fruit Seeds" },
  { name: "Amla Seed", emoji: "🟢", category: "Fruit Seeds" },
  { name: "Ber Seed", emoji: "🟤", category: "Fruit Seeds" },
  
  // Herb & Green Seeds
  { name: "Spinach Seed", emoji: "🥬", category: "Herb & Green Seeds" },
  { name: "Mustard Greens Seed", emoji: "🥬", category: "Herb & Green Seeds" },
  { name: "Fenugreek Greens Seed", emoji: "🌿", category: "Herb & Green Seeds" },
  { name: "Amaranth Greens Seed", emoji: "🥬", category: "Herb & Green Seeds" },
  { name: "Coriander Plant Seed", emoji: "🌿", category: "Herb & Green Seeds" },
  { name: "Mint Seed", emoji: "🌿", category: "Herb & Green Seeds" },
  { name: "Basil Seed", emoji: "🌿", category: "Herb & Green Seeds" },
  
  // Oilseeds & Misc
  { name: "White Sesame Seed", emoji: "⚪", category: "Oilseeds & Misc" },
  { name: "Black Sesame Seed", emoji: "⚫", category: "Oilseeds & Misc" },
  { name: "Poppy Seed", emoji: "⚪", category: "Oilseeds & Misc" },
  { name: "Flaxseed", emoji: "🟤", category: "Oilseeds & Misc" },
  { name: "Sunflower Seed", emoji: "🌻", category: "Oilseeds & Misc" },
  { name: "Safflower Seed", emoji: "🟡", category: "Oilseeds & Misc" },
  { name: "Lotus Seed", emoji: "🪷", category: "Oilseeds & Misc" },
  { name: "Water Chestnut", emoji: "🌰", category: "Oilseeds & Misc" },
  { name: "Garden Cress Seed", emoji: "🌿", category: "Oilseeds & Misc" },
  { name: "Hemp Seed", emoji: "🌿", category: "Oilseeds & Misc" },
  { name: "Castor Seed", emoji: "🌰", category: "Oilseeds & Misc" },
];

// Random seed generator with timestamp for true randomness
function getRandomSeed(): typeof SEED_DATABASE[0] {
  const randomIndex = Math.floor(Math.random() * SEED_DATABASE.length);
  return SEED_DATABASE[randomIndex];
}

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

  // Sound effect functions
  const playCombineSound = () => {
    const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGe77OeeSwwPUKfj8LZjHAU5k9fyz3osBSh+zPLaizsKGGS56+mjUBELTKXh8bllHgU2jdXy0H0vBSh+zPLaizsKGGS56+mjUBELTKXh8bllHgU2jdXy0H0vBSh+zPLaizsKGGS56+mjUBELTKXh8bllHgU2jdXy0H0vBQ==");
    audio.volume = 0.3;
    audio.play().catch(() => {});
  };

  const playDiscoverySound = () => {
    const audio = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=");
    audio.volume = 0.5;
    audio.play().catch(() => {});
  };

  const triggerConfetti = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
  };

  // Load game from URL parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const loadGameId = params.get("load");
    if (loadGameId) {
      setGameId(loadGameId);
    } else {
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

  const handleIngredientClick = async (id: string) => {
    const ingredient = ingredients.find((i) => i.id === id);
    if (!ingredient || isProcessing) return;

    if (!combineSlot1) {
      setCombineSlot1(ingredient);
    } else if (!combineSlot2 && ingredient.id !== combineSlot1.id) {
      setCombineSlot2(ingredient);
      await combineIngredients(combineSlot1, ingredient);
    } else if (ingredient.id === combineSlot1.id) {
      // If clicking the same ingredient that's in slot 1, clear it
      setCombineSlot1(null);
    }
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
      await combineIngredients(combineSlot1, ingredient);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const combineIngredients = async (ing1: Ingredient, ing2: Ingredient) => {
    setIsProcessing(true);
    
    // Play combine sound
    playCombineSound();
    
    try {
      // Special case: Seed germination (three pathways)
      const names = [ing1.name, ing2.name].sort();
      
      // Pathway 1: Mud + Seed = Random seed germination
      if ((names[0] === "Mud" && names[1] === "Seed") || 
          (names[0] === "Seed" && names[1] === "Mud")) {
        const randomSeed = getRandomSeed();
        const newIngredient: Ingredient = {
          id: `${randomSeed.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
          name: randomSeed.name,
          emoji: randomSeed.emoji,
          isBase: false,
          // Germinated seeds are treated as core ingredients - no genealogy shown
        };
        
        const exists = ingredients.some((i) => i.name === newIngredient.name);
        if (!exists) {
          setIngredients((prev) => [...prev, newIngredient]);
          toast.success(`🌱 Germinated: ${randomSeed.name} ${randomSeed.emoji}`, {
            description: `Category: ${randomSeed.category}`,
          });
        }
        return;
      }
      
      // Pathway 2: Soil with Seed + Water = Random seed germination
      if ((names[0] === "Soil with Seed" && names[1] === "Water") || 
          (names[0] === "Water" && names[1] === "Soil with Seed")) {
        const randomSeed = getRandomSeed();
        const newIngredient: Ingredient = {
          id: `${randomSeed.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
          name: randomSeed.name,
          emoji: randomSeed.emoji,
          isBase: false,
          // Germinated seeds are treated as core ingredients - no genealogy shown
        };
        
        const exists = ingredients.some((i) => i.name === newIngredient.name);
        if (!exists) {
          setIngredients((prev) => [...prev, newIngredient]);
          toast.success(`🌱 Germinated: ${randomSeed.name} ${randomSeed.emoji}`, {
            description: `Category: ${randomSeed.category}`,
          });
        }
        return;
      }
      
      // Pathway 3: Sprouted Seeds + Soil = Random seed germination
      if ((names[0] === "Soil" && names[1] === "Sprouted Seeds") || 
          (names[0] === "Sprouted Seeds" && names[1] === "Soil")) {
        const randomSeed = getRandomSeed();
        const newIngredient: Ingredient = {
          id: `${randomSeed.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
          name: randomSeed.name,
          emoji: randomSeed.emoji,
          isBase: false,
          // Germinated seeds are treated as core ingredients - no genealogy shown
        };
        
        const exists = ingredients.some((i) => i.name === newIngredient.name);
        if (!exists) {
          setIngredients((prev) => [...prev, newIngredient]);
          toast.success(`🌱 Germinated: ${randomSeed.name} ${randomSeed.emoji}`, {
            description: `Category: ${randomSeed.category}`,
          });
        }
        return;
      }

      // Regular AI combination for all other cases
      // Only include genealogy for non-base, non-germinated ingredients
      const ing1Genealogy = (!ing1.isBase && ing1.madeFrom) ? ing1.madeFrom : undefined;
      const ing2Genealogy = (!ing2.isBase && ing2.madeFrom) ? ing2.madeFrom : undefined;
      
      const result = await generateDish({
        ingredient1: ing1.name,
        ingredient2: ing2.name,
        ingredient1Genealogy: ing1Genealogy,
        ingredient2Genealogy: ing2Genealogy,
      });

      const exists = ingredients.some((i) => i.name === result.name);
      
      if (!exists) {
        const newIngredient: Ingredient = {
          id: `${ing1.id}-${ing2.id}-${Date.now()}`,
          name: result.name,
          emoji: result.emoji,
          imageUrl: result.imageUrl,
          isBase: false,
          madeFrom: [ing1.name, ing2.name],
        };
        
        setIngredients((prev) => [...prev, newIngredient]);
        
        if (result.isNewDiscovery) {
          // Global new discovery - trigger celebration
          triggerConfetti();
          playDiscoverySound();
          toast.success(`🎉 NEW DISCOVERY: ${result.name} ${result.emoji}`, {
            description: "You've discovered something no one has found before!",
            duration: 5000,
          });
        }
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
              🍛 FoodCraft: Indian Cuisine
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

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Discoveries: {ingredients.length}
              </p>
              <div className="text-xs text-muted-foreground bg-card border rounded-lg p-3">
                <p className="font-semibold mb-1">💡 Seed Germination (3 ways):</p>
                <p>Path 1: Water + Soil → Mud, then Mud + Seed → Random Seed! 🌱</p>
                <p>Path 2: Seed + Soil → Soil with Seed, then + Water → Random Seed! 🌱</p>
                <p>Path 3: Water + Seed → Sprouted Seeds, then + Soil → Random Seed! 🌱</p>
              </div>
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
                      onClick={handleIngredientClick}
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