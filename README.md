# QuoteVault

A minimal, premium web app to store, browse, and search your personal quote collection. Optimized for retrieval when you only vaguely remember a quote.

## Features

- **Light/dark theme** – Theme preference is stored in `localStorage`. Use the theme toggle (top-right) to switch. Defaults to system preference on first load.
- **Search** – Free-text search across title, content, and author (partial match), with autocomplete suggestions by title.
- **Filters** – Filter icon in the search bar: filter by author, language (English/Español), and hashtags (AND logic); sort by newest/oldest.
- **Quotes** – Add quotes with title, content, optional author, optional language (en/es), and hashtags. Edit or delete from the detail view.
- **Infinite scroll** – Paginated cards with load-more.
- **Copy, Edit & Delete** – Per-card actions in the quote detail modal.

## Tech Stack

- **Frontend:** Next.js 16 (App Router) + TypeScript + TailwindCSS
- **Backend:** Next.js Route Handlers
- **Database:** PostgreSQL
- **ORM:** Prisma

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure database

Create a `.env` file in the project root:

```
DATABASE_URL="postgresql://user:password@localhost:5432/quotevault?schema=public"
```

**Option A – Local PostgreSQL with Docker**

```bash
docker compose up -d
```

Then use:

```
DATABASE_URL="postgresql://quotevault:quotevault@localhost:5432/quotevault?schema=public"
```

**Option B – Neon or Supabase**

Copy your connection string from the dashboard and paste it into `.env`.

### 3. Run migrations

```bash
npm run db:migrate
```

### 4. (Optional) Seed sample data

```bash
npm run db:seed
```

### 5. Start development server

```bash
npm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Docker

This project uses Docker **only for the database** (PostgreSQL). The app runs on your machine with `npm run dev`.

### Why use Docker?

- Run PostgreSQL without installing it locally.
- Same database setup for everyone and for production-like testing.

### Important: do not open `localhost:5432` in a browser

Port **5432** is used by PostgreSQL (database protocol), not HTTP. Opening `http://localhost:5432` in a browser will fail or show an error. That is expected. Docker and the database are working if the app and Prisma Studio can connect.

### Correct workflow

1. **Start the database**
   ```bash
   docker compose up -d
   ```
   This starts the `quotevault-db` (PostgreSQL) container only.

2. **Configure the app**
   In `.env`:
   ```
   DATABASE_URL="postgresql://quotevault:quotevault@localhost:5432/quotevault?schema=public"
   ```

3. **Apply migrations**
   ```bash
   npm run db:migrate
   ```
   (or `npx prisma migrate deploy`)

4. **Run the app**
   ```bash
   npm run dev
   ```
   Next.js runs on your machine and connects to the database in Docker.

### Verifying the database

- Use the app at [http://localhost:3000](http://localhost:3000): create or edit quotes and check the list.
- Or run **Prisma Studio**: `npx prisma studio` and inspect the tables.

## Scripts

| Command       | Description                    |
| ------------- | ------------------------------ |
| `npm run dev` | Start development server       |
| `npm run build` | Production build             |
| `npm run start` | Start production server      |
| `npm run db:migrate` | Apply migrations          |
| `npm run db:seed` | Seed sample quotes         |
| `npm run db:studio` | Open Prisma Studio      |

## Deployment

1. Deploy to Vercel (or similar).
2. Add a PostgreSQL database (Neon, Supabase, Railway).
3. Set `DATABASE_URL` in environment variables.
4. Run `prisma migrate deploy` in your build/deploy step (or via a one-off command).
