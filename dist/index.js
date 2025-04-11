var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  insertInvestmentSchema: () => insertInvestmentSchema,
  insertInviteCodeSchema: () => insertInviteCodeSchema,
  insertReferralSchema: () => insertReferralSchema,
  insertTransactionSchema: () => insertTransactionSchema,
  insertUserSchema: () => insertUserSchema,
  investments: () => investments,
  investmentsRelations: () => investmentsRelations,
  inviteCodes: () => inviteCodes,
  inviteCodesRelations: () => inviteCodesRelations,
  referrals: () => referrals,
  referralsRelations: () => referralsRelations,
  transactions: () => transactions,
  transactionsRelations: () => transactionsRelations,
  users: () => users,
  usersRelations: () => usersRelations
});
import {
  pgTable,
  text,
  serial,
  numeric,
  timestamp
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email"),
  phone: text("phone"),
  telegram: text("telegram"),
  password: text("password").notNull(),
  securityPassword: text("security_password").notNull(),
  inviteCode: text("invite_code"),
  referralCode: text("referral_code").notNull().unique(),
  totalAssets: numeric("total_assets", { precision: 10, scale: 2 }).default("0").notNull(),
  quantitativeAssets: numeric("quantitative_assets", {
    precision: 10,
    scale: 2
  }).default("0").notNull(),
  profitAssets: numeric("profit_assets", { precision: 10, scale: 2 }).default("0").notNull(),
  rechargeAmount: numeric("recharge_amount", { precision: 10, scale: 2 }).default("0").notNull(),
  todayEarnings: numeric("today_earnings", { precision: 10, scale: 2 }).default("0").notNull(),
  yesterdayEarnings: numeric("yesterday_earnings", { precision: 10, scale: 2 }).default("0").notNull(),
  commissionToday: numeric("commission_today", { precision: 10, scale: 2 }).default("0").notNull(),
  commissionAssets: numeric("commission_assets", { precision: 10, scale: 2 }).default("0").notNull(),
  lastInvestmentDate: timestamp("last_investment_date"),
  referrerId: serial("referrer_id"),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  verificationStatus: text("verification_status").default("unverified"),
  verificationSubmittedAt: timestamp("verification_submitted_at"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var inviteCodes = pgTable("invite_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  createdById: serial("created_by_id"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerId: serial("referrer_id").notNull(),
  referredId: serial("referred_id").notNull(),
  level: text("level").notNull(),
  // Level 1, 2, or 3
  commission: numeric("commission", { precision: 10, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var investments = pgTable("investments", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  plan: text("plan").notNull(),
  // Basic, Premium, or VIP
  dailyRate: numeric("daily_rate", { precision: 5, scale: 2 }).notNull(),
  status: text("status").notNull(),
  // Active or Completed
  startDate: timestamp("start_date").defaultNow().notNull(),
  endDate: timestamp("end_date")
});
var transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").notNull(),
  type: text("type").notNull(),
  // Deposit, Withdrawal, Profit, Commission
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull(),
  // Pending, Completed, Failed
  txHash: text("tx_hash"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var usersRelations = relations(users, ({ one, many }) => ({
  referrer: one(users, {
    fields: [users.referrerId],
    references: [users.id]
  }),
  referrals: many(referrals, { relationName: "referrer_referrals" }),
  investments: many(investments),
  transactions: many(transactions),
  createdInviteCodes: many(inviteCodes, {
    relationName: "created_invite_codes"
  }),
  usedInviteCode: one(inviteCodes, {
    fields: [users.inviteCode],
    references: [inviteCodes.code]
  })
}));
var referralsRelations = relations(referrals, ({ one }) => ({
  referrer: one(users, {
    fields: [referrals.referrerId],
    references: [users.id],
    relationName: "referrer_referrals"
  }),
  referred: one(users, {
    fields: [referrals.referredId],
    references: [users.id]
  })
}));
var investmentsRelations = relations(investments, ({ one }) => ({
  user: one(users, {
    fields: [investments.userId],
    references: [users.id]
  })
}));
var transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id]
  })
}));
var inviteCodesRelations = relations(inviteCodes, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [inviteCodes.createdById],
    references: [users.id],
    relationName: "created_invite_codes"
  }),
  users: many(users)
}));
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  referralCode: true,
  totalAssets: true,
  quantitativeAssets: true,
  profitAssets: true,
  rechargeAmount: true,
  todayEarnings: true,
  yesterdayEarnings: true,
  commissionToday: true,
  commissionAssets: true,
  createdAt: true,
  referrerId: true,
  resetToken: true,
  resetTokenExpiry: true,
  updatedAt: true
}).extend({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  telegram: z.string().optional(),
  username: z.string().min(3).max(50),
  password: z.string().min(6),
  securityPassword: z.string().min(6),
  inviteCode: z.string().min(6).max(10)
});
var insertReferralSchema = createInsertSchema(referrals).omit({
  id: true,
  createdAt: true
});
var insertInvestmentSchema = createInsertSchema(investments).omit({
  id: true,
  userId: true,
  startDate: true,
  endDate: true,
  status: true
}).extend({
  amount: z.number().min(50),
  plan: z.string(),
  dailyRate: z.number()
});
var insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  userId: true,
  createdAt: true
});
var insertInviteCodeSchema = createInsertSchema(inviteCodes).omit({
  id: true,
  createdAt: true
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq } from "drizzle-orm";
var storage = {
  async getPendingTransactions() {
    const pendingTransactions = await db.select({
      id: transactions.id,
      type: transactions.type,
      amount: transactions.amount,
      status: transactions.status,
      createdAt: transactions.createdAt,
      userId: transactions.userId,
      username: users.username
    }).from(transactions).where(eq(transactions.status, "Pending")).innerJoin(users, eq(users.id, transactions.userId));
    return pendingTransactions;
  },
  async getTransaction(id) {
    const result = await db.select().from(transactions).where(eq(transactions.id, id));
    return result[0];
  },
  async updateTransaction(id, data) {
    const result = await db.update(transactions).set(data).where(eq(transactions.id, id)).returning();
    return result[0];
  },
  sessionStore: null,
  async createUser(userData) {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  },
  async getUserById(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  },
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  },
  async getUserByEmail(email) {
    if (!email) return null;
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  },
  async getUserByResetToken(token) {
    const [user] = await db.select().from(users).where(eq(users.resetToken, token));
    return user;
  },
  async getUserByPhone(phone) {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user;
  },
  async getUserByTelegram(telegram) {
    const [user] = await db.select().from(users).where(eq(users.telegram, telegram));
    return user;
  },
  async getUser(id) {
    return this.getUserById(id);
  },
  async updateUser(id, updates) {
    const [updatedUser] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return updatedUser;
  },
  async createInvestment(investmentData) {
    const [investment] = await db.insert(investments).values(investmentData).returning();
    return investment;
  },
  async getInvestmentsByUserId(userId) {
    return db.select().from(investments).where(eq(investments.userId, userId));
  },
  async createTransaction(transactionData) {
    const [transaction] = await db.insert(transactions).values(transactionData).returning();
    return transaction;
  },
  async getTransactionsByUserId(userId) {
    return db.select().from(transactions).where(eq(transactions.userId, userId));
  },
  async createInviteCode(codeData) {
    const [code] = await db.insert(inviteCodes).values(codeData).returning();
    return code;
  },
  async getInviteCode(code) {
    const [inviteCode] = await db.select().from(inviteCodes).where(eq(inviteCodes.code, code));
    return inviteCode;
  },
  async useInviteCode(code, userId) {
    const inviteCode = await this.getInviteCode(code);
    return !!inviteCode;
  },
  async createWelcomeInviteCode() {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    return this.createInviteCode({ code, createdById: 1 });
  },
  async getReferralsByReferrerId(referrerId) {
    return db.select().from(referrals).where(eq(referrals.referrerId, referrerId));
  },
  async getReferralsByReferredId(referredId) {
    return db.select().from(referrals).where(eq(referrals.referredId, referredId));
  },
  async createReferral(referralData) {
    const [referral] = await db.insert(referrals).values(referralData).returning();
    return referral;
  },
  generateReferralCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
};
storage.createWelcomeInviteCode().catch((err) => {
  console.error("Failed to create welcome invite code:", err);
});

