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
- Added landing page with service introduction
- Improved authentication flow with back-to-landing navigation
- Fixed Vite host blocking issue with array syntax for allowedHosts
- Optimized auth loading state for faster initial load
