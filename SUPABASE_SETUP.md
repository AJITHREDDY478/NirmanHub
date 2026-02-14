# Supabase Authentication Setup Guide

## 1. Get Your Supabase Credentials

1. Go to your Supabase project dashboard at [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click on **Settings** (gear icon) in the left sidebar
4. Click on **API** in the settings menu
5. Copy the following:
   - **Project URL** (under "Project URL")
   - **anon/public key** (under "Project API keys")

## 2. Configure Environment Variables

Open the `.env` file in your project root and replace the placeholders:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## 3. Enable Email Authentication in Supabase

1. In your Supabase dashboard, go to **Authentication** → **Providers**
2. Make sure **Email** provider is enabled
3. Configure email settings:
   - Go to **Authentication** → **Settings**
   - Configure your email templates (optional)
   - Enable "Confirm email" if you want users to verify their email

## 4. Database Setup - Create Profiles Table

**IMPORTANT:** You need to create the profiles table before signup will work.

### Option 1: Using SQL Editor (Recommended)

1. Go to your Supabase dashboard → **SQL Editor**
2. Click **New query**
3. Copy the entire content from [supabase_profiles_setup.sql](supabase_profiles_setup.sql)
4. Paste it into the SQL editor
5. Click **Run** to execute the script

### Option 2: Manual Table Creation

1. Go to **Table Editor** in your Supabase dashboard
2. Click **New table**
3. Create a table named `profiles` with these columns:
   - `id` (uuid) - Primary key, references `auth.users.id`
   - `name` (text)
   - `email` (text) - Unique
   - `created_at` (timestamptz) - Default: `now()`
   - `updated_at` (timestamptz) - Default: `now()`
4. Enable Row Level Security (RLS)
5. Add the policies as shown in the SQL file

## 5. Test the Integration

1. Restart your development server: `npm run dev`
2. Click on the account icon in the navbar
3. Try signing up with a test email
4. Check your Supabase dashboard under **Authentication** → **Users** to see the new user

## Features Implemented

✅ User signup with email and password
✅ User login with email verification
✅ Persistent authentication (stays logged in on refresh)
✅ User display in navbar when logged in
✅ Sign out functionality
✅ Loading states during authentication
✅ Error handling with toast notifications
✅ **Profile data stored in profiles table**
✅ **User information (name, email) saved on signup**

## Next Steps

You can enhance the authentication by:
- Adding password reset functionality
- Adding social login (Google, GitHub, etc.)
- Creating a user profile page to edit name/details
- Adding avatar/profile picture support
- Adding role-based access control
- Storing additional user preferences