// server/auth.ts
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { randomUUID } from "crypto";
var scryptAsync = promisify(scrypt);
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
function setupAuth(app2) {
  const sessionSettings = {
    secret: process.env.SESSION_SECRET || randomUUID(),
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1e3
      // 24 hours
    }
  };
  app2.set("trust proxy", 1);
  app2.use(session(sessionSettings));
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use("local-username", new LocalStrategy(
    async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !await comparePasswords(password, user.password)) {
          return done(null, false, { message: "Invalid username or password" });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  ));
  passport.use("local-email", new LocalStrategy(
    { usernameField: "email" },
    async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email);
        if (!user || !await comparePasswords(password, user.password)) {
          return done(null, false, { message: "Invalid email or password" });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  ));
  passport.use("local-phone", new LocalStrategy(
    { usernameField: "phone" },
    async (phone, password, done) => {
      try {
        const user = await storage.getUserByPhone(phone);
        if (!user || !await comparePasswords(password, user.password)) {
          return done(null, false, { message: "Invalid phone or password" });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  ));
  passport.use("local-telegram", new LocalStrategy(
    { usernameField: "telegram" },
    async (telegram, password, done) => {
      try {
        const user = await storage.getUserByTelegram(telegram);
        if (!user || !await comparePasswords(password, user.password)) {
          return done(null, false, { message: "Invalid Telegram ID or password" });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  ));
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
  app2.post("/api/register", async (req, res, next) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const inviteCode = await storage.getInviteCode(userData.inviteCode);
      if (!inviteCode) {
        return res.status(400).json({ message: "Invalid invite code" });
      }
      if (userData.username) {
        const existingUsername = await storage.getUserByUsername(userData.username);
        if (existingUsername) {
          return res.status(400).json({ message: "Username already exists" });
        }
      }
      if (userData.email) {
        const existingEmail = await storage.getUserByEmail(userData.email);
        if (existingEmail) {
          return res.status(400).json({ message: "Email already exists" });
        }
      }
      if (userData.phone) {
        const existingPhone = await storage.getUserByPhone(userData.phone);
        if (existingPhone) {
          return res.status(400).json({ message: "Phone already exists" });
        }
      }
      if (userData.telegram) {
        const existingTelegram = await storage.getUserByTelegram(userData.telegram);
        if (existingTelegram) {
          return res.status(400).json({ message: "Telegram ID already exists" });
        }
      }
      const hashedPassword = await hashPassword(userData.password);
      const hashedSecurityPassword = await hashPassword(userData.securityPassword);
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
        securityPassword: hashedSecurityPassword,
        referralCode: storage.generateReferralCode()
        // Added referral code generation
      });
      await storage.useInviteCode(userData.inviteCode, user.id);
      if (inviteCode.createdById) {
        await storage.createReferral({
          referrerId: inviteCode.createdById,
          referredId: user.id,
          level: "1",
          commission: "12"
          // 12% commission for level 1 referrals
        });
      }
      req.login(user, (err) => {
        if (err) return next(err);
        const { password, securityPassword, ...userWithoutPasswords } = user;
        res.status(201).json(userWithoutPasswords);
      });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });
  app2.post(
    "/api/login/username",
    passport.authenticate("local-username", { failWithError: true }),
    (req, res) => {
      const { password, securityPassword, ...userWithoutPasswords } = req.user;
      res.status(200).json(userWithoutPasswords);
    },
    (err, req, res, next) => {
      res.status(401).json({ message: "Invalid username or password" });
    }
  );
  app2.post(
    "/api/login/email",
    passport.authenticate("local-email", { failWithError: true }),
    (req, res) => {
      const { password, securityPassword, ...userWithoutPasswords } = req.user;
      res.status(200).json(userWithoutPasswords);
    },
    (err, req, res, next) => {
      res.status(401).json({ message: "Invalid email or password" });
    }
  );
  app2.post(
    "/api/login/phone",
    passport.authenticate("local-phone", { failWithError: true }),
    (req, res) => {
      const { password, securityPassword, ...userWithoutPasswords } = req.user;
      res.status(200).json(userWithoutPasswords);
    },
    (err, req, res, next) => {
      res.status(401).json({ message: "Invalid phone or password" });
    }
  );
  app2.post(
    "/api/login/telegram",
    passport.authenticate("local-telegram", { failWithError: true }),
    (req, res) => {
      const { password, securityPassword, ...userWithoutPasswords } = req.user;
      res.status(200).json(userWithoutPasswords);
    },
    (err, req, res, next) => {
      res.status(401).json({ message: "Invalid Telegram ID or password" });
    }
  );
  app2.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });
  app2.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { password, securityPassword, ...userWithoutPasswords } = req.user;
    res.json(userWithoutPasswords);
  });
}

