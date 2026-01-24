# Patient Chart System

## Overview
A React + TypeScript patient chart system built with Vite and Tailwind CSS v4. Korean-language medical charting application for Oriental medicine clinics.

## Tech Stack
- **Frontend:** React 19, TypeScript
- **Build Tool:** Vite 6
- **Styling:** Tailwind CSS 4
- **Storage:** IndexedDB (client-side)
- **Additional Libraries:** EmailJS, html2pdf.js, OpenAI

## Project Structure
- `/components` - React components
  - `LandingPage.tsx` - Service introduction and login/register CTAs
  - `AuthWrapper.tsx` - Login/Register form wrapper
  - `AdminDashboard.tsx` - Admin user management page
  - `PatientForm.tsx` - Patient chart form
  - `PatientList.tsx` - Patient list view
- `/contexts` - React context providers (AuthContext)
- `/hooks` - Custom React hooks (useAdminMode)
- `/lib` - Utility libraries (database, sampleData)
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
- Run: `npm run dev` (starts Vite dev server on port 5000)
- Build: `npm run build` (outputs to `dist/`)

## Deployment
- Static deployment configured with build output in `dist/` folder

## Recent Changes (2026-01-24)
- **Full Internationalization (i18n) Support**
  - 5 languages: English (default), Korean (한국어), Traditional Chinese (中文繁體), Japanese (日本語), Spanish (Español)
  - LanguageContext and LanguageSelector components for language switching
  - Language preference saved to localStorage (key: 'app_language')
  - All major components translated: LandingPage, AuthWrapper, LoginForm, RegisterForm, AdminDashboard, NotificationSettings, AISettings
- Enhanced notification settings with EmailJS and Twilio configuration
- Added AI API settings management in admin dashboard
- Added landing page with service introduction
- Improved authentication flow with back-to-landing navigation
- Fixed Vite host blocking issue with array syntax for allowedHosts
- Optimized auth loading state for faster initial load

## Internationalization (i18n)
- Translation file: `/lib/translations.ts`
- Context provider: `/contexts/LanguageContext.tsx`
- Language selector: `/components/LanguageSelector.tsx`
- Usage: `const { t, tArray, language } = useLanguage();`
  - `t('key')` - Get translated string
  - `tArray('key')` - Get translated array of strings
  - `language` - Current language code ('en', 'ko', 'zh-TW', 'ja', 'es')

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
