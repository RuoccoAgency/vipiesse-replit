# VIPIESSE E-Commerce Platform

## Overview

VIPIESSE is a complete e-commerce website for an Italian wholesale footwear business (ingrosso calzature). The platform features a modern, premium dark-themed design with a React frontend and Express backend, built specifically for selling slippers, sandals, and footwear with B2B wholesale capabilities.

The application supports:
- Product browsing with category filtering (Donna/Uomo/Bambino)
- Shopping cart with checkout flow
- Admin panel for product and collection management
- B2B business area for wholesale customers
- Multi-collection product organization (products can belong to multiple collections)
- Coupon code system (VIPIESSE1STORD: 20% off first order per user)

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
  - `products`: Base product/model with name, brand, description, base price (cents)
  - `product_variants`: Color + size combinations with unique SKU, stock quantity, optional variant price
  - `product_images`: Gallery images per product with sort order
  - `variant_images`: Images specific to a variant/color
  - `collections`: Product groupings (best sellers, outlet, seasonal, etc.)
  - `product_collections`: Many-to-many junction table with position ordering
  - `orders`: Customer orders with status, contact info, shipping address, coupon/discount fields
  - `order_items`: Order line items referencing variant_id with price snapshot
  - `coupon_usages`: Tracks coupon usage per user (one-time use enforcement)
  - `sessions`: Admin authentication sessions

### Product/Variant Model (Shopify-style)
- One **Product** represents a base model (e.g., "INBLU Classic Clogs")
- Each product has multiple **Variants** representing color + size combinations
- Each variant has a unique **SKU**, stock quantity, and optional price (falls back to base price)
- Collections are assigned to products, not variants
- Cart and orders reference variant IDs to track specific color/size combinations

### Stock Management
- Stock is tracked per variant in `product_variants.stock_qty`
- Order creation uses transactional SELECT FOR UPDATE to prevent overselling
- Atomic stock decrement with rollback on failure

### Build System
- **Dev Server**: Vite with HMR for frontend, tsx for backend
- **Production Build**: esbuild bundles server, Vite builds client to `dist/`
- **Static Serving**: Express serves built client from `dist/public`
- **Auto Sync**: Build process (`script/build.ts`) automatically generates `server/sync-data.json` from the development database before building. This ensures all products added in the admin panel are included when publishing. No manual sync-data updates needed.
- **Production Sync**: On startup in production, `server/production-sync.ts` reads `sync-data.json` and upserts all data into the production database (always runs full sync).

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
- `ADMIN_EMAIL`: Admin login email (also receives order notifications)
- `ADMIN_PASSWORD`: Admin login password
- `SESSION_SECRET`: Secret for session cookie signing
- `ADMIN_TOKEN`: Token for API-based admin operations (test-email, ship orders via API)
- `REPLY_TO_EMAIL`: (Optional) Reply-to email for transactional emails, defaults to ADMIN_EMAIL
- `STRIPE_SECRET_KEY`: Stripe secret key for payment processing
- `STRIPE_PUBLISHABLE_KEY`: Stripe publishable key for frontend
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook signature secret

### Email Configuration
- **Provider**: Resend (via Replit integration)
- **From address**: Uses Resend connector's configured from_email, or defaults to `VIPIESSE <noreply@vipiesse.com>`
- **Reply-To**: Uses REPLY_TO_EMAIL → ADMIN_EMAIL → vipiesses@gmail.com (fallback chain)
- **Credential caching**: 60 seconds to reduce API calls

### Testing Email Configuration
```bash
# Test email endpoint (requires ADMIN_TOKEN secret to be set)
curl -X POST https://your-domain/api/admin/test-email \
  -H "Content-Type: application/json" \
  -H "x-admin-token: YOUR_ADMIN_TOKEN"
```

### Shipping Orders via API
```bash
# Ship an order with tracking info (requires admin session cookie)
curl -X POST https://your-domain/api/admin/orders/123/ship \
  -H "Content-Type: application/json" \
  -H "Cookie: admin_session=YOUR_SESSION" \
  -d '{"carrier": "BRT", "trackingNumber": "123456789"}'
```

**Note**: The test-email endpoint uses `x-admin-token` header for headless/API testing. The ship endpoint uses admin session cookies (same as admin panel). Both require proper authentication.