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
  handler: async (ctx, args): Promise<{ name: string; emoji: string; imageUrl?: string; isNewDiscovery: boolean }> => {
    // Collect all available Gemini API keys
    const geminiApiKeys: string[] = [];
    let keyIndex = 1;
    while (true) {
      const key = process.env[`GEMINI_API_KEY_${keyIndex}`] || (keyIndex === 1 ? process.env.GEMINI_API_KEY : null);
      if (key) {
        geminiApiKeys.push(key);
        keyIndex++;
      } else {
        break;
      }
    }
    
    // Add fallback key if exists
    if (process.env.GEMINI_API_FALLBACK_KEY) {
      geminiApiKeys.push(process.env.GEMINI_API_FALLBACK_KEY);
    }

    if (geminiApiKeys.length === 0) {
      throw new Error("No GEMINI_API_KEY configured");
    }

    const stabilityApiKey = process.env.STABILITY_API_KEY;

    // Sort ingredients to ensure a+b = b+a
    const [sortedIng1, sortedIng2] = [args.ingredient1, args.ingredient2].sort();

    // Check cache first (using sorted ingredients)
    const cached: Doc<"discoveries"> | null = await ctx.runQuery(internal.discoveries.findCombination, {
      ingredient1: sortedIng1,
      ingredient2: sortedIng2,
    });

    if (cached) {
      return {
        name: cached.resultName,
        emoji: cached.resultEmoji,
        imageUrl: cached.resultImageUrl,
        isNewDiscovery: false, // This was already discovered before
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

**Rules:**
1. Analyze the complete history of all ingredients to inform your result.
2. Respond with ONLY a JSON object in this exact format: {"name": "Dish Name", "emoji": "🍛"}
3. The name should be the new item created (e.g., "Pizza", "Spicy Bread")
4. Do not repeat ingredients in the name (e.g., if you combine "Tomato Sauce" and "Dough", the result is "Pizza", not "Tomato Sauce Dough")
5. Keep names concise (1-4 words max)
6. Consider Indian cuisine traditions when appropriate
7. IMPORTANT: Create a NEW item that represents what these ingredients become when combined, not just their names joined together
8. Think about what happens when you actually combine these ingredients in cooking (e.g., Salt + Sugar = "Sweet Brine" or "Seasoning Mix", not "Salt Sugar")
9. NEVER just concatenate the ingredient names. Stone + Lentil = "Ground Lentils" or "Lentil Paste", NOT "Stone Lentil"
10. Think about the PURPOSE and RESULT of combining these items in real cooking

### ACTION
Combine: ["${args.ingredient1}"] + ["${args.ingredient2}"]

### KNOWLEDGE${genealogyContext ? "\n" + genealogyContext : "\nBoth ingredients are core ingredients with no crafting history."}`;

    // Function to call Gemini API with a specific key
    const callGeminiAPI = async (apiKey: string) => {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
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
            maxOutputTokens: 256,
          }
        }),
      });

      return response;
    };

    // Try all available API keys in rotation
    let response: Response | null = null;
    let lastError: string = "";
    
    for (let i = 0; i < geminiApiKeys.length; i++) {
      try {
        console.log(`Trying Gemini API key ${i + 1}/${geminiApiKeys.length}`);
        response = await callGeminiAPI(geminiApiKeys[i]);
        
        if (response.ok) {
          console.log(`Successfully used API key ${i + 1}`);
          break;
        } else if (response.status === 429) {
          console.log(`API key ${i + 1} rate limited, trying next key...`);
          lastError = await response.text();
          continue;
        } else {
          lastError = await response.text();
          console.error(`API key ${i + 1} error:`, lastError);
          break;
        }
      } catch (error) {
        console.error(`API key ${i + 1} failed:`, error);
        lastError = String(error);
        continue;
      }
    }

    if (!response || !response.ok) {
      console.error("All Gemini API keys failed. Last error:", lastError);
      throw new Error(`Gemini API error: All keys exhausted - ${lastError}`);
    }

    const data = await response.json();
    
    // Log the full response for debugging
    console.log("Gemini API Response:", JSON.stringify(data, null, 2));
    
    // Check if response has the expected structure
    if (!data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
      console.error("Unexpected API response structure:", data);
      throw new Error(`Invalid Gemini API response structure: ${JSON.stringify(data)}`);
    }
    
    if (!data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
      console.error("Missing content in API response:", data);
      throw new Error(`Invalid Gemini API response - missing content: ${JSON.stringify(data)}`);
    }
    
    const content = data.candidates[0].content.parts[0].text;
    
    // Parse the JSON response
    let result;
    try {
      // Extract JSON from the response (in case it's wrapped in markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : content;
      result = JSON.parse(jsonString);
      
      // Validate the result has required fields
      if (!result.name || !result.emoji) {
        throw new Error("Invalid response format");
      }
    } catch (e) {
      console.error("Failed to parse AI response:", content, e);
      // Better fallback - throw error instead of concatenating
      throw new Error(`AI returned invalid response: ${content}`);
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

    // Save to cache (using sorted ingredients)
    await ctx.runMutation(internal.discoveries.saveCombination, {
      ingredient1: sortedIng1,
      ingredient2: sortedIng2,
      resultName: result.name,
      resultEmoji: result.emoji,
      resultImageUrl: imageUrl,
    });

    return {
      name: result.name,
      emoji: result.emoji,
      imageUrl,
      isNewDiscovery: true, // This is a brand new discovery!
    };
  },
});