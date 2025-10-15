import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Clean up old game states daily at 3 AM
crons.daily(
  "cleanup old games",
  { hourUTC: 3, minuteUTC: 0 },
  internal.gameStates.cleanupOldGames
);

export default crons;
