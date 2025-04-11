import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import {
  insertInvestmentSchema,
  insertTransactionSchema,
  inviteCodes,
  type User,
  type Investment,
  type Transaction,
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { scrypt, timingSafeEqual, randomBytes } from "crypto";
import { promisify } from "util";
import nodemailer from "nodemailer";

const scryptAsync = promisify(scrypt);

// Helper function to compare passwords
async function comparePasswords(
  supplied: string,
  stored: string,
): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

import { registerAdminRoutes } from "./admin-routes";

export async function registerRoutes(app: Express): Promise<Server> {
  // Register admin routes
  registerAdminRoutes(app);
  // Set up authentication routes
  setupAuth(app);

  // API routes - all prefixed with /api

  // Welcome code endpoint
  app.get("/api/welcome-code", async (req, res) => {
    try {
      const welcomeCode = await storage.createWelcomeInviteCode();
      res.json({ code: welcomeCode.code });
    } catch (error) {
      console.error("Error getting welcome code:", error);
      res.status(500).json({ error: "Failed to get welcome code" });
    }
  });

  // Get crypto prices from multiple exchanges
  app.get("/api/crypto/prices", async (req, res) => {
    try {
      const [binanceRes, okxRes, huobiRes, coinbaseRes] = await Promise.all([
        fetch('https://api.binance.com/api/v3/ticker/24hr'),
        fetch('https://www.okx.com/api/v5/market/tickers?instType=SPOT&instId=BTC-USDT,ETH-USDT,BNB-USDT,XRP-USDT,ADA-USDT,SOL-USDT,DOGE-USDT,AVAX-USDT'),
        fetch('https://api.huobi.pro/market/tickers'),
        fetch('https://api.coinbase.com/v2/exchange-rates')
      ]);

      const [binanceData, okxData, huobiData, coinbaseData] = await Promise.all([
        binanceRes.json(),
        okxRes.json(),
        huobiRes.json(),
        coinbaseRes.json()
      ]);

      const formatPrice = (price: number) => Number(price.toFixed(2));
      const prices = [];

      // Process Binance data
      try {
        // Check if Binance response indicates a restriction
        if (binanceData?.code === 0 && binanceData?.msg?.includes('restricted location')) {
          console.log('Binance API not available in current region');
        } else {
          const binanceSymbols = ['BTC', 'ETH', 'BNB', 'XRP', 'ADA', 'SOL', 'DOGE', 'AVAX'];
          const binanceDataArr = Array.isArray(binanceData) ? binanceData : [];

          binanceDataArr
            .filter((item: any) => {
              const symbolMatch = binanceSymbols.find(sym => item?.symbol === `${sym}USDT`);
              return item && item.symbol && symbolMatch;
            })
            .forEach((item: any) => {
              const change24h = item.priceChangePercent ? parseFloat(item.priceChangePercent) : 0;
              prices.push({
                symbol: item.symbol.replace('USDT', ''),
                name: getCryptoName(item.symbol.replace('USDT', '')),
                price: formatPrice(parseFloat(item.lastPrice || '0')),
                change24h: change24h,
                exchange: 'BINANCE'
              });
            });
        }
      } catch (error) {
        console.error('Error processing Binance data:', error);
      }

      // Process OKX data
      try {
        const okxDataArr = okxData?.data || [];
        okxDataArr.forEach((item: any) => {
          if (item.instId && item.instId.includes('-USDT')) {
            prices.push({
              symbol: item.instId.split('-')[0],
              name: getCryptoName(item.instId.split('-')[0]),
              price: formatPrice(parseFloat(item.last)),
              change24h: parseFloat(((parseFloat(item.last) - parseFloat(item.open24h)) / parseFloat(item.open24h) * 100).toFixed(2)),
              exchange: 'OKX'
            });
          }
        });
      } catch (error) {
        console.error('Error processing OKX data:', error);
      }

      // Process Huobi data
      try {
        const huobiDataArr = huobiData?.data || [];
        huobiDataArr
          .filter((item: any) => item && item.symbol && item.symbol.endsWith('usdt'))
          .forEach((item: any) => {
            let change24h = 0;
            if (item.close && item.open) {
              const close = parseFloat(item.close);
              const open = parseFloat(item.open);
              if (!isNaN(close) && !isNaN(open) && open !== 0) {
                change24h = parseFloat(((close - open) / open * 100).toFixed(2));
              }
            }
            prices.push({
              symbol: item.symbol.replace('usdt', '').toUpperCase(),
              name: getCryptoName(item.symbol.replace('usdt', '').toUpperCase()),
              price: formatPrice(parseFloat(item.close || '0')),
              change24h: change24h,
              exchange: 'HUOBI'
            });
          });
      } catch (error) {
        console.error('Error processing Huobi data:', error);
      }

      // Process Coinbase data
      try {
        const relevantSymbols = ['BTC', 'ETH', 'BNB', 'XRP', 'ADA', 'SOL', 'DOGE', 'AVAX'];
        const usdRate = parseFloat(coinbaseData.data.rates.USD);

        relevantSymbols.forEach(symbol => {
          if (coinbaseData.data.rates[symbol]) {
            prices.push({
              symbol,
              name: getCryptoName(symbol),
              price: formatPrice(1 / (parseFloat(coinbaseData.data.rates[symbol]) * usdRate)),
              change24h: 0,
              exchange: 'COINBASE'
            });
          }
        });
      } catch (error) {
        console.error('Error processing Coinbase data:', error);
      }

      res.json(prices);

      function getCryptoName(symbol: string): string {
        const names: { [key: string]: string } = {
          'BTC': 'Bitcoin',
          'ETH': 'Ethereum',
          'BNB': 'Binance Coin',
          'XRP': 'Ripple',
          'ADA': 'Cardano',
          'SOL': 'Solana',
          'DOGE': 'Dogecoin',
          'AVAX': 'Avalanche'
        };
        return names[symbol] || symbol;
      }
    } catch (error) {
      console.error('Error fetching crypto prices:', error);
      res.status(500).json({ error: 'Failed to fetch crypto prices' });
    }
  });

  // Get investment plans
  app.get("/api/investment/plans", (req, res) => {
    const plans = [
      {
        id: "vip1",
        name: "VIP 1",
        minAmount: 50,
        maxAmount: 500000,
        dailyRate: 3.0,
        vipLevel: 1,
        description: "Earn 3% daily on your investment with $50 minimum",
      },
    ];

    res.json(plans);
  });

  // Create new investment - protected route
  app.post("/api/investment", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");

    try {
      console.log("Investment data received:", req.body);

      // Validate request data
      const { amount, plan, dailyRate } = req.body;

      if (typeof amount !== "number" || amount < 50) {
        return res
          .status(400)
          .json({ error: "Investment amount must be at least $50" });
      }

      if (typeof plan !== "string" || !plan) {
        return res.status(400).json({ error: "Investment plan is required" });
      }

      if (typeof dailyRate !== "number" || dailyRate <= 0) {
        return res
          .status(400)
          .json({ error: "Daily rate must be a positive number" });
      }

      // Verify the user has enough funds
      const user = await storage.getUser(req.user!.id);
      if (!user) return res.status(404).send("User not found");

      if (parseFloat(user.totalAssets.toString()) < amount) {
        return res.status(400).json({ error: "Insufficient funds" });
      }

      // Check if user has made an investment in the last 24 hours
      if (user.lastInvestmentDate) {
        const lastInvestment = new Date(user.lastInvestmentDate);
        const currentTime = new Date();
        const timeDifference = currentTime.getTime() - lastInvestment.getTime();
        const hoursDifference = timeDifference / (1000 * 60 * 60);

        if (hoursDifference < 24) {
          const timeRemaining = Math.ceil(24 - hoursDifference);
          return res.status(400).json({
            error: `You can only create one investment every 24 hours. Please try again in ${timeRemaining} hour${timeRemaining === 1 ? "" : "s"}.`,
          });
        }
      }

      // Create the investment with correct data structure
      const investmentToCreate = {
        amount: amount,
        plan: plan,
        dailyRate: dailyRate,
        userId: req.user!.id,
        status: "Active",
      };

      const investment = await storage.createInvestment(investmentToCreate);

      // Get the VIP level from the plan ID (e.g., "vip1" -> 1, "vip2" -> 2)
      const vipLevel = parseInt(plan.replace("vip", "")) || 1;

      // Calculate immediate profit based on VIP level
      // Higher VIP levels get higher instant profit percentages
      let instantProfitPercentage = 0.03; // Default for VIP 1 (3%)

      if (vipLevel >= 2 && vipLevel <= 3) {
        instantProfitPercentage = 0.04; // 4% for VIP 2-3
      } else if (vipLevel >= 4 && vipLevel <= 5) {
        instantProfitPercentage = 0.05; // 5% for VIP 4-5
      } else if (vipLevel >= 6 && vipLevel <= 7) {
        instantProfitPercentage = 0.06; // 6% for VIP 6-7
      } else if (vipLevel >= 8) {
        instantProfitPercentage = 0.07; // 7% for VIP 8+
      }

      const instantProfit = amount * instantProfitPercentage;

      // Update user assets with immediate profit, investment amount, and last investment date
      await storage.updateUser(req.user!.id, {
        quantitativeAssets: (
          parseFloat(user.quantitativeAssets.toString()) + amount
        ).toString(),
        totalAssets: (
          parseFloat(user.totalAssets.toString()) + instantProfit
        ).toString(),
        profitAssets: (
          parseFloat(user.profitAssets.toString()) + instantProfit
        ).toString(),
        todayEarnings: (
          parseFloat(user.todayEarnings.toString()) + instantProfit
        ).toString(),
        lastInvestmentDate: new Date(),
      });

      // Create profit transaction record for the instant profit
      const profitTransaction = {
        userId: user.id,
        type: "Profit" as const,
        amount: instantProfit.toString(),
        status: "Completed" as const,
        txHash: null,
      };

      await storage.createTransaction(profitTransaction);

      // Handle referral commission if user has a referrer (12% commission for 1st level)
      if (user.inviteCode) {
        // Find the invite code that this user used
        const usedInviteCode = await storage.getInviteCode(user.inviteCode);

        if (usedInviteCode && usedInviteCode.createdById) {
          // Find the referrer user
          const referrer = await storage.getUser(usedInviteCode.createdById);

          if (referrer) {
            // Calculate 12% commission on the investment amount
            const commissionAmount = amount * 0.12;

            // Update referrer's commission assets
            await storage.updateUser(referrer.id, {
              commissionAssets: (
                parseFloat(referrer.commissionAssets.toString()) +
                commissionAmount
              ).toString(),
              commissionToday: (
                parseFloat(referrer.commissionToday.toString()) +
                commissionAmount
              ).toString(),
              totalAssets: (
                parseFloat(referrer.totalAssets.toString()) + commissionAmount
              ).toString(),
            });

            // Create commission transaction record for the referrer
            const commissionTransaction = {
              userId: referrer.id,
              type: "Commission" as const,
              amount: commissionAmount.toString(),
              status: "Completed" as const,
              txHash: null,
            };

            await storage.createTransaction(commissionTransaction);

            console.log(
              `Awarded ${commissionAmount} commission to referrer ID ${referrer.id} for investment by user ID ${user.id}`,
            );
          }
        }
      }

      // Return investment with the profit info
      res.status(201).json({
        ...investment,
        instantProfit: instantProfit,
      });
    } catch (err) {
      console.error("Investment creation error:", err);
      res.status(400).json({ error: (err as Error).message });
    }
  });

  // Get user investments - protected route
  app.get("/api/investment", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");

    const investments = await storage.getInvestmentsByUserId(req.user!.id);
    res.json(investments);
  });

  // Get user referrals - protected route
  app.get("/api/referrals", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");

    const referrals = await storage.getReferralsByReferrerId(req.user!.id);
    res.json(referrals);
  });

  // Create transaction (deposit/withdrawal) - protected route
  app.post("/api/transaction", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");

    try {
      const transactionData = insertTransactionSchema.parse(req.body);

      // Handle different transaction types
      const user = await storage.getUser(req.user!.id);
      if (!user) return res.status(404).send("User not found");

      if (transactionData.type === "Withdrawal") {
        // Check sufficient funds for withdrawal
        if (
          parseFloat(user.totalAssets.toString()) <
          parseFloat(transactionData.amount.toString())
        ) {
          return res.status(400).send("Insufficient funds for withdrawal");
        }

        // Update user assets for withdrawal
        await storage.updateUser(req.user!.id, {
          totalAssets: (
            parseFloat(user.totalAssets.toString()) -
            parseFloat(transactionData.amount.toString())
          ).toString(),
        });
      } else if (transactionData.type === "Deposit") {
        // Update user assets for deposit
        await storage.updateUser(req.user!.id, {
          totalAssets: (
            parseFloat(user.totalAssets.toString()) +
            parseFloat(transactionData.amount.toString())
          ).toString(),
          rechargeAmount: (
            parseFloat(user.rechargeAmount.toString()) +
            parseFloat(transactionData.amount.toString())
          ).toString(),
        });
      }

      // Create the transaction record with correct data structure
      const transactionToCreate = {
        amount: transactionData.amount,
        type: transactionData.type,
        status: transactionData.status,
        txHash: transactionData.txHash ?? null,
        userId: req.user!.id,
      };
      const transaction = await storage.createTransaction(transactionToCreate);

      res.status(201).json(transaction);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  // Get user transactions - protected route
  app.get("/api/transactions", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");

    const transactions = await storage.getTransactionsByUserId(req.user!.id);
    res.json(transactions);
  });

  // Generate invite code - protected route
  app.post("/api/invite-code", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");

    try {
      // Generate a random 6-character invite code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();

      const inviteCode = await storage.createInviteCode({
        code,
        createdById: req.user!.id,
      });

      res.status(201).json(inviteCode);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  // Get my invite codes - protected route
  app.get("/api/invite-codes", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");

    try {
      // Query invite codes by createdById
      const codes = await db
        .select()
        .from(inviteCodes)
        .where(eq(inviteCodes.createdById, req.user!.id));

      res.json(codes);
    } catch (err) {
      console.error("Error fetching invite codes:", err);
      res.status(500).json({ error: "Failed to fetch invite codes" });
    }
  });

  // Reset password route
  app.post("/api/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;

      // Find user by reset token and check if it's still valid
      const user = await storage.getUserByResetToken(token);

      if (!user || !user.resetTokenExpiry || new Date() > new Date(user.resetTokenExpiry)) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      // Hash the new password
      const salt = randomBytes(16).toString("hex");
      const hashedPassword = (await scryptAsync(password, salt, 64)) as Buffer;
      const newHashedPassword = `${hashedPassword.toString("hex")}.${salt}`;

      // Update user's password and clear reset token
      await storage.updateUser(user.id, {
        password: newHashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        updatedAt: new Date()
      });

      res.json({ message: "Password reset successful" });
    } catch (err) {
      console.error("Reset password error:", err);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Forgot password route
  app.post("/api/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;

      // Find user by email
      const user = await storage.getUserByEmail(email);

      if (user) {
        // Generate reset token
        const resetToken = randomBytes(32).toString('hex');
        const resetExpiry = new Date(Date.now() + 3600000); // 1 hour

        // Store reset token and expiry in the database
        await storage.updateUser(user.id, {
          resetToken: resetToken,
          resetTokenExpiry: resetExpiry,
          updatedAt: new Date()
        });

        // Create nodemailer transporter
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
          }
        });

        // Send reset email
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Password Reset Request',
          html: `
            <h1>Password Reset</h1>
            <p>You requested a password reset. Click the link below to reset your password:</p>
            <a href="${process.env.APP_URL}/reset-password?token=${resetToken}">Reset Password</a>
            <p>This link will expire in 1 hour.</p>
            <p>If you did not request this reset, please ignore this email.</p>
          `
        });
      }

      // Always return success to prevent email enumeration
      res.json({ message: "If an account exists with this email, you will receive reset instructions" });
    } catch (err) {
      console.error("Password reset error:", err);
      res.status(500).json({ error: "Failed to process password reset" });
    }
  });

  // Get user account information - protected route
  app.get("/api/account", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");

    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) return res.status(404).send("User not found");

      // Get investments, transactions, and referrals
      const investments = await storage.getInvestmentsByUserId(user.id);
      const transactions = await storage.getTransactionsByUserId(user.id);
      const referrals = await storage.getReferralsByReferrerId(user.id);

      // Calculate total earnings and other statistics
      const totalInvested = investments.reduce(
        (sum, inv) => sum + parseFloat(inv.amount.toString()),
        0,
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
          createdAt: user.createdAt,
        },
        stats: {
          totalInvested,
          currentBalance,
          totalProfit,
          activeInvestments: investments.filter(
            (inv) => inv.status === "Active",
          ).length,
          referralsCount: referrals.length,
        },
      });
    } catch (err) {
      console.error("Error fetching account info:", err);
      res.status(500).json({ error: "Failed to fetch account information" });
    }
  });

  // Update account information - protected route
  app.patch("/api/account", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");

    try {
      const { email, phone, telegram } = req.body;
      const userData: Partial<User> = {};

      if (email) userData.email = email;
      if (phone) userData.phone = phone;
      if (telegram) userData.telegram = telegram;

      const updatedUser = await storage.updateUser(req.user!.id, userData);
      if (!updatedUser) return res.status(404).send("User not found");

      // Return user without sensitive data
      const { password, securityPassword, ...userWithoutPasswords } =
        updatedUser;
      res.json(userWithoutPasswords);
    } catch (err) {
      console.error("Error updating account:", err);
      res.status(500).json({ error: "Failed to update account information" });
    }
  });

  // Get dashboard statistics - protected route
  app.get("/api/dashboard/stats", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");

    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) return res.status(404).send("User not found");

      const investments = await storage.getInvestmentsByUserId(user.id);
      const activeInvestments = investments.filter(
        (inv) => inv.status === "Active",
      );
      const referrals = await storage.getReferralsByReferrerId(user.id);

      res.json({
        totalAssets: user.totalAssets,
        quantitativeAssets: user.quantitativeAssets,
        profitAssets: user.profitAssets,
        todayEarnings: user.todayEarnings,
        yesterdayEarnings: user.yesterdayEarnings,
        commissionToday: user.commissionToday,
        activeInvestmentsCount: activeInvestments.length,
        referralsCount: referrals.length,
      });
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
      res.status(500).json({ error: "Failed to fetch dashboard statistics" });
    }
  });

  // Simulate daily earnings for active investments - protected route
  // (In production, this would be a cron job or scheduled task)
  app.post("/api/simulate-earnings", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");

    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) return res.status(404).send("User not found");

      const investments = await storage.getInvestmentsByUserId(user.id);
      const activeInvestments = investments.filter(
        (inv) => inv.status === "Active",
      );

      let totalEarnings = 0;

      // Calculate earnings for each active investment
      for (const investment of activeInvestments) {
        const dailyRate = parseFloat(investment.dailyRate.toString()) / 100;
        const amount = parseFloat(investment.amount.toString());
        const dailyEarning = amount * dailyRate;
        totalEarnings += dailyEarning;
      }

      // Update user's earnings
      const updatedUser = await storage.updateUser(user.id, {
        yesterdayEarnings: user.todayEarnings.toString(),
        todayEarnings: totalEarnings.toString(),
        profitAssets: (
          parseFloat(user.profitAssets.toString()) + totalEarnings
        ).toString(),
        totalAssets: (
          parseFloat(user.totalAssets.toString()) + totalEarnings
        ).toString(),
      });

      // Create profit transaction record
      if (totalEarnings > 0) {
        const profitTransaction: Omit<Transaction, "id" | "createdAt"> = {
          userId: user.id,
          type: "Profit",
          amount: totalEarnings.toString(),
          status: "Completed",
          txHash: null,
        };
        await storage.createTransaction(profitTransaction);
      }

      res.json({
        success: true,
        dailyEarnings: totalEarnings,
        totalProfitAssets: updatedUser?.profitAssets || "0",
      });
    } catch (err) {
      console.error("Error simulating earnings:", err);
      res.status(500).json({ error: "Failed to simulate earnings" });
    }
  });

  // Get user profile - protected route
  app.get("/api/profile", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");

    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) return res.status(404).send("User not found");

      // Get referrals with referred user details
      const referrals = await storage.getReferralsByReferrerId(user.id);
      const referralDetails = [];

      for (const referral of referrals) {
        const referredUser = await storage.getUser(referral.referredId);
        if (referredUser) {
          referralDetails.push({
            id: referral.id,
            level: referral.level,
            commission: referral.commission,
            referredUser: {
              id: referredUser.id,
              username: referredUser.username,
              createdAt: referredUser.createdAt,
            },
          });
        }
      }

      // Return user profile data
      const { password, securityPassword, ...userWithoutPasswords } = user;
      res.json({
        profile: userWithoutPasswords,
        referrals: referralDetails,
      });
    } catch (err) {
      console.error("Error fetching profile:", err);
      res.status(500).json({ error: "Failed to fetch profile information" });
    }
  });

  // Verify security password - protected route
  app.post("/api/verify-security-password", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");

    try {
      const { securityPassword } = req.body;

      if (!securityPassword) {
        return res
          .status(400)
          .json({ message: "Security password is required" });
      }

      const user = await storage.getUser(req.user!.id);
      if (!user) return res.status(404).json({ message: "User not found" });

      // Verify security password
      const isValid = await comparePasswords(
        securityPassword,
        user.securityPassword,
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

  // Create transaction (deposit/withdrawal) - protected route
  app.post("/api/transactions", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");

    try {
      const schema = z.object({
        type: z.enum(["Deposit", "Withdrawal"]),
        amount: z.number().min(0.01),
        status: z.enum(["Pending", "Completed", "Failed"]),
        network: z.string().optional(),
        address: z.string().optional(),
        fee: z.number().optional(),
      });

      const transactionData = schema.parse(req.body);

      // Handle different transaction types
      const user = await storage.getUser(req.user!.id);
      if (!user) return res.status(404).send("User not found");

      // Get existing transactions to check for first deposit
      const existingTransactions = await storage.getTransactionsByUserId(
        req.user!.id,
      );
      const hasDeposits = existingTransactions.some(
        (t) => t.type === "Deposit",
      );

      if (transactionData.type === "Withdrawal") {
        // Check if withdrawal is on Friday in Taiwan timezone
        const nowInTaiwan = new Date(
          new Date().toLocaleString("en-US", { timeZone: "Asia/Taipei" }),
        );
        const dayOfWeek = nowInTaiwan.getDay(); // 0 is Sunday, 5 is Friday

        if (dayOfWeek !== 5) {
          return res.status(400).json({
            message:
              "Withdrawals are only allowed on Fridays (Taiwan Time Zone UTC+8)",
          });
        }

        // Check for minimum withdrawal
        if (transactionData.amount < 3) {
          return res.status(400).json({
            message: "Minimum withdrawal amount is $3",
          });
        }

        // Check sufficient funds for withdrawal
        const totalAmount = transactionData.amount + (transactionData.fee || 0);
        if (parseFloat(user.totalAssets.toString()) < totalAmount) {
          return res
            .status(400)
            .json({ message: "Insufficient funds for withdrawal" });
        }

        // For withdrawals, we would update the user's balance immediately in a real application
        // but for this demo, we'll leave the balance unchanged until the withdrawal is "processed"
        // as it would typically go through admin approval
      } else if (transactionData.type === "Deposit") {
        // Check for minimum deposit
        if (transactionData.amount < 50) {
          return res.status(400).json({
            message: "Minimum deposit amount is $50",
          });
        }

        // Add 10% welcome bonus for first deposit
        let depositAmount = transactionData.amount;
        let bonusAmount = 0;

        if (!hasDeposits) {
          bonusAmount = depositAmount * 0.1; // 10% bonus
          depositAmount += bonusAmount;

          // Update user's total assets including bonus
          await storage.updateUser(req.user!.id, {
            totalAssets: (
              parseFloat(user.totalAssets.toString()) + depositAmount
            ).toString(),
            rechargeAmount: (
              parseFloat(user.rechargeAmount.toString()) +
              transactionData.amount
            ).toString(),
          });

          // Create bonus transaction record
          const bonusTransaction = {
            amount: bonusAmount.toString(),
            type: "Bonus" as const,
            status: "Completed" as const,
            txHash: null,
            userId: req.user!.id,
          };

          await storage.createTransaction(bonusTransaction);
        } else {
          // Regular deposit without bonus
          await storage.updateUser(req.user!.id, {
            totalAssets: (
              parseFloat(user.totalAssets.toString()) + depositAmount
            ).toString(),
            rechargeAmount: (
              parseFloat(user.rechargeAmount.toString()) +
              transactionData.amount
            ).toString(),
          });
        }

        // Process referral commissions
        // Find referrers who referred this user (level 1)
        const referrals = await storage.getReferralsByReferredId(req.user!.id);

        for (const referral of referrals) {
          if (referral.level === "1") {
            // Get referrer
            const referrer = await storage.getUser(referral.referrerId);
            if (!referrer) continue;

            // Calculate commission (12% of deposit for level 1 referrals)
            const commissionRate = 0.12; // 12% fixed rate for level 1 referrals
            const commissionAmount = transactionData.amount * commissionRate;

            if (commissionAmount > 0) {
              // Update referrer's assets and commission stats
              await storage.updateUser(referrer.id, {
                totalAssets: (
                  parseFloat(referrer.totalAssets.toString()) + commissionAmount
                ).toString(),
                commissionAssets: (
                  parseFloat(referrer.commissionAssets.toString()) +
                  commissionAmount
                ).toString(),
                commissionToday: (
                  parseFloat(referrer.commissionToday.toString()) +
                  commissionAmount
                ).toString(),
              });

              // Create commission transaction record
              const commissionTransaction = {
                amount: commissionAmount.toString(),
                type: "Commission" as const,
                status: "Completed" as const,
                txHash: null,
                userId: referrer.id,
              };

              await storage.createTransaction(commissionTransaction);
            }
          }
        }
      }

      // Create the transaction record with correct data structure
      const transactionToCreate = {
        amount: transactionData.amount.toString(),
        type: transactionData.type,
        status: transactionData.status,
        txHash: null,
        userId: req.user!.id,
      };

      const transaction = await storage.createTransaction(transactionToCreate);

      const response: any = {
        success: true,
        transaction,
      };

      // Add bonus info if applicable
      if (transactionData.type === "Deposit" && !hasDeposits) {
        response.welcomeBonus = {
          amount: (transactionData.amount * 0.1).toFixed(2),
          percentage: "10%",
        };
      }

      res.status(201).json(response);
    } catch (err) {
      console.error("Error creating transaction:", err);
      res.status(400).json({ message: (err as Error).message });
    }
  });

  // This endpoint has been moved to the top of the file

  // Verification upload endpoint
  app.post("/api/verify/upload", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");

    try {
      // Here you would typically:
      // 1. Handle file upload (using multer or similar)
      // 2. Store the file securely
      // 3. Update user verification status
      // 4. Queue the document for review

      // For demo purposes, we'll just acknowledge the upload
      await storage.updateUser(req.user!.id, {
        verificationStatus: 'pending',
        verificationSubmittedAt: new Date(),
      });

      res.status(200).json({ message: "Document uploaded successfully" });
    } catch (error) {
      console.error("Verification upload error:", error);
      res.status(500).json({ error: "Failed to upload verification document" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
