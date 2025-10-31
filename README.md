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
cp env.example .env
npm install
npm run prisma:generate
# Update DATABASE_URL in .env to point to your MySQL instance
npm run prisma:migrate -- --name init
npm run prisma:seed
npm run dev
# Server at http://localhost:3000
# REST API at http://localhost:3000/api
```

REST API Endpoints:

- `GET /health` - Health check
- `GET /api/documents` - Get all documents (with pagination)
- `POST /api/documents` - Create document
- `GET /api/folders` - Get all folders (with pagination)
- `POST /api/folders` - Create folder

## Frontend Setup

```bash
cd frontend
# optionally set NEXT_PUBLIC_API_URL if backend not on localhost:3000
npm install
npm run dev
# App at http://localhost:3000
```

## Project Structure

- `backend/`: Express REST API + Prisma (MySQL 8)
- `frontend/`: Next.js App Router with MUI, Redux Toolkit

## Tooling

- ESLint + Prettier configured in both apps
- Node version pinned via `.nvmrc` (20.11.0)
