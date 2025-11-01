# DocMS Monorepo

Frontend - (Next.js 14 + Material UI + Redux)
Backend - (Node.js 20.11 + Express + Prisma + MySQL 8).

## Prerequisites

- Node.js 20.11+
- MySQL 8+
- npm

## Backend Setup

```bash
cd backend

# Copy environment example file and configure your values
# Edit .env file and update DATABASE_URL with your MySQL credentials
# DATABASE_URL format: mysql://USER:PASSWORD@HOST:PORT/DATABASE
cp .env.example .env

npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:seed
npm run dev
# Server at http://localhost:4000 (or PORT from .env)
```

**Environment Variables:**
- `DATABASE_URL` - MySQL connection string (required)
- `PORT` - Server port number (optional, defaults to 4000)

**Note:** The `.env.example` file contains placeholder values. After copying to `.env`, make sure to update `DATABASE_URL` with your actual MySQL database credentials.

## Frontend Setup

```bash
cd frontend

# Copy environment example file and configure your values
cp .env.example .env
# Edit .env file and update NEXT_PUBLIC_API_URL if your backend runs on a different URL/port

npm install
npm run dev
# App at http://localhost:3000
```

**Environment Variables:**
- `NEXT_PUBLIC_API_URL` - Backend API base URL (optional, defaults to http://localhost:4000/api)

**Note:** The `.env.example` file contains example values. After copying to `.env`, update `NEXT_PUBLIC_API_URL` if your backend server runs on a different URL or port than the default.

## Project Structure

- `backend/`: Express REST API + Prisma (MySQL 8)
- `frontend/`: Next.js App Router with MUI, Redux Toolkit

## Tooling

- ESLint + Prettier configured in both apps
- Node version pinned via `.nvmrc` (20.11.0)
