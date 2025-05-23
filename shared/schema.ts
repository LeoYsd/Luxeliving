import { pgTable, text, serial, integer, boolean, date, timestamp, json, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  isAdmin: boolean("is_admin").default(false),
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
  isAdmin: true,
});

// Property schema
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  propertyType: text("property_type").notNull(), // e.g., Apartment, Villa, Bungalow
  listingType: text("listing_type").notNull(), // Entire place, Private room, Shared room
  
  // Location details
  fullAddress: text("full_address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  country: text("country").notNull(),
  zipCode: text("zip_code"),
  location: text("location").notNull(), // For display purposes/summaries
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  
  // Accommodation details
  bedrooms: integer("bedrooms").notNull(),
  bathrooms: integer("bathrooms").notNull(),
  bedTypes: json("bed_types").$type<{type: string, count: number}[]>(), // e.g., [{type: "King", count: 1}, {type: "Twin", count: 2}]
  maxGuests: integer("max_guests").notNull(),
  squareFeet: integer("square_feet").notNull(),
  
  // Pricing details
  pricePerNight: integer("price_per_night").notNull(),
  weeklyRate: integer("weekly_rate"),
  monthlyRate: integer("monthly_rate"),
  securityDeposit: integer("security_deposit"),
  cleaningFee: integer("cleaning_fee"),
  longStayDiscount: integer("long_stay_discount"), // Percentage discount for long stays
  currency: text("currency").default("NGN"),
  
  // Availability
  minStay: integer("min_stay").default(1),
  maxStay: integer("max_stay"),
  blockedDates: json("blocked_dates").$type<string[]>(), // Array of ISO date strings
  
  // Media
  imageUrl: text("image_url").notNull(), // Primary image
  imageGallery: json("image_gallery").$type<string[]>().default([]), // Additional images
  videoUrl: text("video_url"), // Optional video tour
  
  // Amenities
  amenities: json("amenities").$type<string[]>().notNull(),
  
  // House Rules
  houseRules: json("house_rules").$type<{rule: string, allowed: boolean}[]>().default([]),
  checkInTime: text("check_in_time").default("14:00"),
  checkOutTime: text("check_out_time").default("11:00"),
  
  // Status fields
  featured: boolean("featured").default(false),
  isNew: boolean("is_new").default(false),
  isActive: boolean("is_active").default(true),
  
  // Reviews 
  reviews: json("reviews").$type<Review[]>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPropertySchema = createInsertSchema(properties).pick({
  id: true, // Include id for updates
  name: true,
  description: true,
  propertyType: true,
  listingType: true,
  fullAddress: true,
  city: true,
  state: true,
  country: true,
  zipCode: true,
  location: true,
  latitude: true,
  longitude: true,
  bedrooms: true,
  bathrooms: true,
  bedTypes: true,
  maxGuests: true,
  squareFeet: true,
  pricePerNight: true,
  weeklyRate: true,
  monthlyRate: true,
  securityDeposit: true,
  cleaningFee: true,
  longStayDiscount: true,
  currency: true,
  minStay: true,
  maxStay: true,
  blockedDates: true,
  imageUrl: true,
  imageGallery: true,
  videoUrl: true,
  amenities: true,
  houseRules: true,
  checkInTime: true,
  checkOutTime: true,
  featured: true,
  isNew: true,
  isActive: true,
  reviews: true,
});

// Booking schema
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  propertyName: text("property_name"),
  clientId: integer("client_id"),
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email").notNull(),
  checkIn: date("check_in").notNull(),
  checkOut: date("check_out").notNull(),
  guests: integer("guests").notNull(),
  totalAmount: integer("total_amount").notNull(),
  commission: integer("commission"),
  status: text("status").notNull(),
  referralCode: text("referral_code"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBookingSchema = createInsertSchema(bookings).pick({
  propertyId: true,
  clientId: true,
  clientName: true,
  clientEmail: true,
  checkIn: true,
  checkOut: true,
  guests: true,
  totalAmount: true,
  status: true,
  referralCode: true,
});

// Agent schema
export const agents = pgTable("agents", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  referralCode: text("referral_code").notNull().unique(),
  commissionRate: doublePrecision("commission_rate").notNull(),
  status: text("status").notNull(),
  registrationDate: timestamp("registration_date").defaultNow(),
  lastLoginDate: timestamp("last_login_date").defaultNow(),
});

export const insertAgentSchema = createInsertSchema(agents).pick({
  username: true,
  name: true,
  email: true,
  referralCode: true,
  commissionRate: true,
  status: true,
});

// Lead schema
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull(),
  clientName: text("client_name").notNull(),
  contact: text("contact").notNull(),
  date: timestamp("date").notNull(),
  status: text("status").notNull(),
  location: text("location"),
  notes: text("notes"),
});

export const insertLeadSchema = createInsertSchema(leads).pick({
  agentId: true,
  clientName: true,
  contact: true,
  date: true,
  status: true,
  location: true,
  notes: true,
});

// Types
export interface Review {
  name: string;
  rating: number;
  comment: string;
}

export interface AgentStats {
  agentId: number;
  referralCode: string;
  activeLeads: number;
  confirmedBookings: number;
  earnings: number;
  conversionRate: number;
  leadsChangePercentage: number;
  bookingsChangePercentage: number;
  earningsChangePercentage: number;
}

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Property = typeof properties.$inferSelect;

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type Agent = typeof agents.$inferSelect;

export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;
