# AbangBob Dashboard - F&B Centralized Management System

> **🎉 NEW: Full Supabase Integration!** Your data is now automatically saved to the cloud and synced across devices.  
> **Quick Start**: Visit `/setup` to migrate your data to Supabase in 5 minutes!

Satu "Centralized Dashboard" untuk perniagaan makanan yang menggabungkan fungsi POS, Inventori, HR, dan Akaun.

## ✨ What's New

**Data Protection & Cloud Sync** (December 2024)
- ✅ Automatic cloud backup to Supabase
- ✅ Multi-device real-time synchronization  
- ✅ Offline support with localStorage fallback
- ✅ Zero data loss on browser clear
- ✅ Easy migration wizard at `/setup`

**Quick Links:**
- 📘 [Quick Reference Guide](./QUICK_REFERENCE.md) - Get started in 5 min
- 📗 [Complete Integration Guide](./docs/SUPABASE_INTEGRATION_COMPLETE.md) - Full details
- 📙 [Original Setup Guide](./docs/SUPABASE_SETUP.md) - Manual setup

## Tech Stack
- **Framework**: Next.js 14 (React)
- **Language**: TypeScript
- **Styling**: Vanilla CSS
- **Database**: Supabase (PostgreSQL with real-time capabilities)
- **Authentication**: Supabase Auth + PIN-based staff login

## Features

### Core Modules
- 🏠 Dashboard Utama (Sales Summary, Alerts, Staff Status)
- 💰 POS System (Menu, Cart, Checkout with strict validation)
- 👥 HR System (Staff Management, Time Clock, Payroll)
- 🏭 Production (Oil Tracker, Production Logs)
- 🚚 Delivery Hub (Multi-platform order integration)
- 📱 Web Ordering (Customer-facing QR ordering)

### Advanced Features (Planned)
- Analytics & Business Intelligence
- Smart Inventory (Anti-theft, Recipe Management)
- Kitchen Display System (KDS)
- CRM & Loyalty Program
- Multi-Outlet Support
- IoT Integration

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Supabase (Required)

Follow the complete setup guide: [`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md)

Quick steps:
1. Create Supabase project at https://supabase.com
2. Create `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
3. Run database schema: `lib/supabase/schema.sql`
4. Seed test users: `lib/supabase/seed-test-users.sql`

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔐 Test Users

For testing all features, use these pre-configured accounts:

| Role | Login Method | Email | Password | PIN |
|------|-------------|--------|----------|-----|
| **Admin** | Email | `admin@abangbob.com` | `Admin123!` | `1234` |
| **Manager** | Email | `manager@abangbob.com` | `Manager123!` | `2345` |
| **Staff** | PIN | - | - | `3456` |

**Quick Reference**: See [`TEST_CREDENTIALS.md`](TEST_CREDENTIALS.md)  
**Setup Guide**: See [`docs/TEST_USERS_SETUP.md`](docs/TEST_USERS_SETUP.md)

### Testing Different Roles

1. **Admin Login**: Click "Login Admin" → Enter admin credentials
2. **Manager Login**: Click "Login Admin" → Enter manager credentials  
3. **Staff Login**: Click "Login Staf" → Select "Staff Ahmad" → Enter PIN `3456`

Each role has different permissions - try accessing various modules to see role-based access control in action!

