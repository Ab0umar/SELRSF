import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, float, date } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
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

// Employees table
export const employees = mysqlTable("employees", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = typeof employees.$inferInsert;

// Khazina (Treasury) table - for 2024, 2025, 2026
export const khazina = mysqlTable("khazina", {
  id: int("id").autoincrement().primaryKey(),
  year: int("year").notNull(), // 2024, 2025, 2026
  date: date("date").notNull(),
  income: float("income").default(0).notNull(),
  expense: float("expense").default(0).notNull(),
  total: float("total").default(0).notNull(),
  balance: float("balance").default(0).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Khazina = typeof khazina.$inferSelect;
export type InsertKhazina = typeof khazina.$inferInsert;

// Sulf (Loans) table
export const sulf = mysqlTable("sulf", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  loanAmount: float("loanAmount").notNull(),
  paidAmount: float("paidAmount").default(0).notNull(),
  date: date("date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Sulf = typeof sulf.$inferSelect;
export type InsertSulf = typeof sulf.$inferInsert;

// Qard (Debt) table
export const qard = mysqlTable("qard", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  amount: float("amount").notNull(),
  date: date("date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Qard = typeof qard.$inferSelect;
export type InsertQard = typeof qard.$inferInsert;

// Legacy Transactions table (kept for backward compatibility)
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  date: date("date").notNull(),
  income: float("income").default(0).notNull(),
  expense: float("expense").default(0).notNull(),
  total: float("total").default(0).notNull(),
  balance: float("balance").default(0).notNull(),
  notes: text("notes"),
  employeeId: int("employeeId"),
  year: int("year").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;
