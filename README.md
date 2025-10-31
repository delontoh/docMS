# DocMS Monorepo

Frontend (Next.js 14 + Material UI + Apollo Client + Redux) and Backend (Node.js 20.11 + Apollo Server + Prisma + MySQL 8).

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
npm run dev
# Server at http://localhost:4000/graphql
```

GraphQL:
- Query `health`
- CRUD `User` (id, email, name)

## Frontend Setup
```bash
cd frontend
# optionally set NEXT_PUBLIC_GRAPHQL_URL if backend not on localhost:4000
npm install
npm run dev
# App at http://localhost:3000
```

## Project Structure
- `backend/`: Express + Apollo Server + Prisma (MySQL 8)
- `frontend/`: Next.js App Router with MUI, Apollo Client, Redux Toolkit

## Tooling
- ESLint + Prettier configured in both apps
- Node version pinned via `.nvmrc` (20.11.0)
