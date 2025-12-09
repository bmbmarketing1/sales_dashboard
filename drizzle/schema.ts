import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, date, unique } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Products table - 19 fixed products
 */
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  externalId: int("externalId").notNull(), // Cód. ID from spreadsheet
  internalCode: varchar("internalCode", { length: 20 }).notNull().unique(), // Código Interno (BQ061, etc)
  description: varchar("description", { length: 255 }).notNull(),
  dailyGoal: int("dailyGoal").default(0).notNull(), // Meta diária do produto
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Sales channels - Amazon, Magalu, Mercado Livre, Shopee, TikTok
 */
export const channels = mysqlTable("channels", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  dailyGoal: int("dailyGoal").default(0).notNull(), // Meta diária do canal
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Channel = typeof channels.$inferSelect;
export type InsertChannel = typeof channels.$inferInsert;

/**
 * Daily sales records - one record per product/channel/date
 */
export const dailySales = mysqlTable("daily_sales", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  channelId: int("channelId").notNull(),
  saleDate: date("saleDate").notNull(),
  quantity: int("quantity").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DailySale = typeof dailySales.$inferSelect;
export type InsertDailySale = typeof dailySales.$inferInsert;

/**
 * Product-Channel goals - specific goal for each product in each channel
 */
export const productChannelGoals = mysqlTable("product_channel_goals", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  channelId: int("channelId").notNull(),
  dailyGoal: int("dailyGoal").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  productChannelUnique: unique().on(table.productId, table.channelId),
}));

export type ProductChannelGoal = typeof productChannelGoals.$inferSelect;
export type InsertProductChannelGoal = typeof productChannelGoals.$inferInsert;

/**
 * Imported files log - tracks all uploaded XLS files with S3 backup
 */
export const importedFiles = mysqlTable("imported_files", {
  id: int("id").autoincrement().primaryKey(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileDate: date("fileDate").notNull(), // Date extracted from filename
  s3Key: varchar("s3Key", { length: 500 }).notNull(),
  s3Url: varchar("s3Url", { length: 1000 }).notNull(),
  recordsImported: int("recordsImported").default(0).notNull(),
  importedAt: timestamp("importedAt").defaultNow().notNull(),
  importedBy: int("importedBy"), // User ID who imported
});

export type ImportedFile = typeof importedFiles.$inferSelect;
export type InsertImportedFile = typeof importedFiles.$inferInsert;
