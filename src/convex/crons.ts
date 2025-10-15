import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

// Add a loosely typed fallback to avoid TS errors before Convex generates types
const anyApi = api as any;

// Clean up old game states daily
crons.interval(
  "cleanup old games",
  { hours: 24 },
  anyApi.gameStates.cleanupOldGames,
  {}
);

export default crons;