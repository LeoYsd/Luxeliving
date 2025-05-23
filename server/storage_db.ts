import { 
  type User, type InsertUser, 
  type Property, type InsertProperty,
  type Booking, type InsertBooking,
  type Agent, type InsertAgent,
  type Lead, type InsertLead,
  type AgentStats,
  users, properties, bookings, agents, leads
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Property management
  getAllProperties(): Promise<Property[]>;
  getFeaturedProperties(): Promise<Property[]>;
  getPropertyById(id: number): Promise<Property | undefined>;
  createProperty(property: InsertProperty): Promise<Property>;
  
  // Booking management
  getBookingById(id: number): Promise<Booking | undefined>;
  getBookingsByPropertyId(propertyId: number): Promise<Booking[]>;
  getBookingsByClientId(clientId: number): Promise<Booking[]>;
  getBookingsByAgentId(agentId: number): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  
  // Agent management
  getAgentById(id: number): Promise<Agent | undefined>;
  getAgentByReferralCode(referralCode: string): Promise<Agent | undefined>;
  getAgentStats(agentId: number): Promise<AgentStats>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  
  // Lead management
  getLeadById(id: number): Promise<Lead | undefined>;
  getLeadsByAgentId(agentId: number): Promise<Lead[]>;
  createLead(lead: InsertLead): Promise<Lead>;
  
  // Data initialization
  initializeData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  // Property methods
  async getAllProperties(): Promise<Property[]> {
    return await db.select().from(properties);
  }
  
  async getFeaturedProperties(): Promise<Property[]> {
    return await db.select().from(properties).where(eq(properties.featured, true));
  }
  
  async getPropertyById(id: number): Promise<Property | undefined> {
    const [property] = await db.select().from(properties).where(eq(properties.id, id));
    return property || undefined;
  }
  
  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    const [property] = await db.insert(properties).values(insertProperty).returning();
    return property;
  }
  
  // Booking methods
  async getBookingById(id: number): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking || undefined;
  }
  
  async getBookingsByPropertyId(propertyId: number): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.propertyId, propertyId));
  }
  
  async getBookingsByClientId(clientId: number): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.clientId, clientId));
  }
  
  async getBookingsByAgentId(agentId: number): Promise<Booking[]> {
    const agent = await this.getAgentById(agentId);
    if (!agent) return [];
    
    return await db.select().from(bookings).where(eq(bookings.referralCode, agent.referralCode));
  }
  
  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const property = await this.getPropertyById(insertBooking.propertyId);
    const bookingData = { 
      ...insertBooking,
      propertyName: property ? property.name : "Unknown Property",
      commission: Math.round(insertBooking.totalAmount * 0.1) // Assuming 10% commission for simplicity
    };
    
    const [booking] = await db.insert(bookings).values(bookingData).returning();
    return booking;
  }
  
  // Agent methods
  async getAgentById(id: number): Promise<Agent | undefined> {
    const [agent] = await db.select().from(agents).where(eq(agents.id, id));
    return agent || undefined;
  }
  
  async getAgentByReferralCode(referralCode: string): Promise<Agent | undefined> {
    const [agent] = await db.select().from(agents).where(eq(agents.referralCode, referralCode));
    return agent || undefined;
  }
  
  async getAgentStats(agentId: number): Promise<AgentStats> {
    const agent = await this.getAgentById(agentId);
    if (!agent) {
      throw new Error(`Agent with ID ${agentId} not found`);
    }
    
    const leads = await this.getLeadsByAgentId(agentId);
    const bookings = await this.getBookingsByAgentId(agentId);
    const confirmedBookings = bookings.filter(booking => booking.status === "Confirmed");
    
    const totalEarnings = confirmedBookings.reduce((sum, booking) => sum + (booking.commission || 0), 0);
    
    return {
      agentId,
      referralCode: agent.referralCode,
      activeLeads: leads.length,
      confirmedBookings: confirmedBookings.length,
      earnings: totalEarnings,
      conversionRate: leads.length > 0 ? (confirmedBookings.length / leads.length) * 100 : 0,
      leadsChangePercentage: 15, // Dummy data
      bookingsChangePercentage: 25, // Dummy data
      earningsChangePercentage: 10 // Dummy data
    };
  }
  
  async createAgent(insertAgent: InsertAgent): Promise<Agent> {
    const [agent] = await db.insert(agents).values({
      ...insertAgent,
      registrationDate: new Date(),
      lastLoginDate: new Date()
    }).returning();
    return agent;
  }
  
  // Lead methods
  async getLeadById(id: number): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead || undefined;
  }
  
  async getLeadsByAgentId(agentId: number): Promise<Lead[]> {
    return await db.select().from(leads).where(eq(leads.agentId, agentId));
  }
  
  async createLead(insertLead: InsertLead): Promise<Lead> {
    const [lead] = await db.insert(leads).values(insertLead).returning();
    return lead;
  }

  // Initialize seed data if needed
  async initializeData(): Promise<void> {
    // Check if we already have data
    const existingProperties = await db.select().from(properties);
    if (existingProperties.length > 0) {
      console.log("Database already contains data, skipping initialization");
      return;
    }

    console.log("Initializing database with seed data...");

    // Sample properties
    const propertiesData = [
      {
        name: "Beachfront Luxury Condo",
        description: "Elegant beachfront condo with stunning ocean views, modern amenities, and direct beach access.",
        propertyType: "Apartment",
        listingType: "Entire place",
        fullAddress: "123 Beach Road",
        city: "Lagos",
        state: "Lagos",
        country: "Nigeria",
        location: "Victoria Island, Lagos",
        pricePerNight: 75000,
        bedrooms: 2,
        bathrooms: 2,
        maxGuests: 4,
        squareFeet: 1200,
        imageUrl: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=300&q=80",
        featured: true,
        isNew: false,
        amenities: ["Wi-Fi", "Air Conditioning", "Kitchen", "Pool", "Beach Access", "Parking"],
        reviews: [
          { name: "John D.", rating: 5, comment: "Beautiful place with amazing views. Highly recommend!" },
          { name: "Sarah M.", rating: 4, comment: "Great location, very clean. The host was very responsive." }
        ]
      },
      {
        name: "Modern City Apartment",
        description: "Sleek, contemporary apartment in the heart of the city with all modern conveniences.",
        propertyType: "Apartment",
        listingType: "Entire place",
        fullAddress: "45 GRA Avenue",
        city: "Lagos",
        state: "Lagos",
        country: "Nigeria",
        location: "Ikeja GRA, Lagos",
        pricePerNight: 45000,
        bedrooms: 1,
        bathrooms: 1,
        maxGuests: 2,
        squareFeet: 800,
        imageUrl: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=300&q=80",
        featured: false,
        isNew: true,
        amenities: ["Wi-Fi", "Air Conditioning", "Kitchen", "Gym", "Security"],
        reviews: [
          { name: "Mike T.", rating: 4, comment: "Comfortable apartment in a great location." }
        ]
      },
      {
        name: "Private Beach Villa",
        description: "Luxurious villa with private beach access, perfect for family vacations or group retreats.",
        propertyType: "Villa",
        listingType: "Entire place",
        fullAddress: "7 Banana Island Road",
        city: "Lagos",
        state: "Lagos",
        country: "Nigeria",
        location: "Banana Island, Lagos",
        pricePerNight: 120000,
        bedrooms: 3,
        bathrooms: 3,
        maxGuests: 6,
        squareFeet: 2200,
        imageUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=300&q=80",
        featured: true,
        isNew: false,
        amenities: ["Wi-Fi", "Air Conditioning", "Kitchen", "Pool", "Beach Access", "Parking", "Outdoor Grill", "Security"],
        reviews: [
          { name: "Emma L.", rating: 5, comment: "Perfect getaway! The villa is spacious and the private beach is amazing." },
          { name: "David R.", rating: 5, comment: "Exceeded our expectations. Will definitely be back." }
        ]
      },
      {
        name: "Luxury Penthouse Suite",
        description: "Exclusive penthouse with panoramic city views, luxury furnishings, and top-tier amenities.",
        location: "Ikoyi, Lagos",
        pricePerNight: 95000,
        bedrooms: 2,
        bathrooms: 2,
        maxGuests: 4,
        squareFeet: 1500,
        imageUrl: "https://images.unsplash.com/photo-1600566753151-384129cf4e3e?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=300&q=80",
        featured: true,
        isNew: false,
        amenities: ["Wi-Fi", "Air Conditioning", "Kitchen", "Pool", "Gym", "Parking", "Concierge", "Security"],
        reviews: [
          { name: "Lisa H.", rating: 5, comment: "The view from this penthouse is incredible! Everything was perfect." }
        ]
      },
      {
        name: "Cozy Garden Studio",
        description: "Charming studio apartment with private garden, perfect for solo travelers or couples.",
        location: "Lekki Phase 1, Lagos",
        pricePerNight: 35000,
        bedrooms: 1,
        bathrooms: 1,
        maxGuests: 2,
        squareFeet: 600,
        imageUrl: "https://images.unsplash.com/photo-1544984243-ec57ea16fe25?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=300&q=80",
        featured: false,
        isNew: true,
        amenities: ["Wi-Fi", "Air Conditioning", "Kitchen", "Garden", "Parking"],
        reviews: []
      },
      {
        name: "Executive Business Suite",
        description: "Professional apartment with office space, high-speed internet, and business amenities.",
        location: "Victoria Island, Lagos",
        pricePerNight: 55000,
        bedrooms: 1,
        bathrooms: 1,
        maxGuests: 2,
        squareFeet: 900,
        imageUrl: "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=300&q=80",
        featured: false,
        isNew: false,
        amenities: ["Wi-Fi", "Air Conditioning", "Kitchen", "Workspace", "Business Center Access", "Parking", "Security"],
        reviews: [
          { name: "Robert P.", rating: 4, comment: "Perfect for my business trip. Well-equipped and convenient location." }
        ]
      }
    ] as const;

    // Insert properties
    for (const property of propertiesData) {
      await this.createProperty(property);
    }

    // Create sample agent
    const agent = await this.createAgent({
      username: "agent1",
      name: "John Agent",
      email: "agent1@example.com",
      referralCode: "AGT001",
      commissionRate: 0.1,
      status: "Active"
    });

    // Create sample leads
    const leadsData: InsertLead[] = [
      {
        agentId: agent.id,
        clientName: "Alice Johnson",
        contact: "alice@example.com",
        date: new Date(2023, 5, 15),
        status: "New",
        location: "Victoria Island",
        notes: "Looking for a 2-bedroom apartment for the weekend"
      },
      {
        agentId: agent.id,
        clientName: "Bob Smith",
        contact: "bob@example.com",
        date: new Date(2023, 5, 20),
        status: "Contacted",
        location: "Lekki",
        notes: "Interested in a beachfront property"
      },
      {
        agentId: agent.id,
        clientName: "Carol Davis",
        contact: "carol@example.com",
        date: new Date(2023, 6, 1),
        status: "Qualified",
        location: "Ikoyi",
        notes: "Looking for luxury accommodation for a family of 4"
      }
    ];

    // Insert leads
    for (const lead of leadsData) {
      await this.createLead(lead);
    }

    // Get properties to reference in bookings
    const allProperties = await this.getAllProperties();
    if (!allProperties.length) return;

    // Create sample bookings
    const bookingsData: InsertBooking[] = [
      {
        propertyId: allProperties[0].id,
        clientName: "David Wilson",
        clientEmail: "david@example.com",
        checkIn: new Date(2023, 6, 10),
        checkOut: new Date(2023, 6, 15),
        guests: 2,
        totalAmount: 375000,
        status: "Confirmed",
        referralCode: "AGT001"
      },
      {
        propertyId: allProperties[2].id,
        clientName: "Eve Brown",
        clientEmail: "eve@example.com",
        checkIn: new Date(2023, 7, 5),
        checkOut: new Date(2023, 7, 10),
        guests: 4,
        totalAmount: 600000,
        status: "Pending",
        referralCode: "AGT001"
      }
    ];

    // Insert bookings
    for (const booking of bookingsData) {
      await this.createBooking(booking);
    }

    console.log("Database initialization complete");
  }
}

export const storage = new DatabaseStorage();
