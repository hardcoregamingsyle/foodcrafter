import { internalMutation } from "./_generated/server";

// One-time script to clear all cached discoveries
export const clearAllDiscoveries = internalMutation({
  args: {},
  handler: async (ctx) => {
    const allDiscoveries = await ctx.db.query("discoveries").collect();
    
    let deletedCount = 0;
    for (const discovery of allDiscoveries) {
      await ctx.db.delete(discovery._id);
      deletedCount++;
    }
    
    console.log(`Cleared ${deletedCount} cached discoveries`);
    return { deletedCount };
  },
});
