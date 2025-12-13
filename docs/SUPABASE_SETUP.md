# Supabase Integration Setup Guide

This guide explains how to set up Supabase as the backend for AbangBob Dashboard.

## Prerequisites

1. A Supabase account (free tier available at https://supabase.com)
2. Node.js 18+ installed

## Step 1: Create Supabase Project

1. Go to https://supabase.com and sign in
2. Click "New Project"
3. Choose your organization
4. Enter a project name (e.g., "abangbob-dashboard")
5. Set a strong database password
6. Choose the nearest region for best performance
7. Click "Create new project"

## Step 2: Get API Keys

1. Go to **Project Settings** > **API**
2. Copy the following values:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **Anon/Public Key**: `eyJhbGciOiJS...` (long string)

## Step 3: Configure Environment Variables

Create a `.env.local` file in the project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 4: Set Up Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Click "New Query"
3. Copy the contents of `lib/supabase/schema.sql`
4. Paste into the SQL Editor
5. Click "Run"

This will create all the necessary tables with:
- Staff management
- Attendance tracking
- Inventory management
- Menu items
- Orders
- Customers
- Expenses
- Audit logs
- Multi-outlet support

## Step 5: Install Dependencies

```bash
npm install
```

This will install the Supabase packages:
- `@supabase/supabase-js` - Supabase JavaScript client
- `@supabase/ssr` - Server-side rendering utilities

## Step 6: Restart Development Server

```bash
npm run dev
```

## Features Enabled by Supabase

### Real-time Updates
- Live order updates between POS and KDS
- Real-time inventory tracking
- Multi-device synchronization

### Authentication
- Email/password authentication
- Staff PIN verification
- Session management

### Database
- PostgreSQL database
- Row Level Security (RLS)
- Automatic timestamps

### Storage (optional)
- Receipt images
- Staff photos
- Document uploads

## Using Without Supabase (Offline Mode)

The dashboard works without Supabase configuration using localStorage.
This is useful for:
- Development
- Demo purposes
- Offline operation

When Supabase is not configured, the app will:
1. Show a warning in the console
2. Fall back to localStorage for data persistence
3. Disable real-time features

## Migrating Existing Data

To migrate data from localStorage to Supabase:

1. Export your localStorage data:
```javascript
// In browser console
const data = {
  staff: JSON.parse(localStorage.getItem('abangbob_staff') || '[]'),
  inventory: JSON.parse(localStorage.getItem('abangbob_inventory') || '[]'),
  orders: JSON.parse(localStorage.getItem('abangbob_orders') || '[]'),
};
console.log(JSON.stringify(data, null, 2));
```

2. Use Supabase's Table Editor to import the data
3. Or use the SQL Editor to insert data directly

## Security Best Practices

1. **Never commit `.env.local`** - It's already in `.gitignore`
2. **Use Row Level Security** - The schema includes RLS policies
3. **Rotate keys regularly** - Generate new keys in Supabase dashboard
4. **Use service role key only on server** - Never expose it to client

## Troubleshooting

### "Supabase not configured" warning
- Check that `.env.local` exists
- Verify the environment variables are correct
- Restart the development server

### Real-time not working
- Check that tables are added to the realtime publication
- Verify RLS policies allow SELECT

### Authentication errors
- Check that email confirmations are disabled for development
- Verify the anon key is correct

## Support

For Supabase-specific issues:
- Documentation: https://supabase.com/docs
- Discord: https://discord.supabase.com
- GitHub Issues: https://github.com/supabase/supabase/issues

