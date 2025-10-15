import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run cleanup every 24 hours
crons.interval(
  "cleanup old games",
  { hours: 24 },
  // Cast to any to avoid typegen timing issues during initial builds
  (internal as any).gameStates.cleanupOldGames,
  {}
);

export default crons;