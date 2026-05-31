# Hotel POS System

A Next.js point-of-sale terminal for hotel front desk operations: room bookings, food and amenity charges, billing, and shift ledger.

## Stack

- **Next.js 15** (App Router)
- **Prisma 6** + **MongoDB Atlas**
- **React 19** + **Tailwind CSS 4**

## Run locally

**Prerequisites:** Node.js 20+, MongoDB Atlas cluster

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment variables:

   ```bash
   cp .env.example .env
   ```

   Set `DATABASE_URL` and admin bootstrap credentials in `.env`.

3. Push schema and seed the database:

   ```bash
   npm run db:push
   npm run db:seed
   ```

4. Start the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) and sign in with the bootstrap admin account.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run db:push` | Sync Prisma schema to MongoDB |
| `npm run db:seed` | Seed rooms, menu, settings, and admin user |
