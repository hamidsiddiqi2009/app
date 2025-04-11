import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, insertUserSchema } from "@shared/schema";
import { randomUUID } from "crypto";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || randomUUID(),
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure multiple local strategies for different login methods
  passport.use('local-username', new LocalStrategy(
    async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: 'Invalid username or password' });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  ));

  passport.use('local-email', new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: 'Invalid email or password' });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  ));

  passport.use('local-phone', new LocalStrategy(
    { usernameField: 'phone' },
    async (phone, password, done) => {
      try {
        const user = await storage.getUserByPhone(phone);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: 'Invalid phone or password' });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  ));

  passport.use('local-telegram', new LocalStrategy(
    { usernameField: 'telegram' },
    async (telegram, password, done) => {
      try {
        const user = await storage.getUserByTelegram(telegram);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: 'Invalid Telegram ID or password' });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  ));

  passport.serializeUser((user, done) => done(null, user.id));

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Register route
  app.post("/api/register", async (req, res, next) => {
    try {
      const userData = insertUserSchema.parse(req.body);

      // Validate invite code
      const inviteCode = await storage.getInviteCode(userData.inviteCode);
      if (!inviteCode) {
        return res.status(400).json({ message: "Invalid invite code" });
      }

      // We no longer check if the code is already used, as we're allowing reuse of invite codes

      // Check if user exists
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

      // Hash the passwords
      const hashedPassword = await hashPassword(userData.password);
      const hashedSecurityPassword = await hashPassword(userData.securityPassword);

      // Create user
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
        securityPassword: hashedSecurityPassword,
        referralCode: storage.generateReferralCode() // Added referral code generation
      });

      // Validate the invite code is valid
      await storage.useInviteCode(userData.inviteCode, user.id);

      // Add referral if the invite code has a creator
      if (inviteCode.createdById) {
        await storage.createReferral({
          referrerId: inviteCode.createdById,
          referredId: user.id,
          level: "1",
          commission: "12" // 12% commission for level 1 referrals
        });
      }

      // Login the user
      req.login(user, (err) => {
        if (err) return next(err);

        // Return user without sensitive data
        const { password, securityPassword, ...userWithoutPasswords } = user;
        res.status(201).json(userWithoutPasswords);
      });
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  });

  // Login routes for different auth methods
  app.post("/api/login/username", 
    passport.authenticate('local-username', { failWithError: true }),
    (req, res) => {
      // Return user without sensitive data
      const { password, securityPassword, ...userWithoutPasswords } = req.user as SelectUser;
      res.status(200).json(userWithoutPasswords);
    },
    (err, req, res, next) => {
      res.status(401).json({ message: "Invalid username or password" });
    }
  );

  app.post("/api/login/email", 
    passport.authenticate('local-email', { failWithError: true }),
    (req, res) => {
      // Return user without sensitive data
      const { password, securityPassword, ...userWithoutPasswords } = req.user as SelectUser;
      res.status(200).json(userWithoutPasswords);
    },
    (err, req, res, next) => {
      res.status(401).json({ message: "Invalid email or password" });
    }
  );

  app.post("/api/login/phone", 
    passport.authenticate('local-phone', { failWithError: true }),
    (req, res) => {
      // Return user without sensitive data
      const { password, securityPassword, ...userWithoutPasswords } = req.user as SelectUser;
      res.status(200).json(userWithoutPasswords);
    },
    (err, req, res, next) => {
      res.status(401).json({ message: "Invalid phone or password" });
    }
  );

  app.post("/api/login/telegram", 
    passport.authenticate('local-telegram', { failWithError: true }),
    (req, res) => {
      // Return user without sensitive data
      const { password, securityPassword, ...userWithoutPasswords } = req.user as SelectUser;
      res.status(200).json(userWithoutPasswords);
    },
    (err, req, res, next) => {
      res.status(401).json({ message: "Invalid Telegram ID or password" });
    }
  );

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    // Return user without sensitive data
    const { password, securityPassword, ...userWithoutPasswords } = req.user as SelectUser;
    res.json(userWithoutPasswords);
  });
}