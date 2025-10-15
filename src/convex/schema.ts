import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables,

    users: defineTable({
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerificationTime: v.optional(v.number()),
      isAnonymous: v.optional(v.boolean()),
      role: v.optional(roleValidator),
    }).index("email", ["email"]),

    // Game states - stores player progress
    gameStates: defineTable({
      gameId: v.string(), // unique game identifier
      discoveries: v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          emoji: v.string(),
          imageUrl: v.optional(v.string()),
          isBase: v.boolean(),
        })
      ),
      lastAccessed: v.number(),
    }).index("by_gameId", ["gameId"]),

    // Global discovery cache - prevents duplicate API calls
    discoveries: defineTable({
      ingredient1: v.string(),
      ingredient2: v.string(),
      resultName: v.string(),
      resultEmoji: v.string(),
      resultImageUrl: v.optional(v.string()),
    })
      .index("by_combination", ["ingredient1", "ingredient2"]),
  },
  {
    schemaValidation: false,
  }
);

export default schema;