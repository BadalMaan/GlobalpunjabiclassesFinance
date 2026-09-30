# Global Finance

A separate, mobile-first finance management platform for three partners.

## Partner split

- Badal Maan: 25%
- Jasnoor: 25%
- Ranjot Singh: 50%

## Stack

- Next.js
- TypeScript
- Tailwind CSS
- Supabase
- PostgreSQL
- Render

## Current project

This first package contains the complete application foundation and premium responsive dashboard shell. The displayed transactions are demo data until Supabase environment variables and live data wiring are enabled.

## GitHub → Supabase → Render workflow

1. Upload the complete project to the new GitHub repository.
2. Create a separate Supabase project for Global Finance.
3. Run `supabase/schema.sql` in Supabase SQL Editor.
4. Create the three authentication users.
5. Set their profiles and ownership percentages.
6. Create a Render Web Service connected to this GitHub repository.
7. Add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
8. Deploy.
9. The next build stage will wire every dashboard action to Supabase.

## Important

Do not put Supabase service-role keys in this project or in browser-visible environment variables. Only the public anon key belongs in `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

This repository is intentionally separate from any student/class management platform.
