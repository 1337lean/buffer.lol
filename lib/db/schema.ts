import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull(),
  name: text("name"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const teams = pgTable("teams", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const teamMembers = pgTable(
  "team_members",
  {
    teamId: uuid("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["owner", "admin", "member"] }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    primaryKey({ columns: [table.teamId, table.userId] }),
    index("team_members_user_id_idx").on(table.userId)
  ]
);

export const teamInvites = pgTable(
  "team_invites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
    code: text("code").notNull().unique(),
    email: text("email"),
    role: text("role", { enum: ["admin", "member"] }).notNull().default("member"),
    createdBy: uuid("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    usedAt: timestamp("used_at", { withTimezone: true }),
    usedBy: uuid("used_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("team_invites_team_id_idx").on(table.teamId),
    index("team_invites_email_idx").on(table.email)
  ]
);

export const waitlistEntries = pgTable("waitlist_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  source: text("source").notNull(),
  status: text("status", { enum: ["new", "contacted", "invited", "converted"] }).notNull().default("new"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const probes = pgTable(
  "probes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
    createdBy: uuid("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    probeType: text("probe_type", { enum: ["hls", "dash"] }).notNull(),
    region: text("region").notNull(),
    status: text("status", { enum: ["queued", "running", "pass", "warn", "fail", "error"] }).notNull().default("queued"),
    summary: text("summary"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [index("probes_team_created_at_idx").on(table.teamId, table.createdAt)]
);

export const probeEvents = pgTable(
  "probe_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    probeId: uuid("probe_id").notNull().references(() => probes.id, { onDelete: "cascade" }),
    level: text("level", { enum: ["system", "pass", "warn", "fail", "error"] }).notNull(),
    message: text("message").notNull(),
    metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [index("probe_events_probe_created_at_idx").on(table.probeId, table.createdAt)]
);

export const probeMetrics = pgTable("probe_metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  probeId: uuid("probe_id").notNull().references(() => probes.id, { onDelete: "cascade" }).unique(),
  startupDelayMs: integer("startup_delay_ms"),
  manifestFetchMs: integer("manifest_fetch_ms"),
  firstSegmentFetchMs: integer("first_segment_fetch_ms"),
  cdnResponseMs: integer("cdn_response_ms"),
  liveLatencyMs: integer("live_latency_ms"),
  rebufferCount: integer("rebuffer_count"),
  bitrateVariantCount: integer("bitrate_variant_count"),
  segmentCountSampled: integer("segment_count_sampled"),
  metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const reports = pgTable("reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  probeId: uuid("probe_id").notNull().references(() => probes.id, { onDelete: "cascade" }).unique(),
  status: text("status").notNull(),
  title: text("title").notNull(),
  checks: jsonb("checks").notNull(),
  recommendedActions: jsonb("recommended_actions").notNull(),
  reportText: text("report_text").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const rateLimitBuckets = pgTable("rate_limit_buckets", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  resetAt: timestamp("reset_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(teamMembers),
  probes: many(probes)
}));

export const teamsRelations = relations(teams, ({ many }) => ({
  members: many(teamMembers),
  invites: many(teamInvites),
  probes: many(probes)
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, { fields: [teamMembers.teamId], references: [teams.id] }),
  user: one(users, { fields: [teamMembers.userId], references: [users.id] })
}));

export const teamInvitesRelations = relations(teamInvites, ({ one }) => ({
  team: one(teams, { fields: [teamInvites.teamId], references: [teams.id] }),
  creator: one(users, { fields: [teamInvites.createdBy], references: [users.id] }),
  usedByUser: one(users, { fields: [teamInvites.usedBy], references: [users.id] })
}));

export const probesRelations = relations(probes, ({ one, many }) => ({
  team: one(teams, { fields: [probes.teamId], references: [teams.id] }),
  creator: one(users, { fields: [probes.createdBy], references: [users.id] }),
  events: many(probeEvents),
  metrics: one(probeMetrics),
  report: one(reports)
}));

export const probeEventsRelations = relations(probeEvents, ({ one }) => ({
  probe: one(probes, { fields: [probeEvents.probeId], references: [probes.id] })
}));

export const probeMetricsRelations = relations(probeMetrics, ({ one }) => ({
  probe: one(probes, { fields: [probeMetrics.probeId], references: [probes.id] })
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  probe: one(probes, { fields: [reports.probeId], references: [probes.id] })
}));

export type ProbeStatus = typeof probes.$inferSelect.status;
export type ProbeType = typeof probes.$inferSelect.probeType;
