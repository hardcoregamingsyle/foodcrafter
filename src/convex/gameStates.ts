import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

// Create or update a game state
export const saveGameState = mutation({
  args: {
    gameId: v.string(),
    discoveries: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        emoji: v.string(),
        imageUrl: v.optional(v.string()),
        isBase: v.boolean(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("gameStates")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        discoveries: args.discoveries,
        lastAccessed: Date.now(),
      });
      return existing._id;
    } else {
      return await ctx.db.insert("gameStates", {
        gameId: args.gameId,
        discoveries: args.discoveries,
        lastAccessed: Date.now(),
      });
    }
  },
});

// Load a game state
export const loadGameState = query({
  args: { gameId: v.string() },
  handler: async (ctx, args) => {
    const gameState = await ctx.db
      .query("gameStates")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .unique();

    if (!gameState) {
      return null;
    }

    return gameState;
  },
});

// Add public mutation to update lastAccessed time for a game
export const updateLastAccessed = mutation({
  args: { gameId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("gameStates")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { lastAccessed: Date.now() });
    }
  },
});

// Clean up old game states (30+ days)
export const cleanupOldGames = internalMutation({
  args: {},
  handler: async (ctx) => {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const oldGames = await ctx.db
      .query("gameStates")
      .filter((q) => q.lt(q.field("lastAccessed"), thirtyDaysAgo))
      .collect();

    let deletedCount = 0;
    for (const game of oldGames) {
      await ctx.db.delete(game._id);
      deletedCount++;
    }

    return { deletedCount };
  },
});