// server/routes.ts
import { z as z2 } from "zod";
import { eq as eq2 } from "drizzle-orm";
import { scrypt as scrypt2, timingSafeEqual as timingSafeEqual2, randomBytes as randomBytes2 } from "crypto";
import { promisify as promisify2 } from "util";
import nodemailer from "nodemailer";

// server/admin-routes.ts
function registerAdminRoutes(app2) {
  app2.get("/api/admin/transactions/pending", async (req, res) => {
    try {
      const transactions2 = await storage.getPendingTransactions();
      res.json(transactions2);
    } catch (err) {
      console.error("Error fetching pending transactions:", err);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });
  app2.post("/api/admin/transactions/:id/approve", async (req, res) => {
    try {
      const { id } = req.params;
      const transaction = await storage.getTransaction(parseInt(id));
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      const updatedTransaction = await storage.updateTransaction(parseInt(id), {
        status: "Completed"
      });
      const user = await storage.getUser(transaction.userId);
      if (user) {
        if (transaction.type === "Deposit") {
          await storage.updateUser(user.id, {
            totalAssets: (parseFloat(user.totalAssets.toString()) + parseFloat(transaction.amount.toString())).toString(),
            rechargeAmount: (parseFloat(user.rechargeAmount.toString()) + parseFloat(transaction.amount.toString())).toString()
          });
          const existingDeposits = await storage.getTransactionsByUserId(
            user.id
          );
          const completedDeposits = existingDeposits.filter(
            (t) => t.type === "Deposit" && t.status === "Completed" && t.id !== transaction.id
          );
          if (completedDeposits.length === 0) {
            const bonusAmount = parseFloat(transaction.amount.toString()) * 0.1;
            await storage.updateUser(user.id, {
              totalAssets: (parseFloat(user.totalAssets.toString()) + bonusAmount).toString()
            });
            await storage.createTransaction({
              userId: user.id,
              type: "Bonus",
              amount: bonusAmount.toString(),
              status: "Completed",
              txHash: null
            });
          }
        }
      }
      res.json(updatedTransaction);
    } catch (err) {
      console.error("Error approving transaction:", err);
      res.status(500).json({ message: "Failed to approve transaction" });
    }
  });
  app2.post("/api/admin/transactions/:id/reject", async (req, res) => {
    try {
      const { id } = req.params;
      const updatedTransaction = await storage.updateTransaction(parseInt(id), {
        status: "Failed"
      });
      res.json(updatedTransaction);
    } catch (err) {
      console.error("Error rejecting transaction:", err);
      res.status(500).json({ message: "Failed to reject transaction" });
    }
  });
}

// server/routes.ts
var scryptAsync2 = promisify2(scrypt2);
async function comparePasswords2(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync2(supplied, salt, 64);
  return timingSafeEqual2(hashedBuf, suppliedBuf);
}
async function registerRoutes(app2) {
  registerAdminRoutes(app2);
  setupAuth(app2);
  app2.get("/api/welcome-code", async (req, res) => {
    try {
      const welcomeCode = await storage.createWelcomeInviteCode();
      res.json({ code: welcomeCode.code });
    } catch (error) {
      console.error("Error getting welcome code:", error);
      res.status(500).json({ error: "Failed to get welcome code" });
    }
  });
  app2.get("/api/crypto/prices", async (req, res) => {
    try {
      let getCryptoName2 = function(symbol) {
        const names = {
          "BTC": "Bitcoin",
          "ETH": "Ethereum",
          "BNB": "Binance Coin",
          "XRP": "Ripple",
          "ADA": "Cardano",
          "SOL": "Solana",
          "DOGE": "Dogecoin",
          "AVAX": "Avalanche"
        };
        return names[symbol] || symbol;
      };
      var getCryptoName = getCryptoName2;
      const [binanceRes, okxRes, huobiRes, coinbaseRes] = await Promise.all([
        fetch("https://api.binance.com/api/v3/ticker/24hr"),
        fetch("https://www.okx.com/api/v5/market/tickers?instType=SPOT&instId=BTC-USDT,ETH-USDT,BNB-USDT,XRP-USDT,ADA-USDT,SOL-USDT,DOGE-USDT,AVAX-USDT"),
        fetch("https://api.huobi.pro/market/tickers"),
        fetch("https://api.coinbase.com/v2/exchange-rates")
      ]);
      const [binanceData, okxData, huobiData, coinbaseData] = await Promise.all([
        binanceRes.json(),
        okxRes.json(),
        huobiRes.json(),
        coinbaseRes.json()
      ]);
      const formatPrice = (price) => Number(price.toFixed(2));
      const prices = [];
      try {
        if (binanceData?.code === 0 && binanceData?.msg?.includes("restricted location")) {
          console.log("Binance API not available in current region");
        } else {
          const binanceSymbols = ["BTC", "ETH", "BNB", "XRP", "ADA", "SOL", "DOGE", "AVAX"];
          const binanceDataArr = Array.isArray(binanceData) ? binanceData : [];
          binanceDataArr.filter((item) => {
            const symbolMatch = binanceSymbols.find((sym) => item?.symbol === `${sym}USDT`);
            return item && item.symbol && symbolMatch;
          }).forEach((item) => {
            const change24h = item.priceChangePercent ? parseFloat(item.priceChangePercent) : 0;
            prices.push({
              symbol: item.symbol.replace("USDT", ""),
              name: getCryptoName2(item.symbol.replace("USDT", "")),
              price: formatPrice(parseFloat(item.lastPrice || "0")),
              change24h,
              exchange: "BINANCE"
            });
          });
        }
      } catch (error) {
        console.error("Error processing Binance data:", error);
      }
      try {
        const okxDataArr = okxData?.data || [];
        okxDataArr.forEach((item) => {
          if (item.instId && item.instId.includes("-USDT")) {
            prices.push({
              symbol: item.instId.split("-")[0],
              name: getCryptoName2(item.instId.split("-")[0]),
              price: formatPrice(parseFloat(item.last)),
              change24h: parseFloat(((parseFloat(item.last) - parseFloat(item.open24h)) / parseFloat(item.open24h) * 100).toFixed(2)),
              exchange: "OKX"
            });
          }
        });
      } catch (error) {
        console.error("Error processing OKX data:", error);
      }
      try {
        const huobiDataArr = huobiData?.data || [];
        huobiDataArr.filter((item) => item && item.symbol && item.symbol.endsWith("usdt")).forEach((item) => {
          let change24h = 0;
          if (item.close && item.open) {
            const close = parseFloat(item.close);
            const open = parseFloat(item.open);
            if (!isNaN(close) && !isNaN(open) && open !== 0) {
              change24h = parseFloat(((close - open) / open * 100).toFixed(2));
            }
          }
          prices.push({
            symbol: item.symbol.replace("usdt", "").toUpperCase(),
            name: getCryptoName2(item.symbol.replace("usdt", "").toUpperCase()),
            price: formatPrice(parseFloat(item.close || "0")),
            change24h,
            exchange: "HUOBI"
          });
        });
      } catch (error) {
        console.error("Error processing Huobi data:", error);
      }
      try {
        const relevantSymbols = ["BTC", "ETH", "BNB", "XRP", "ADA", "SOL", "DOGE", "AVAX"];
        const usdRate = parseFloat(coinbaseData.data.rates.USD);
        relevantSymbols.forEach((symbol) => {
          if (coinbaseData.data.rates[symbol]) {
            prices.push({
              symbol,
              name: getCryptoName2(symbol),
              price: formatPrice(1 / (parseFloat(coinbaseData.data.rates[symbol]) * usdRate)),
              change24h: 0,
              exchange: "COINBASE"
            });
          }
        });
      } catch (error) {
        console.error("Error processing Coinbase data:", error);
      }
      res.json(prices);
    } catch (error) {
      console.error("Error fetching crypto prices:", error);
      res.status(500).json({ error: "Failed to fetch crypto prices" });
    }
  });
  app2.get("/api/investment/plans", (req, res) => {
    const plans = [
      {
        id: "vip1",
        name: "VIP 1",
        minAmount: 50,
        maxAmount: 5e5,
        dailyRate: 3,
        vipLevel: 1,
        description: "Earn 3% daily on your investment with $50 minimum"
      }
    ];
    res.json(plans);
  });
  app2.post("/api/investment", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      console.log("Investment data received:", req.body);
      const { amount, plan, dailyRate } = req.body;
      if (typeof amount !== "number" || amount < 50) {
        return res.status(400).json({ error: "Investment amount must be at least $50" });
      }
      if (typeof plan !== "string" || !plan) {
        return res.status(400).json({ error: "Investment plan is required" });
      }
      if (typeof dailyRate !== "number" || dailyRate <= 0) {
        return res.status(400).json({ error: "Daily rate must be a positive number" });
      }
      const user = await storage.getUser(req.user.id);
      if (!user) return res.status(404).send("User not found");
      if (parseFloat(user.totalAssets.toString()) < amount) {
        return res.status(400).json({ error: "Insufficient funds" });
      }
      if (user.lastInvestmentDate) {
        const lastInvestment = new Date(user.lastInvestmentDate);
        const currentTime = /* @__PURE__ */ new Date();
        const timeDifference = currentTime.getTime() - lastInvestment.getTime();
        const hoursDifference = timeDifference / (1e3 * 60 * 60);
        if (hoursDifference < 24) {
          const timeRemaining = Math.ceil(24 - hoursDifference);
          return res.status(400).json({
            error: `You can only create one investment every 24 hours. Please try again in ${timeRemaining} hour${timeRemaining === 1 ? "" : "s"}.`
          });
        }
      }
      const investmentToCreate = {
        amount,
        plan,
        dailyRate,
        userId: req.user.id,
        status: "Active"
      };
      const investment = await storage.createInvestment(investmentToCreate);
      const vipLevel = parseInt(plan.replace("vip", "")) || 1;
      let instantProfitPercentage = 0.03;
      if (vipLevel >= 2 && vipLevel <= 3) {
        instantProfitPercentage = 0.04;
      } else if (vipLevel >= 4 && vipLevel <= 5) {
        instantProfitPercentage = 0.05;
      } else if (vipLevel >= 6 && vipLevel <= 7) {
        instantProfitPercentage = 0.06;
      } else if (vipLevel >= 8) {
        instantProfitPercentage = 0.07;
      }
      const instantProfit = amount * instantProfitPercentage;
      await storage.updateUser(req.user.id, {
        quantitativeAssets: (parseFloat(user.quantitativeAssets.toString()) + amount).toString(),
        totalAssets: (parseFloat(user.totalAssets.toString()) + instantProfit).toString(),
        profitAssets: (parseFloat(user.profitAssets.toString()) + instantProfit).toString(),
        todayEarnings: (parseFloat(user.todayEarnings.toString()) + instantProfit).toString(),
        lastInvestmentDate: /* @__PURE__ */ new Date()
      });
      const profitTransaction = {
        userId: user.id,
        type: "Profit",
        amount: instantProfit.toString(),
        status: "Completed",
        txHash: null
      };
      await storage.createTransaction(profitTransaction);
      if (user.inviteCode) {
        const usedInviteCode = await storage.getInviteCode(user.inviteCode);
        if (usedInviteCode && usedInviteCode.createdById) {
          const referrer = await storage.getUser(usedInviteCode.createdById);
          if (referrer) {
            const commissionAmount = amount * 0.12;
            await storage.updateUser(referrer.id, {
              commissionAssets: (parseFloat(referrer.commissionAssets.toString()) + commissionAmount).toString(),
              commissionToday: (parseFloat(referrer.commissionToday.toString()) + commissionAmount).toString(),
              totalAssets: (parseFloat(referrer.totalAssets.toString()) + commissionAmount).toString()
            });
            const commissionTransaction = {
              userId: referrer.id,
              type: "Commission",
              amount: commissionAmount.toString(),
              status: "Completed",
              txHash: null
            };
            await storage.createTransaction(commissionTransaction);
            console.log(
              `Awarded ${commissionAmount} commission to referrer ID ${referrer.id} for investment by user ID ${user.id}`
            );
          }
        }
      }
      res.status(201).json({
        ...investment,
        instantProfit
      });
    } catch (err) {
      console.error("Investment creation error:", err);
      res.status(400).json({ error: err.message });
    }
  });
  app2.get("/api/investment", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const investments2 = await storage.getInvestmentsByUserId(req.user.id);
    res.json(investments2);
  });
  app2.get("/api/referrals", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const referrals2 = await storage.getReferralsByReferrerId(req.user.id);
    res.json(referrals2);
  });
  app2.post("/api/transaction", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const transactionData = insertTransactionSchema.parse(req.body);
      const user = await storage.getUser(req.user.id);
      if (!user) return res.status(404).send("User not found");
      if (transactionData.type === "Withdrawal") {
        if (parseFloat(user.totalAssets.toString()) < parseFloat(transactionData.amount.toString())) {
          return res.status(400).send("Insufficient funds for withdrawal");
        }
        await storage.updateUser(req.user.id, {
          totalAssets: (parseFloat(user.totalAssets.toString()) - parseFloat(transactionData.amount.toString())).toString()
        });
      } else if (transactionData.type === "Deposit") {
        await storage.updateUser(req.user.id, {
          totalAssets: (parseFloat(user.totalAssets.toString()) + parseFloat(transactionData.amount.toString())).toString(),
          rechargeAmount: (parseFloat(user.rechargeAmount.toString()) + parseFloat(transactionData.amount.toString())).toString()
        });
      }
      const transactionToCreate = {
        amount: transactionData.amount,
        type: transactionData.type,
        status: transactionData.status,
        txHash: transactionData.txHash ?? null,
        userId: req.user.id
      };
      const transaction = await storage.createTransaction(transactionToCreate);
      res.status(201).json(transaction);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  app2.get("/api/transactions", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const transactions2 = await storage.getTransactionsByUserId(req.user.id);
    res.json(transactions2);
  });
  app2.post("/api/invite-code", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const inviteCode = await storage.createInviteCode({
        code,
        createdById: req.user.id
      });
      res.status(201).json(inviteCode);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  app2.get("/api/invite-codes", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const codes = await db.select().from(inviteCodes).where(eq2(inviteCodes.createdById, req.user.id));
      res.json(codes);
    } catch (err) {
      console.error("Error fetching invite codes:", err);
      res.status(500).json({ error: "Failed to fetch invite codes" });
    }
  });
  app2.post("/api/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      const user = await storage.getUserByResetToken(token);
      if (!user || !user.resetTokenExpiry || /* @__PURE__ */ new Date() > new Date(user.resetTokenExpiry)) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }
      const salt = randomBytes2(16).toString("hex");
      const hashedPassword = await scryptAsync2(password, salt, 64);
      const newHashedPassword = `${hashedPassword.toString("hex")}.${salt}`;
      await storage.updateUser(user.id, {
        password: newHashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        updatedAt: /* @__PURE__ */ new Date()
      });
      res.json({ message: "Password reset successful" });
    } catch (err) {
      console.error("Reset password error:", err);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });
  app2.post("/api/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      const user = await storage.getUserByEmail(email);
      if (user) {
        const resetToken = randomBytes2(32).toString("hex");
        const resetExpiry = new Date(Date.now() + 36e5);
        await storage.updateUser(user.id, {
          resetToken,
          resetTokenExpiry: resetExpiry,
          updatedAt: /* @__PURE__ */ new Date()
        });
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
          }
        });
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: "Password Reset Request",
          html: `
            <h1>Password Reset</h1>
            <p>You requested a password reset. Click the link below to reset your password:</p>
            <a href="${process.env.APP_URL}/reset-password?token=${resetToken}">Reset Password</a>
            <p>This link will expire in 1 hour.</p>
            <p>If you did not request this reset, please ignore this email.</p>
          `
        });
      }
      res.json({ message: "If an account exists with this email, you will receive reset instructions" });
    } catch (err) {
      console.error("Password reset error:", err);
      res.status(500).json({ error: "Failed to process password reset" });
    }
  });
  app2.get("/api/account", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) return res.status(404).send("User not found");
      const investments2 = await storage.getInvestmentsByUserId(user.id);
      const transactions2 = await storage.getTransactionsByUserId(user.id);
      const referrals2 = await storage.getReferralsByReferrerId(user.id);
      const totalInvested = investments2.reduce(
        (sum, inv) => sum + parseFloat(inv.amount.toString()),
        0
      );
      const currentBalance = parseFloat(user.totalAssets.toString());
      const totalProfit = parseFloat(user.profitAssets.toString());
      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          telegram: user.telegram,
          referralCode: user.referralCode,
          totalAssets: user.totalAssets,
          quantitativeAssets: user.quantitativeAssets,
          profitAssets: user.profitAssets,
          todayEarnings: user.todayEarnings,
          yesterdayEarnings: user.yesterdayEarnings,
          lastInvestmentDate: user.lastInvestmentDate,
          createdAt: user.createdAt
        },
        stats: {
          totalInvested,
          currentBalance,
          totalProfit,
          activeInvestments: investments2.filter(
            (inv) => inv.status === "Active"
          ).length,
          referralsCount: referrals2.length
        }
      });
    } catch (err) {
      console.error("Error fetching account info:", err);
      res.status(500).json({ error: "Failed to fetch account information" });
    }
  });
  app2.patch("/api/account", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const { email, phone, telegram } = req.body;
      const userData = {};
      if (email) userData.email = email;
      if (phone) userData.phone = phone;
      if (telegram) userData.telegram = telegram;
      const updatedUser = await storage.updateUser(req.user.id, userData);
      if (!updatedUser) return res.status(404).send("User not found");
      const { password, securityPassword, ...userWithoutPasswords } = updatedUser;
      res.json(userWithoutPasswords);
    } catch (err) {
      console.error("Error updating account:", err);
      res.status(500).json({ error: "Failed to update account information" });
    }
  });
  app2.get("/api/dashboard/stats", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) return res.status(404).send("User not found");
      const investments2 = await storage.getInvestmentsByUserId(user.id);
      const activeInvestments = investments2.filter(
        (inv) => inv.status === "Active"
      );
      const referrals2 = await storage.getReferralsByReferrerId(user.id);
      res.json({
        totalAssets: user.totalAssets,
        quantitativeAssets: user.quantitativeAssets,
        profitAssets: user.profitAssets,
        todayEarnings: user.todayEarnings,
        yesterdayEarnings: user.yesterdayEarnings,
        commissionToday: user.commissionToday,
        activeInvestmentsCount: activeInvestments.length,
        referralsCount: referrals2.length
      });
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
      res.status(500).json({ error: "Failed to fetch dashboard statistics" });
    }
  });
  app2.post("/api/simulate-earnings", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) return res.status(404).send("User not found");
      const investments2 = await storage.getInvestmentsByUserId(user.id);
      const activeInvestments = investments2.filter(
        (inv) => inv.status === "Active"
      );
      let totalEarnings = 0;
      for (const investment of activeInvestments) {
        const dailyRate = parseFloat(investment.dailyRate.toString()) / 100;
        const amount = parseFloat(investment.amount.toString());
        const dailyEarning = amount * dailyRate;
        totalEarnings += dailyEarning;
      }
      const updatedUser = await storage.updateUser(user.id, {
        yesterdayEarnings: user.todayEarnings.toString(),
        todayEarnings: totalEarnings.toString(),
        profitAssets: (parseFloat(user.profitAssets.toString()) + totalEarnings).toString(),
        totalAssets: (parseFloat(user.totalAssets.toString()) + totalEarnings).toString()
      });
      if (totalEarnings > 0) {
        const profitTransaction = {
          userId: user.id,
          type: "Profit",
          amount: totalEarnings.toString(),
          status: "Completed",
          txHash: null
        };
        await storage.createTransaction(profitTransaction);
      }
      res.json({
        success: true,
        dailyEarnings: totalEarnings,
        totalProfitAssets: updatedUser?.profitAssets || "0"
      });
    } catch (err) {
      console.error("Error simulating earnings:", err);
      res.status(500).json({ error: "Failed to simulate earnings" });
    }
  });
  app2.get("/api/profile", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) return res.status(404).send("User not found");
      const referrals2 = await storage.getReferralsByReferrerId(user.id);
      const referralDetails = [];
      for (const referral of referrals2) {
        const referredUser = await storage.getUser(referral.referredId);
        if (referredUser) {
          referralDetails.push({
            id: referral.id,
            level: referral.level,
            commission: referral.commission,
            referredUser: {
              id: referredUser.id,
              username: referredUser.username,
              createdAt: referredUser.createdAt
            }
          });
        }
      }
      const { password, securityPassword, ...userWithoutPasswords } = user;
      res.json({
        profile: userWithoutPasswords,
        referrals: referralDetails
      });
    } catch (err) {
      console.error("Error fetching profile:", err);
      res.status(500).json({ error: "Failed to fetch profile information" });
    }
  });
  app2.post("/api/verify-security-password", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const { securityPassword } = req.body;
      if (!securityPassword) {
        return res.status(400).json({ message: "Security password is required" });
      }
      const user = await storage.getUser(req.user.id);
      if (!user) return res.status(404).json({ message: "User not found" });
      const isValid = await comparePasswords2(
        securityPassword,
        user.securityPassword
      );
      if (!isValid) {
        return res.status(401).json({ message: "Invalid security password" });
      }
      res.status(200).json({ success: true });
    } catch (err) {
      console.error("Error verifying security password:", err);
      res.status(500).json({ message: "Failed to verify security password" });
    }
  });
  app2.post("/api/transactions", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const schema = z2.object({
        type: z2.enum(["Deposit", "Withdrawal"]),
        amount: z2.number().min(0.01),
        status: z2.enum(["Pending", "Completed", "Failed"]),
        network: z2.string().optional(),
        address: z2.string().optional(),
        fee: z2.number().optional()
      });
      const transactionData = schema.parse(req.body);
      const user = await storage.getUser(req.user.id);
      if (!user) return res.status(404).send("User not found");
      const existingTransactions = await storage.getTransactionsByUserId(
        req.user.id
      );
      const hasDeposits = existingTransactions.some(
        (t) => t.type === "Deposit"
      );
      if (transactionData.type === "Withdrawal") {
        const nowInTaiwan = new Date(
          (/* @__PURE__ */ new Date()).toLocaleString("en-US", { timeZone: "Asia/Taipei" })
        );
        const dayOfWeek = nowInTaiwan.getDay();
        if (dayOfWeek !== 5) {
          return res.status(400).json({
            message: "Withdrawals are only allowed on Fridays (Taiwan Time Zone UTC+8)"
          });
        }
        if (transactionData.amount < 3) {
          return res.status(400).json({
            message: "Minimum withdrawal amount is $3"
          });
        }
        const totalAmount = transactionData.amount + (transactionData.fee || 0);
        if (parseFloat(user.totalAssets.toString()) < totalAmount) {
          return res.status(400).json({ message: "Insufficient funds for withdrawal" });
        }
      } else if (transactionData.type === "Deposit") {
        if (transactionData.amount < 50) {
          return res.status(400).json({
            message: "Minimum deposit amount is $50"
          });
        }
        let depositAmount = transactionData.amount;
        let bonusAmount = 0;
        if (!hasDeposits) {
          bonusAmount = depositAmount * 0.1;
          depositAmount += bonusAmount;
          await storage.updateUser(req.user.id, {
            totalAssets: (parseFloat(user.totalAssets.toString()) + depositAmount).toString(),
            rechargeAmount: (parseFloat(user.rechargeAmount.toString()) + transactionData.amount).toString()
          });
          const bonusTransaction = {
            amount: bonusAmount.toString(),
            type: "Bonus",
            status: "Completed",
            txHash: null,
            userId: req.user.id
          };
          await storage.createTransaction(bonusTransaction);
        } else {
          await storage.updateUser(req.user.id, {
            totalAssets: (parseFloat(user.totalAssets.toString()) + depositAmount).toString(),
            rechargeAmount: (parseFloat(user.rechargeAmount.toString()) + transactionData.amount).toString()
          });
        }
        const referrals2 = await storage.getReferralsByReferredId(req.user.id);
        for (const referral of referrals2) {
          if (referral.level === "1") {
            const referrer = await storage.getUser(referral.referrerId);
            if (!referrer) continue;
            const commissionRate = 0.12;
            const commissionAmount = transactionData.amount * commissionRate;
            if (commissionAmount > 0) {
              await storage.updateUser(referrer.id, {
                totalAssets: (parseFloat(referrer.totalAssets.toString()) + commissionAmount).toString(),
                commissionAssets: (parseFloat(referrer.commissionAssets.toString()) + commissionAmount).toString(),
                commissionToday: (parseFloat(referrer.commissionToday.toString()) + commissionAmount).toString()
              });
              const commissionTransaction = {
                amount: commissionAmount.toString(),
                type: "Commission",
                status: "Completed",
                txHash: null,
                userId: referrer.id
              };
              await storage.createTransaction(commissionTransaction);
            }
          }
        }
      }
      const transactionToCreate = {
        amount: transactionData.amount.toString(),
        type: transactionData.type,
        status: transactionData.status,
        txHash: null,
        userId: req.user.id
      };
      const transaction = await storage.createTransaction(transactionToCreate);
      const response = {
        success: true,
        transaction
      };
      if (transactionData.type === "Deposit" && !hasDeposits) {
        response.welcomeBonus = {
          amount: (transactionData.amount * 0.1).toFixed(2),
          percentage: "10%"
        };
      }
      res.status(201).json(response);
    } catch (err) {
      console.error("Error creating transaction:", err);
      res.status(400).json({ message: err.message });
    }
  });
  app2.post("/api/verify/upload", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      await storage.updateUser(req.user.id, {
        verificationStatus: "pending",
        verificationSubmittedAt: /* @__PURE__ */ new Date()
      });
      res.status(200).json({ message: "Document uploaded successfully" });
    } catch (error) {
      console.error("Verification upload error:", error);
      res.status(500).json({ error: "Failed to upload verification document" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  const host = process.env.HOST || "127.0.0.1";
  server.listen({ port, host, reusePort: true }, () => {
    log(`serving on ${host}:${port}`);
  });
})();
