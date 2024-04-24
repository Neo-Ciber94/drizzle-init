import { relations } from "drizzle-orm";
import { mysqlTable } from "drizzle-orm/mysql-core";
import { date, text, varchar } from "drizzle-orm/mysql-core/columns";

export const posts = mysqlTable("post", {
  id: varchar("post_id", { length: 36 })
    .$defaultFn(() => crypto.randomUUID())
    .primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: date("created_at")
    .notNull()
    .$defaultFn(() => new Date()),
});

export const comments = mysqlTable("comment", {
  id: varchar("comment_id", { length: 36 })
    .$defaultFn(() => crypto.randomUUID())
    .primaryKey(),
  postId: varchar("post_id", { length: 36 })
    .notNull()
    .references(() => posts.id),
  content: text("content").notNull(),
  createdAt: date("created_at")
    .notNull()
    .$defaultFn(() => new Date()),
});

export const postRelations = relations(posts, ({ many }) => ({
  comments: many(comments),
}));

export const commentRelations = relations(comments, ({ one }) => ({
  post: one(posts, { fields: [comments.postId], references: [posts.id] }),
}));
