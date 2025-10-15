"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";

export const generateDish = action({
  args: {
    ingredient1: v.string(),
    ingredient2: v.string(),
  },
  handler: async (ctx, args): Promise<{ name: string; emoji: string; imageUrl?: string }> => {
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    const stabilityApiKey = process.env.STABILITY_API_KEY;

    if (!openRouterApiKey) {
      throw new Error("OPENROUTER_API_KEY not configured");
    }

    // Check cache first
    const cached: Doc<"discoveries"> | null = await ctx.runQuery(internal.discoveries.findCombination, {
      ingredient1: args.ingredient1,
      ingredient2: args.ingredient2,
    });

    if (cached) {
      return {
        name: cached.resultName,
        emoji: cached.resultEmoji,
        imageUrl: cached.resultImageUrl,
      };
    }

    // Generate dish name and emoji using AI with Indian cuisine context
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.1-8b-instruct:free",
        messages: [
          {
            role: "user",
            content: `You are a creative Indian chef creating fusion dishes and ingredients. Combine "${args.ingredient1}" and "${args.ingredient2}" into a new dish, ingredient, or food concept inspired by Indian cuisine. 

Consider traditional Indian cooking methods like:
- Tadka (tempering), grinding, roasting, fermenting
- Regional dishes from North, South, East, West India
- Street food, sweets, breads, curries, chutneys, pickles
- Spice blends, masalas, and traditional preparations

Respond ONLY with a JSON object in this exact format: {"name": "Dish Name", "emoji": "🍛"}. 

Be creative and authentic to Indian culinary traditions! The name should be 1-4 words max and can use Hindi/regional names if appropriate (like "Masala Dosa", "Paneer Tikka", "Jeera Rice", etc).`,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse the JSON response
    let result;
    try {
      result = JSON.parse(content);
    } catch (e) {
      // Fallback if AI doesn't return valid JSON
      result = {
        name: `${args.ingredient1} ${args.ingredient2}`,
        emoji: "🍽️",
      };
    }

    let imageUrl: string | undefined = undefined;

    // Generate image if Stability API key is available
    if (stabilityApiKey) {
      try {
        const imageResponse = await fetch(
          "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${stabilityApiKey}`,
            },
            body: JSON.stringify({
              text_prompts: [
                {
                  text: `professional food photography of ${result.name}, Indian cuisine, appetizing, high quality, studio lighting, traditional presentation`,
                  weight: 1,
                },
              ],
              cfg_scale: 7,
              height: 512,
              width: 512,
              steps: 30,
              samples: 1,
            }),
          }
        );

        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          if (imageData.artifacts && imageData.artifacts[0]) {
            imageUrl = `data:image/png;base64,${imageData.artifacts[0].base64}`;
          }
        }
      } catch (error) {
        console.error("Image generation failed:", error);
      }
    }

    // Save to cache
    await ctx.runMutation(internal.discoveries.saveCombination, {
      ingredient1: args.ingredient1,
      ingredient2: args.ingredient2,
      resultName: result.name,
      resultEmoji: result.emoji,
      resultImageUrl: imageUrl,
    });

    return {
      name: result.name,
      emoji: result.emoji,
      imageUrl,
    };
  },
});