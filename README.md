# DocMS

- Frontend - (Next.js 14)
- Backend - (Node.js 20.11)

## Prerequisites

- Next.js 14
- Node.js 20.11+
- Prisma
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
# Server at http://localhost:4000
```

**Environment Variables:**
- `DATABASE_URL` - MySQL connection string (required)
- `PORT` - Server port number (optional, defaults to 4000)

**Note:** 
- The `.env.example` file contains placeholder values. After copying to `.env`, make sure to update `DATABASE_URL` with your actual MySQL database credentials.
- Remove `backend/src/prisma/schema/migrations/` from `.gitignore` to maintain migration history. 
(I've included it in `.gitignore` to allow clean slate for cloning of project repo)

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
- `NEXT_PUBLIC_API_URL` - Backend API base URL (defaults to http://localhost:4000/api)

**Note:** 
- The `.env.example` file contains example values. After copying to `.env`, update `NEXT_PUBLIC_API_URL` if your backend server runs on a different URL or port than the default.

## Project Structure

- `backend/`: Express REST API + Prisma (MySQL 8)
- `frontend/`: Next.js App Router with MUI, Redux Toolkit

## Tooling

- ESLint + Prettier configured in both apps
- Node version pinned via `.nvmrc` (20.11.0)

## Running Tests

### Backend
```bash
cd backend
npm run test:backend
```

### Frontend
```bash
cd frontend
npm run test:frontend