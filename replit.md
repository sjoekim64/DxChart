# Patient Chart System

## Overview
A React + TypeScript patient chart system built with Vite and Tailwind CSS v4. Korean-language medical charting application for Oriental medicine clinics.

## Tech Stack
- **Frontend:** React 19, TypeScript
- **Backend:** Express.js, Node.js
- **Database:** PostgreSQL (Drizzle ORM)
- **Build Tool:** Vite 6
- **Styling:** Tailwind CSS 4
- **Payments:** Stripe
- **Additional Libraries:** EmailJS, html2pdf.js, OpenAI

## Project Structure
- `/components` - React components
  - `LandingPage.tsx` - Service introduction and login/register CTAs
  - `AuthWrapper.tsx` - Login/Register form wrapper
  - `AdminDashboard.tsx` - Admin user management page
  - `PatientForm.tsx` - Patient chart form
  - `PatientList.tsx` - Patient list view with subscription status
  - `PricingSettings.tsx` - Admin pricing tier configuration
  - `PricingPage.tsx` - User-facing pricing plans page
- `/contexts` - React context providers
  - `AuthContext.tsx` - User authentication
  - `LanguageContext.tsx` - Internationalization
  - `SubscriptionContext.tsx` - Subscription management and feature gating
- `/server` - Backend API server
  - `index.ts` - Express server with Stripe, auth, patient APIs
  - `db.ts` - PostgreSQL database connection (Drizzle)
  - `storage.ts` - Database storage layer
- `/shared` - Shared code between frontend and backend
  - `schema.ts` - Drizzle database schema (users, subscriptions, patients, pricing_tiers)
- `/hooks` - Custom React hooks (useAdminMode)
- `/lib` - Utility libraries (database, sampleData, translations)
- `/types` - TypeScript type definitions
- `/public` - Static assets

## User Flow
1. Landing page (/) - Service introduction
2. Login/Register - Authentication
3. Patient List - Main dashboard after login
4. Admin Dashboard - User management (admin only)

## Test Account
- Username: `sjoekim`
- Password: `Joe007007`

## Development
- Frontend: `npm run dev` (Vite dev server on port 5000)
- Backend: `npm run server` (Express API on port 3001)
- Both: `npm run dev:all` (runs frontend and backend concurrently)
- Database: `npm run db:push` (push schema to PostgreSQL)
- Build: `npm run build` (outputs to `dist/`)

## Deployment
- Static deployment configured with build output in `dist/` folder

## Recent Changes (2026-01-24)
- **Stripe Payment Integration with Tiered Pricing**
  - 3 configurable pricing tiers: Basic, Professional, Enterprise
  - Admin-configurable pricing in Admin Dashboard (name, price, currency, features)
  - Stripe Price ID support for production payment processing
  - Demo mode for testing without actual Stripe checkout
  - Feature gating based on subscription tier
  - Patient limits: Free=10, Basic=50, Professional=500, Enterprise=unlimited
  - AI access restricted to Professional and Enterprise tiers
  - Subscription status stored per-user in localStorage
  - PricingPage accessible from PatientList with "View Plans" button
  - Visual warnings when approaching or exceeding patient limits
- **Full Internationalization (i18n) Support**
  - 6 languages: English (default), Korean (한국어), Traditional Chinese (中文繁體), Simplified Chinese (中文简体), Japanese (日本語), Spanish (Español)
  - All pricing-related strings localized across all 6 languages
  - Semantic translation key organization: auth.*, admin.*, notification.*, ai.*, pricing.*, common.*
- Enhanced notification settings with EmailJS and Twilio configuration
- Added AI API settings management in admin dashboard
- Added landing page with service introduction

## Internationalization (i18n)
- Translation file: `/lib/translations.ts`
- Context provider: `/contexts/LanguageContext.tsx`
- Language selector: `/components/LanguageSelector.tsx`
- Usage: `const { t, tArray, language } = useLanguage();`
  - `t('key')` - Get translated string
  - `tArray('key')` - Get translated array of strings
  - `language` - Current language code ('en', 'ko', 'zh-TW', 'zh-CN', 'ja', 'es')

## Admin Features
- User management (approve/reject/delete)
- Notification settings (EmailJS for email, Twilio for SMS, Microsoft Teams)
  - Email: Configure EmailJS service ID, template ID, public key
  - SMS: Configure Twilio account SID, auth token, phone numbers
  - Teams: Configure Incoming Webhook URL
  - Test buttons for email, SMS, and Teams
- AI API settings (multi-provider support)
  - OpenAI: GPT-4o, GPT-4o Mini, GPT-4 Turbo, GPT-3.5 Turbo
  - Google Gemini: Gemini 2.0 Flash, 1.5 Pro, 1.5 Flash, 1.0 Pro
  - Anthropic Claude: Claude Sonnet 4, 3.5 Sonnet, 3 Opus, 3 Haiku
  - Per-provider API key configuration with test functionality
- Pricing settings (Stripe integration)
  - 3 configurable pricing tiers with customizable names, prices, currencies
  - Feature list per tier (editable)
  - Stripe Price ID field for production payment processing
  - Mark tier as "popular" option
  - Demo mode: subscriptions work without actual Stripe checkout

## Subscription System
- Context: `/contexts/SubscriptionContext.tsx`
- Feature gating: `useSubscription().canAccess('feature_name')`
- Patient limits: `useSubscription().canAddPatient(currentCount)`
- AI access check: `useSubscription().hasAIAccess()`
- Subscription tiers: free, basic, professional, enterprise
- Storage: PostgreSQL (subscriptions table) + localStorage fallback

## Backend API Endpoints
### Core APIs
- `GET /api/health` - Health check
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/subscription/:userId` - Get user subscription
- `GET /api/pricing-tiers` - Get pricing tiers

### Stripe Payment APIs
- `POST /api/create-checkout-session` - Create Stripe checkout session (demo mode if no key)
- `POST /api/verify-checkout` - Verify payment and update subscription
- `POST /api/webhook` - Stripe webhook handler

### Patient APIs (with ownership validation)
- `GET /api/patients/:userId` - Get user's patients
- `POST /api/patients` - Create patient (requires userId)
- `PUT /api/patients/:id` - Update patient (validates ownership)
- `DELETE /api/patients/:id` - Delete patient (validates ownership via query param)

### Admin APIs
- `GET /api/admin/users` - Get all users (for admin dashboard)
- `PUT /api/admin/users/:id/approve` - Approve user
- `PUT /api/admin/users/:id/reject` - Reject/unapprove user
- `DELETE /api/admin/users/:id` - Delete user (cascades to subscriptions/patients)
- `PUT /api/admin/pricing-tiers/:tierId` - Update pricing tier

## Database Schema (Drizzle ORM)
- `users` - User accounts
- `subscriptions` - User subscription status (Stripe integration)
- `patients` - Patient records with chart data (JSONB)
- `pricing_tiers` - Admin-configurable pricing plans

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `STRIPE_SECRET_KEY` - Stripe API key (optional for demo mode)
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret (optional)
