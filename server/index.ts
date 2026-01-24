import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import Stripe from "stripe";
import { storage } from "./storage";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || "5000", 10);

// Stripe setup (optional - will work in demo mode without key)
const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey ? new Stripe(stripeKey) : null;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Get user subscription
app.get("/api/subscription/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const subscription = await storage.getSubscription(userId);
    res.json(subscription || { tier: "free" });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    res.status(500).json({ error: "Failed to fetch subscription" });
  }
});

// Get pricing tiers
app.get("/api/pricing-tiers", async (req, res) => {
  try {
    const tiers = await storage.getPricingTiers();
    res.json(tiers);
  } catch (error) {
    console.error("Error fetching pricing tiers:", error);
    res.status(500).json({ error: "Failed to fetch pricing tiers" });
  }
});

// Create Stripe Checkout Session
app.post("/api/create-checkout-session", async (req, res) => {
  try {
    const { priceId, userId, tierId, successUrl, cancelUrl } = req.body;

    // Demo mode if no Stripe key
    if (!stripe || !priceId) {
      return res.json({ 
        demoMode: true, 
        tier: tierId,
        message: "Demo mode - no Stripe key configured" 
      });
    }

    // Get or create Stripe customer
    let customerId: string | undefined;
    const user = await storage.getUser(userId);
    
    if (user) {
      const subscription = await storage.getSubscription(userId);
      if (subscription?.stripeCustomerId) {
        customerId = subscription.stripeCustomerId;
      } else {
        // Create new customer
        const customer = await stripe.customers.create({
          metadata: { userId: userId.toString() },
        });
        customerId = customer.id;
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer: customerId,
      success_url: successUrl || `${process.env.APP_URL || "http://localhost:5000"}/payment-success?session_id={CHECKOUT_SESSION_ID}&tier=${tierId}`,
      cancel_url: cancelUrl || `${process.env.APP_URL || "http://localhost:5000"}/pricing`,
      metadata: {
        userId: userId?.toString() || "",
        tierId: tierId || "",
      },
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ error: error.message || "Failed to create checkout session" });
  }
});

// Verify checkout session and update subscription
app.post("/api/verify-checkout", async (req, res) => {
  try {
    const { sessionId, userId } = req.body;

    if (!stripe) {
      return res.status(400).json({ error: "Stripe not configured" });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid") {
      const tier = session.metadata?.tierId || "basic";
      
      // Update or create subscription
      const existingSubscription = await storage.getSubscription(userId);
      
      if (existingSubscription) {
        await storage.updateSubscription(userId, {
          tier,
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
          status: "active",
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });
      } else {
        await storage.createSubscription({
          userId,
          tier,
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
          status: "active",
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });
      }

      res.json({ success: true, tier });
    } else {
      res.status(400).json({ error: "Payment not completed" });
    }
  } catch (error: any) {
    console.error("Error verifying checkout:", error);
    res.status(500).json({ error: error.message || "Failed to verify checkout" });
  }
});

// Stripe Webhook
app.post("/api/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  if (!stripe) {
    return res.status(200).json({ message: "Stripe not configured" });
  }

  const sig = req.headers["stripe-signature"] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!endpointSecret) {
    console.log("Webhook secret not configured, skipping webhook verification");
    return res.status(200).send();
  }

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = parseInt(session.metadata?.userId || "0");
        const tier = session.metadata?.tierId || "basic";

        if (userId) {
          const existingSubscription = await storage.getSubscription(userId);
          if (existingSubscription) {
            await storage.updateSubscription(userId, {
              tier,
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              status: "active",
            });
          } else {
            await storage.createSubscription({
              userId,
              tier,
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              status: "active",
            });
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        // Handle subscription updates
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        // Handle subscription cancellation - downgrade to free
        break;
      }
    }

    res.json({ received: true });
  } catch (err: any) {
    console.error("Webhook error:", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// User registration
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, password, clinicName, therapistName, email, phone } = req.body;

    // Check if user exists
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    // Simple hash (in production, use bcrypt)
    const passwordHash = Buffer.from(password).toString("base64");

    const user = await storage.createUser({
      username,
      passwordHash,
      clinicName,
      therapistName,
      email,
      phone,
      isApproved: false,
    });

    // Create free subscription
    await storage.createSubscription({
      userId: user.id,
      tier: "free",
      status: "active",
    });

    res.json({ success: true, user: { id: user.id, username: user.username } });
  } catch (error: any) {
    console.error("Registration error:", error);
    res.status(500).json({ error: error.message || "Registration failed" });
  }
});

