import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Check if a combination already exists
export const findCombination = query({
  args: {
    ingredient1: v.string(),
    ingredient2: v.string(),
  },
  handler: async (ctx, args) => {
    // Sort ingredients to ensure consistent lookup
    const [ing1, ing2] = [args.ingredient1, args.ingredient2].sort();

    const discovery = await ctx.db
      .query("discoveries")
      .withIndex("by_combination", (q) =>
        q.eq("ingredient1", ing1).eq("ingredient2", ing2)
      )
      .unique();

    return discovery;
  },
});

// Save a new discovery
export const saveCombination = mutation({
  args: {
    ingredient1: v.string(),
    ingredient2: v.string(),
    resultName: v.string(),
    resultEmoji: v.string(),
    resultImageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Sort ingredients to ensure consistent storage
    const [ing1, ing2] = [args.ingredient1, args.ingredient2].sort();

    return await ctx.db.insert("discoveries", {
      ingredient1: ing1,
      ingredient2: ing2,
      resultName: args.resultName,
      resultEmoji: args.resultEmoji,
      resultImageUrl: args.resultImageUrl,
    });
  },
});
