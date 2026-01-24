import { 
  users, subscriptions, patients, pricingTiers,
  type User, type InsertUser, 
  type Subscription, type InsertSubscription,
  type Patient, type InsertPatient,
  type PricingTier, type InsertPricingTier
} from "../shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  
  // Subscriptions
  getSubscription(userId: number): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(userId: number, data: Partial<InsertSubscription>): Promise<Subscription | undefined>;
  
  // Patients
  getPatients(userId: number): Promise<Patient[]>;
  getPatient(id: number): Promise<Patient | undefined>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: number, data: Partial<InsertPatient>): Promise<Patient | undefined>;
  deletePatient(id: number): Promise<boolean>;
  
  // Pricing Tiers
  getPricingTiers(): Promise<PricingTier[]>;
  getPricingTier(tierId: string): Promise<PricingTier | undefined>;
  createPricingTier(tier: InsertPricingTier): Promise<PricingTier>;
  updatePricingTier(tierId: string, data: Partial<InsertPricingTier>): Promise<PricingTier | undefined>;
  seedPricingTiers(): Promise<void>;
  
  // User Admin
  deleteUser(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // Users
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

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Subscriptions
  async getSubscription(userId: number): Promise<Subscription | undefined> {
    const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId));
    return subscription || undefined;
  }

  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const [subscription] = await db.insert(subscriptions).values(insertSubscription).returning();
    return subscription;
  }

  async updateSubscription(userId: number, data: Partial<InsertSubscription>): Promise<Subscription | undefined> {
    const [subscription] = await db.update(subscriptions).set({ ...data, updatedAt: new Date() }).where(eq(subscriptions.userId, userId)).returning();
    return subscription || undefined;
  }

  // Patients
  async getPatients(userId: number): Promise<Patient[]> {
    return await db.select().from(patients).where(eq(patients.userId, userId));
  }

  async getPatient(id: number): Promise<Patient | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.id, id));
    return patient || undefined;
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const [patient] = await db.insert(patients).values(insertPatient).returning();
    return patient;
  }

  async updatePatient(id: number, data: Partial<InsertPatient>): Promise<Patient | undefined> {
    const [patient] = await db.update(patients).set({ ...data, updatedAt: new Date() }).where(eq(patients.id, id)).returning();
    return patient || undefined;
  }

  async deletePatient(id: number): Promise<boolean> {
    const result = await db.delete(patients).where(eq(patients.id, id));
    return true;
  }

  // Pricing Tiers
  async getPricingTiers(): Promise<PricingTier[]> {
    return await db.select().from(pricingTiers).orderBy(pricingTiers.id);
  }

  async getPricingTier(tierId: string): Promise<PricingTier | undefined> {
    const [tier] = await db.select().from(pricingTiers).where(eq(pricingTiers.tierId, tierId));
    return tier || undefined;
  }

  async createPricingTier(tier: InsertPricingTier): Promise<PricingTier> {
    const [created] = await db.insert(pricingTiers).values(tier).returning();
    return created;
  }

  async updatePricingTier(tierId: string, data: Partial<InsertPricingTier>): Promise<PricingTier | undefined> {
    const [tier] = await db.update(pricingTiers).set({ ...data, updatedAt: new Date() }).where(eq(pricingTiers.tierId, tierId)).returning();
    return tier || undefined;
  }

  async seedPricingTiers(): Promise<void> {
    const existingTiers = await this.getPricingTiers();
    if (existingTiers.length > 0) return;

    const defaultTiers: InsertPricingTier[] = [
      {
        tierId: "basic",
        name: "Basic",
        price: 999,
        currency: "USD",
        features: ["Up to 50 patients", "Basic charting", "Email support"],
        isPopular: false,
        stripePriceId: null,
        patientLimit: 50,
      },
      {
        tierId: "professional",
        name: "Professional",
        price: 2999,
        currency: "USD",
        features: ["Up to 500 patients", "Advanced charting", "AI assistance", "Priority support"],
        isPopular: true,
        stripePriceId: null,
        patientLimit: 500,
      },
      {
        tierId: "enterprise",
        name: "Enterprise",
        price: 9999,
        currency: "USD",
        features: ["Unlimited patients", "Full AI access", "Custom integrations", "Dedicated support"],
        isPopular: false,
        stripePriceId: null,
        patientLimit: -1,
      },
    ];

    for (const tier of defaultTiers) {
      await this.createPricingTier(tier);
    }
  }

  // User Admin
  async deleteUser(id: number): Promise<boolean> {
    await db.delete(subscriptions).where(eq(subscriptions.userId, id));
    await db.delete(patients).where(eq(patients.userId, id));
    await db.delete(users).where(eq(users.id, id));
    return true;
  }
}

export const storage = new DatabaseStorage();
