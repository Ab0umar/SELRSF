import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { khazina, sulf, qard } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Khazina (Treasury) endpoints
  khazina: router({
    getByYear: publicProcedure
      .input(z.object({ year: z.number() }))
      .query(async ({ input }) => {
        const database = await db.getDb();
        if (!database) return [];
        const result = await database.select().from(khazina).where(eq(khazina.year, input.year));
        return result;
      }),

    getAll: publicProcedure.query(async () => {
      const database = await db.getDb();
      if (!database) return [];
      const result = await database.select().from(khazina);
      return result;
    }),

    create: publicProcedure
      .input(
        z.object({
          year: z.number(),
          date: z.string(),
          income: z.number().default(0),
          expense: z.number().default(0),
          total: z.number().default(0),
          balance: z.number().default(0),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const database = await db.getDb();
        if (!database) throw new Error("Database not available");
        const result = await database.insert(khazina).values({
          year: input.year,
          date: new Date(input.date),
          income: input.income,
          expense: input.expense,
          total: input.total,
          balance: input.balance,
          notes: input.notes || null,
        });
        return { success: true, id: result[0].insertId };
      }),

    update: publicProcedure
      .input(
        z.object({
          id: z.number(),
          year: z.number(),
          date: z.string(),
          income: z.number().default(0),
          expense: z.number().default(0),
          total: z.number().default(0),
          balance: z.number().default(0),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const database = await db.getDb();
        if (!database) throw new Error("Database not available");
        await database.update(khazina)
          .set({
            year: input.year,
            date: new Date(input.date),
            income: input.income,
            expense: input.expense,
            total: input.total,
            balance: input.balance,
            notes: input.notes || null,
          })
          .where(eq(khazina.id, input.id));
        return { success: true };
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const database = await db.getDb();
        if (!database) throw new Error("Database not available");
        await database.delete(khazina).where(eq(khazina.id, input.id));
        return { success: true };
      }),

    deleteAll: publicProcedure
      .input(z.object({ year: z.number().optional() }))
      .mutation(async ({ input }) => {
        const database = await db.getDb();
        if (!database) throw new Error("Database not available");
        if (input.year) {
          await database.delete(khazina).where(eq(khazina.year, input.year));
        } else {
          await database.delete(khazina);
        }
        return { success: true };
      }),

    importFromCSV: publicProcedure
      .input(z.object({ csvContent: z.string(), year: z.number() }))
      .mutation(async ({ input }) => {
        const database = await db.getDb();
        if (!database) throw new Error("Database not available");

        const lines = input.csvContent.split("\n").filter((line) => line.trim());
        let imported = 0;
        const errors: string[] = [];

        for (let i = 1; i < lines.length; i++) {
          try {
            const cols = lines[i].split(",");
            if (cols.length < 6) continue;

            // Parse columns: Balance, Amount, ID, Income, Expense, Date, Notes
            const balance = parseFloat(cols[0]) || 0;
            const total = parseFloat(cols[1]) || 0;
            const income = parseFloat(cols[3]) || 0;
            const expense = parseFloat(cols[4]) || 0;
            const dateStr = cols[5]?.trim() || "";
            const notes = cols[6]?.trim() || "";

            // Parse date (MM/DD/YY format)
            let date = new Date();
            if (dateStr) {
              const parts = dateStr.split("/");
              if (parts.length === 3) {
                const month = parseInt(parts[0]) - 1;
                const day = parseInt(parts[1]);
                let year = parseInt(parts[2]);
                if (year < 100) year += 2000;
                date = new Date(year, month, day);
              }
            }

            await database.insert(khazina).values({
              year: input.year,
              date,
              income,
              expense,
              total,
              balance,
              notes: notes || null,
            });
            imported++;
          } catch (error) {
            errors.push(`Row ${i}: ${error instanceof Error ? error.message : "Unknown error"}`);
          }
        }

        return { success: true, imported, errors };
      }),
  }),

  // Sulf (Loans) endpoints
  sulf: router({
    getAll: publicProcedure.query(async () => {
      const database = await db.getDb();
      if (!database) return [];
      const result = await database.select().from(sulf);
      return result;
    }),

    create: publicProcedure
      .input(
        z.object({
          name: z.string(),
          loanAmount: z.number(),
          paidAmount: z.number().default(0),
          date: z.string(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const database = await db.getDb();
        if (!database) throw new Error("Database not available");
        const result = await database.insert(sulf).values({
          name: input.name,
          loanAmount: input.loanAmount,
          paidAmount: input.paidAmount,
          date: new Date(input.date),
          notes: input.notes || null,
        });
        return { success: true, id: result[0].insertId };
      }),

    update: publicProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string(),
          loanAmount: z.number(),
          paidAmount: z.number(),
          date: z.string(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const database = await db.getDb();
        if (!database) throw new Error("Database not available");
        await database.update(sulf)
          .set({
            name: input.name,
            loanAmount: input.loanAmount,
            paidAmount: input.paidAmount,
            date: new Date(input.date),
            notes: input.notes || null,
          })
          .where(eq(sulf.id, input.id));
        return { success: true };
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const database = await db.getDb();
        if (!database) throw new Error("Database not available");
        await database.delete(sulf).where(eq(sulf.id, input.id));
        return { success: true };
      }),

    deleteAll: publicProcedure.mutation(async () => {
      const database = await db.getDb();
      if (!database) throw new Error("Database not available");
      await database.delete(sulf);
      return { success: true };
    }),

    importFromCSV: publicProcedure
      .input(z.object({ csvContent: z.string() }))
      .mutation(async ({ input }) => {
        const database = await db.getDb();
        if (!database) throw new Error("Database not available");

        const lines = input.csvContent.split("\n").filter((line) => line.trim());
        let imported = 0;
        const errors: string[] = [];

        for (let i = 1; i < lines.length; i++) {
          try {
            const cols = lines[i].split(",");
            if (cols.length < 4) continue;

            // Parse columns: Name, LoanAmount, PaidAmount, Date, Notes
            const name = cols[0]?.trim() || "";
            const loanAmount = parseFloat(cols[1]) || 0;
            const paidAmount = parseFloat(cols[2]) || 0;
            const dateStr = cols[3]?.trim() || "";
            const notes = cols[4]?.trim() || "";

            // Parse date
            let date = new Date();
            if (dateStr) {
              const parts = dateStr.split("/");
              if (parts.length === 3) {
                const month = parseInt(parts[0]) - 1;
                const day = parseInt(parts[1]);
                let year = parseInt(parts[2]);
                if (year < 100) year += 2000;
                date = new Date(year, month, day);
              }
            }

            await database.insert(sulf).values({
              name,
              loanAmount,
              paidAmount,
              date,
              notes: notes || null,
            });
            imported++;
          } catch (error) {
            errors.push(`Row ${i}: ${error instanceof Error ? error.message : "Unknown error"}`);
          }
        }

        return { success: true, imported, errors };
      }),
  }),

  // Qard (Debt) endpoints
  qard: router({
    getAll: publicProcedure.query(async () => {
      const database = await db.getDb();
      if (!database) return [];
      const result = await database.select().from(qard);
      return result;
    }),

    create: publicProcedure
      .input(
        z.object({
          name: z.string(),
          amount: z.number(),
          date: z.string(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const database = await db.getDb();
        if (!database) throw new Error("Database not available");
        const result = await database.insert(qard).values({
          name: input.name,
          amount: input.amount,
          date: new Date(input.date),
          notes: input.notes || null,
        });
        return { success: true, id: result[0].insertId };
      }),

    update: publicProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string(),
          amount: z.number(),
          date: z.string(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const database = await db.getDb();
        if (!database) throw new Error("Database not available");
        await database.update(qard)
          .set({
            name: input.name,
            amount: input.amount,
            date: new Date(input.date),
            notes: input.notes || null,
          })
          .where(eq(qard.id, input.id));
        return { success: true };
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const database = await db.getDb();
        if (!database) throw new Error("Database not available");
        await database.delete(qard).where(eq(qard.id, input.id));
        return { success: true };
      }),

    deleteAll: publicProcedure.mutation(async () => {
      const database = await db.getDb();
      if (!database) throw new Error("Database not available");
      await database.delete(qard);
      return { success: true };
    }),

    importFromCSV: publicProcedure
      .input(z.object({ csvContent: z.string() }))
      .mutation(async ({ input }) => {
        const database = await db.getDb();
        if (!database) throw new Error("Database not available");

        const lines = input.csvContent.split("\n").filter((line) => line.trim());
        let imported = 0;
        const errors: string[] = [];

        for (let i = 1; i < lines.length; i++) {
          try {
            const cols = lines[i].split(",");
            if (cols.length < 3) continue;

            // Parse columns: Name, Date, Amount, Notes
            const name = cols[0]?.trim() || "";
            const dateStr = cols[1]?.trim() || "";
            const amount = parseFloat(cols[2]) || 0;
            const notes = cols[3]?.trim() || "";

            // Parse date
            let date = new Date();
            if (dateStr) {
              const parts = dateStr.split("/");
              if (parts.length === 3) {
                const month = parseInt(parts[0]) - 1;
                const day = parseInt(parts[1]);
                let year = parseInt(parts[2]);
                if (year < 100) year += 2000;
                date = new Date(year, month, day);
              }
            }

            await database.insert(qard).values({
              name,
              amount,
              date,
              notes: notes || null,
            });
            imported++;
          } catch (error) {
            errors.push(`Row ${i}: ${error instanceof Error ? error.message : "Unknown error"}`);
          }
        }

        return { success: true, imported, errors };
      }),
  }),
});

export type AppRouter = typeof appRouter;
