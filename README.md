# Captur Location Dashboard

A Next.js application that displays user location traces on a Mapbox map, with simple password authentication for admin access.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Environment Setup

1. Create a `.env.local` file in the project root based on the `env.template` file:

```
# Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Mapbox token
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token

# Admin dashboard password
NEXT_PUBLIC_ADMIN_PASSWORD=your-secure-password
```

## Authentication

The dashboard uses a simple password-based authentication system. The default password is `admin123`, but you should change this by setting the `NEXT_PUBLIC_ADMIN_PASSWORD` environment variable.

## Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. You'll be prompted to enter the admin password to access the dashboard.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

To deploy this app to Vercel:

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com) and create a new project from your repository
3. In the project settings, add the following environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_MAPBOX_TOKEN`
   - `NEXT_PUBLIC_ADMIN_PASSWORD`
4. Deploy the application

## Features

- Simple password authentication for admin access
- User selection with username display
- Interactive map showing location traces
- Environment variable configuration for easy deployment
