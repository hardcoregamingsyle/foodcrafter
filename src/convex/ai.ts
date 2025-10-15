"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";

export const generateDish = action({
  args: {
    ingredient1: v.string(),
    ingredient2: v.string(),
    ingredient1Genealogy: v.optional(v.array(v.string())),
    ingredient2Genealogy: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args): Promise<{ name: string; emoji: string; imageUrl?: string }> => {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const stabilityApiKey = process.env.STABILITY_API_KEY;

    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY not configured");
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

    // Build genealogy context for AI
    let genealogyContext = "";
    
    if (args.ingredient1Genealogy && args.ingredient1Genealogy.length > 0) {
      genealogyContext += `\nItem: "${args.ingredient1}"\nMade From:\n${args.ingredient1Genealogy.map(parent => `- "${parent}"`).join("\n")}`;
    }
    
    if (args.ingredient2Genealogy && args.ingredient2Genealogy.length > 0) {
      genealogyContext += `\n\nItem: "${args.ingredient2}"\nMade From:\n${args.ingredient2Genealogy.map(parent => `- "${parent}"`).join("\n")}`;
    }

    const promptText = `You are a master chef and a crafting game engine. I will provide you with two items to combine. I will also provide the crafting history for each complex item. Use this history to determine the most logical and creative new item.

Rules: 
- Analyze the complete history of all ingredients to inform your result. 
- Respond with ONLY a JSON object in this exact format: {"name": "Dish Name", "emoji": "🍛"}
- The name should be the new item created (e.g., "Pizza", "Spicy Bread")
- Do not repeat ingredients in the name (e.g., if you combine "Tomato Sauce" and "Dough", the result is "Pizza", not "Tomato Sauce Dough")
- Keep names concise (1-4 words max)
- Consider Indian cuisine traditions when appropriate

### ACTION
Combine: ["${args.ingredient1}"] + ["${args.ingredient2}"]

### KNOWLEDGE${genealogyContext ? "\n" + genealogyContext : "\nBoth ingredients are core ingredients with no crafting history."}`;

    // Generate dish name and emoji using Gemini 2.5 with Indian cuisine context
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: promptText
          }]
        }],
        generationConfig: {
          temperature: 0.9,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.candidates[0].content.parts[0].text;
    
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

    // Generate image if Stability API key is available (using Hugging Face)
    if (stabilityApiKey) {
      try {
        const imageResponse = await fetch(
          "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${stabilityApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              inputs: `professional food photography of ${result.name}, Indian cuisine, appetizing, high quality, studio lighting, traditional presentation`,
              parameters: {
                num_inference_steps: 30,
                guidance_scale: 7,
              },
            }),
          }
        );

        if (imageResponse.ok) {
          const imageBlob = await imageResponse.blob();
          const arrayBuffer = await imageBlob.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString('base64');
          imageUrl = `data:image/png;base64,${base64}`;
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