import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage_db";
import { getChatbotReply } from "./whatsapp";
import session from "express-session";
import { z } from "zod";
import { insertUserSchema, insertPropertySchema, insertAgentSchema } from "@shared/schema";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import cors from "cors";

// Helper functions for password hashing
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

// Authentication middleware
function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.session && req.session.userId) {
    next();
  } else {
    res.status(401).json({ message: "Not authenticated" });
  }
}

// Admin middleware
function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.session && req.session.userId && req.session.isAdmin) {
    next();
  } else {
    res.status(403).json({ message: "Not authorized" });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup CORS for development
  app.use(cors({
    origin: process.env.NODE_ENV === "development" ? "http://localhost:8080" : undefined,
    credentials: true
  }));

  // Setup Session
  const sessionSecret = process.env.SESSION_SECRET || "luxe-living-secret-key";
  app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    }
  }));

  // Sessions will include userId and isAdmin

  // API Routes
  const apiRouter = express.Router();
  
  // Auth endpoints
  apiRouter.post("/register", async (req, res) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid user data", errors: result.error.errors });
      }

      const { username, password, email, fullName, isAdmin } = result.data;
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Create user with hashed password
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        email,
        fullName,
        isAdmin: isAdmin || false,
      });
      
      // Set session
      if (req.session) {
        req.session.userId = user.id;
        req.session.isAdmin = user.isAdmin || false;
      }
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to register user" });
    }
  });
  
  apiRouter.post("/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      // Find user by username
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Verify password
      const passwordMatch = await comparePasswords(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Set session
      if (req.session) {
        req.session.userId = user.id;
        req.session.isAdmin = user.isAdmin || false;
      }
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });
  
  apiRouter.post("/logout", (req, res) => {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: "Failed to logout" });
        }
        res.json({ message: "Logged out successfully" });
      });
    } else {
      res.json({ message: "Already logged out" });
    }
  });
  
  apiRouter.get("/user", async (req, res) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user data" });
    }
  });
  
  
  // Admin-specific property management endpoints
  apiRouter.post("/properties", isAdmin, async (req, res) => {
    try {
      const result = insertPropertySchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid property data", errors: result.error.errors });
      }
      
      const propertyData = result.data;
      const newProperty = await storage.createProperty(propertyData);
      res.status(201).json(newProperty);
    } catch (error) {
      console.error("Create property error:", error);
      res.status(500).json({ message: "Failed to create property" });
    }
  });
  
  apiRouter.put("/properties/:id", isAdmin, async (req, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      
      // Check if property exists
      const existingProperty = await storage.getPropertyById(propertyId);
      if (!existingProperty) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      const result = insertPropertySchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid property data", errors: result.error.errors });
      }
      
      // For now, since we don't have an update method in our storage interface,
      // we'll just replace the whole property. In a real app with a database,
      // you would use an update query.
      const updatedProperty = await storage.createProperty({
        ...result.data,
        id: propertyId
      });
      
      res.json(updatedProperty);
    } catch (error) {
      console.error("Update property error:", error);
      res.status(500).json({ message: "Failed to update property" });
    }
  });
  
  apiRouter.delete("/properties/:id", isAdmin, async (req, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      
      // Check if property exists
      const existingProperty = await storage.getPropertyById(propertyId);
      if (!existingProperty) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      // For now, since we don't have a delete method in our storage interface,
      // we'll just return a success response. In a real app with a database,
      // you would delete the property from the database.
      res.json({ message: "Property deleted successfully" });
    } catch (error) {
      console.error("Delete property error:", error);
      res.status(500).json({ message: "Failed to delete property" });
    }
  });
  
  // Public properties endpoints
  apiRouter.get("/properties", async (req, res) => {
    try {
      const properties = await storage.getAllProperties();
      res.json(properties);
    } catch (error) {
      console.error("Get properties error:", error);
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });

  apiRouter.get("/properties/featured", async (req, res) => {
    try {
      const properties = await storage.getFeaturedProperties();
      res.json(properties);
    } catch (error) {
      console.error("Get featured properties error:", error);
      res.status(500).json({ message: "Failed to fetch featured properties" });
    }
  });

  apiRouter.get("/properties/:id", async (req, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const property = await storage.getPropertyById(propertyId);
      
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      res.json(property);
    } catch (error) {
      console.error("Get property error:", error);
      res.status(500).json({ message: "Failed to fetch property" });
    }
  });

  apiRouter.post("/properties/recommend", async (req, res) => {
    try {
      const { query } = req.body;
      if (!query) {
        return res.status(400).json({ message: "Query is required" });
      }
      
      const properties = await storage.getAllProperties();
      // For now, return the first 3 properties (in a real app, we'd use AI to filter properties)
      const recommendedProperties = properties.slice(0, 3).map(p => p.id);
      
      res.json({
        propertyIds: recommendedProperties,
        message: `Here are some properties that match: "${query}"`
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get property recommendations" });
    }
  });

  // Booking endpoints
  apiRouter.post("/bookings", isAuthenticated, async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { referralCode, ...bookingData } = req.body;
      let agent = null;

      // If referral code is provided, validate it and get the agent
      if (referralCode) {
        agent = await storage.getAgentByReferralCode(referralCode);
        if (!agent) {
          return res.status(400).json({ message: "Invalid referral code" });
        }
      }

      const booking = await storage.createBooking({
        ...bookingData,
        clientId: req.session.userId,
        referralCode: agent?.referralCode,
        commission: agent ? Math.round(bookingData.totalAmount * agent.commissionRate) : 0
      });

      res.status(201).json(booking);
    } catch (error) {
      console.error("Create booking error:", error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  apiRouter.get("/bookings", isAuthenticated, async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const bookings = await storage.getBookingsByClientId(req.session.userId);
      res.json(bookings);
    } catch (error) {
      console.error("Get bookings error:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  apiRouter.get("/bookings/:id", isAuthenticated, async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const bookingId = parseInt(req.params.id);
      const booking = await storage.getBookingById(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Check if the booking belongs to the user
      if (booking.clientId !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized to view this booking" });
      }
      
      res.json(booking);
    } catch (error) {
      console.error("Get booking error:", error);
      res.status(500).json({ message: "Failed to fetch booking" });
    }
  });

  // Agent endpoints
  apiRouter.get("/agent/stats", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const agent = await storage.getAgentById(req.session.userId);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }

      const bookings = await storage.getBookingsByAgentId(agent.id);
      const totalCommission = bookings.reduce((sum, booking) => sum + (booking.commission || 0), 0);
      const confirmedBookings = bookings.filter(b => b.status === "Confirmed");
      const pendingBookings = bookings.filter(b => b.status === "Pending");

      const stats = {
        totalBookings: bookings.length,
        confirmedBookings: confirmedBookings.length,
        pendingBookings: pendingBookings.length,
        totalCommission,
        recentBookings: bookings.slice(0, 5),
        referralCode: agent.referralCode
      };

      res.json(stats);
    } catch (error) {
      console.error("Get agent stats error:", error);
      res.status(500).json({ message: "Failed to fetch agent stats" });
    }
  });

  apiRouter.get("/agent/leads", async (req, res) => {
    try {
      // Hard-coded agent ID for demo purposes
      const agentId = 1;
      const leads = await storage.getLeadsByAgentId(agentId);
      res.json(leads);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch agent leads" });
    }
  });

  apiRouter.get("/agent/bookings", async (req, res) => {
    try {
      // Hard-coded agent ID for demo purposes
      const agentId = 1;
      const bookings = await storage.getBookingsByAgentId(agentId);
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch agent bookings" });
    }
  });

  // Chat endpoints
  apiRouter.post("/chat", async (req, res) => {
    try {
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }
      
      const reply = await getChatbotReply(message);
      res.json({ reply });
    } catch (error) {
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  // Agent registration endpoint
  apiRouter.post("/agent/register", async (req, res) => {
    try {
      const result = insertAgentSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid agent data", errors: result.error.errors });
      }

      const { username, name, email, referralCode, commissionRate, status } = result.data;
      
      // Check if referral code already exists
      const existingAgent = await storage.getAgentByReferralCode(referralCode);
      if (existingAgent) {
        return res.status(400).json({ message: "Referral code already exists" });
      }
      
      // Create agent
      const agent = await storage.createAgent({
        username,
        name,
        email,
        referralCode,
        commissionRate,
        status
      });
      
      res.status(201).json(agent);
    } catch (error) {
      console.error("Agent registration error:", error);
      res.status(500).json({ message: "Failed to register agent" });
    }
  });

  // Mount API router
  app.use("/api", apiRouter);

  const httpServer = createServer(app);
  
  return httpServer;
}
