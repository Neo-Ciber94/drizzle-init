import { text, sqliteTable, customType } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

const columns = {
  uuid: (name: string) => {
    return text(name).$defaultFn(() => crypto.randomUUID());
  },
  date: (name: string) => {
    return customType<{ data: Date; driverData: string }>({
      dataType() {
        return "text";
      },
      fromDriver(value) {
        return new Date(value);
      },
      toDriver(value) {
        return value.toISOString();
      },
    })(name);
  },
};

export const posts = sqliteTable("post", {
  id: columns.uuid("post_id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: columns
    .date("created_at")
    .notNull()
    .$defaultFn(() => new Date()),
});

export const comments = sqliteTable("comment", {
  id: columns.uuid("comment_id").primaryKey(),
  postId: columns
    .uuid("post_id")
    .notNull()
    .references(() => posts.id),
  content: text("content").notNull(),
  createdAt: columns
    .date("created_at")
    .notNull()
    .$defaultFn(() => new Date()),
});

export const postRelations = relations(posts, ({ many }) => ({
  comments: many(comments),
}));

export const commentRelations = relations(comments, ({ one }) => ({
  post: one(posts, { fields: [comments.postId], references: [posts.id] }),
}));