// User login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await storage.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const passwordHash = Buffer.from(password).toString("base64");
    if (user.passwordHash !== passwordHash) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.isApproved && !user.isAdmin) {
      return res.status(403).json({ error: "Account not approved" });
    }

    const subscription = await storage.getSubscription(user.id);

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        clinicName: user.clinicName,
        therapistName: user.therapistName,
        isAdmin: user.isAdmin,
      },
      subscription: subscription || { tier: "free" },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({ error: error.message || "Login failed" });
  }
});

// Patient CRUD with ownership validation
app.get("/api/patients/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const patients = await storage.getPatients(userId);
    res.json(patients);
  } catch (error) {
    console.error("Error fetching patients:", error);
    res.status(500).json({ error: "Failed to fetch patients" });
  }
});

app.post("/api/patients", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "User ID required" });
    }
    const patient = await storage.createPatient(req.body);
    res.json(patient);
  } catch (error) {
    console.error("Error creating patient:", error);
    res.status(500).json({ error: "Failed to create patient" });
  }
});

app.put("/api/patients/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { userId } = req.body;
    
    const existingPatient = await storage.getPatient(id);
    if (!existingPatient) {
      return res.status(404).json({ error: "Patient not found" });
    }
    if (existingPatient.userId !== userId) {
      return res.status(403).json({ error: "Not authorized to update this patient" });
    }
    
    const patient = await storage.updatePatient(id, req.body);
    res.json(patient);
  } catch (error) {
    console.error("Error updating patient:", error);
    res.status(500).json({ error: "Failed to update patient" });
  }
});

app.delete("/api/patients/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = parseInt(req.query.userId as string);
    
    const existingPatient = await storage.getPatient(id);
    if (!existingPatient) {
      return res.status(404).json({ error: "Patient not found" });
    }
    if (existingPatient.userId !== userId) {
      return res.status(403).json({ error: "Not authorized to delete this patient" });
    }
    
    await storage.deletePatient(id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting patient:", error);
    res.status(500).json({ error: "Failed to delete patient" });
  }
});

// Admin: Get all users
app.get("/api/admin/users", async (req, res) => {
  try {
    const users = await storage.getAllUsers();
    res.json(users.map(u => ({
      id: u.id,
      username: u.username,
      clinicName: u.clinicName,
      therapistName: u.therapistName,
      email: u.email,
      phone: u.phone,
      isApproved: u.isApproved,
      isAdmin: u.isAdmin,
      createdAt: u.createdAt,
    })));
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Admin: Approve user
app.put("/api/admin/users/:id/approve", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const user = await storage.updateUser(id, { isApproved: true });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ success: true, user: { id: user.id, isApproved: user.isApproved } });
  } catch (error) {
    console.error("Error approving user:", error);
    res.status(500).json({ error: "Failed to approve user" });
  }
});

// Admin: Reject/Unapprove user
app.put("/api/admin/users/:id/reject", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const user = await storage.updateUser(id, { isApproved: false });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ success: true, user: { id: user.id, isApproved: user.isApproved } });
  } catch (error) {
    console.error("Error rejecting user:", error);
    res.status(500).json({ error: "Failed to reject user" });
  }
});

// Admin: Delete user
app.delete("/api/admin/users/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteUser(id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// Admin: Update pricing tier
app.put("/api/admin/pricing-tiers/:tierId", async (req, res) => {
  try {
    const { tierId } = req.params;
    const tier = await storage.updatePricingTier(tierId, req.body);
    if (!tier) {
      return res.status(404).json({ error: "Pricing tier not found" });
    }
    res.json(tier);
  } catch (error) {
    console.error("Error updating pricing tier:", error);
    res.status(500).json({ error: "Failed to update pricing tier" });
  }
});

// Seed pricing tiers and start server
async function startServer() {
  try {
    await storage.seedPricingTiers();
    console.log("Pricing tiers seeded");
  } catch (error) {
    console.error("Error seeding pricing tiers:", error);
  }

  // Serve static files in production
  const distPath = path.join(__dirname, "..", "dist");
  app.use(express.static(distPath));
  
  // Handle client-side routing - serve index.html for all non-API routes
  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api")) {
      res.sendFile(path.join(distPath, "index.html"));
    }
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
