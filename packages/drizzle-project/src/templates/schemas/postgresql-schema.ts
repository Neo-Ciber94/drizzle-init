import { relations } from "drizzle-orm";
import { date, pgTable, text, uuid } from "drizzle-orm/pg-core";

export const posts = pgTable("post", {
  id: uuid("post_id")
    .$defaultFn(() => crypto.randomUUID())
    .primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: date("created_at").notNull().defaultNow(),
});

export const comments = pgTable("comment", {
  id: uuid("comment_id")
    .$defaultFn(() => crypto.randomUUID())
    .primaryKey(),
  postId: uuid("post_id")
    .notNull()
    .references(() => posts.id),
  content: text("content").notNull(),
  createdAt: date("created_at").notNull().defaultNow(),
});

export const postRelations = relations(posts, ({ many }) => ({
  comments: many(comments),
}));

export const commentRelations = relations(comments, ({ one }) => ({
  post: one(posts, { fields: [comments.postId], references: [posts.id] }),
}));
