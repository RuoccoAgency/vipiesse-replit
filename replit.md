# VIPIESSE E-Commerce Platform

## Overview

VIPIESSE is a complete e-commerce website for an Italian wholesale footwear business (ingrosso calzature). The platform features a modern, premium dark-themed design with a React frontend and Express backend, built specifically for selling slippers, sandals, and footwear with B2B wholesale capabilities.

The application supports:
- Product browsing with category filtering (Donna/Uomo/Bambino)
- Shopping cart with checkout flow
- Admin panel for product and collection management
- B2B business area for wholesale customers
- Multi-collection product organization (products can belong to multiple collections)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **Styling**: TailwindCSS with custom theme (premium dark mode with black backgrounds)
- **UI Components**: shadcn/ui component library (New York style) with Radix UI primitives
- **Animations**: Framer Motion for smooth transitions and effects
- **State Management**: React Context for auth and cart state
- **Data Fetching**: TanStack React Query for server state management
- **Typography**: Google Fonts (Oswald for headings, Inter for body)

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Design**: RESTful JSON API under `/api/*` routes
- **Authentication**: Cookie-based session management for admin panel
- **Admin Credentials**: Loaded from environment variables (ADMIN_EMAIL, ADMIN_PASSWORD, SESSION_SECRET)

### Database Layer
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-kit for migrations
- **Schema Location**: `shared/schema.ts` (shared between frontend and backend)
- **Key Tables**:
  - `products`: Core product data with prices stored in cents
  - `collections`: Product groupings (best sellers, outlet, seasonal, etc.)
  - `product_collections`: Many-to-many junction table with position ordering
  - `sessions`: Admin authentication sessions

### Build System
- **Dev Server**: Vite with HMR for frontend, tsx for backend
- **Production Build**: esbuild bundles server, Vite builds client to `dist/`
- **Static Serving**: Express serves built client from `dist/public`

### Project Structure
```
client/           # React frontend
  src/
    components/   # Reusable UI components
    pages/        # Route page components
    context/      # React Context providers (auth, cart)
    lib/          # Utilities, API functions, data
    hooks/        # Custom React hooks
server/           # Express backend
  routes.ts       # API route handlers
  storage.ts      # Database access layer
  db.ts           # Database connection
shared/           # Shared code between frontend/backend
  schema.ts       # Drizzle database schema
```

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **connect-pg-simple**: Session storage in PostgreSQL

### UI Libraries
- **Radix UI**: Full suite of accessible, unstyled components
- **shadcn/ui**: Pre-styled component implementations
- **Lucide React**: Icon library
- **embla-carousel-react**: Carousel functionality
- **react-day-picker**: Date picker component
- **recharts**: Charting library

### Form & Validation
- **React Hook Form**: Form state management
- **Zod**: Schema validation (shared with drizzle-zod for type safety)
- **@hookform/resolvers**: Zod integration with React Hook Form

### Development Tools
- **Vite**: Frontend dev server and build tool
- **tsx**: TypeScript execution for Node.js
- **drizzle-kit**: Database migration tooling

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `ADMIN_EMAIL`: Admin login email
- `ADMIN_PASSWORD`: Admin login password
- `SESSION_SECRET`: Secret for session cookie signing