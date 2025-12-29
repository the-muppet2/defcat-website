# Architecture Diagrams

Visual documentation for DefCat DeckVault's system architecture.

## Available Diagrams

### Database Schema

**File:** [database-schema.md](./database-schema.md)

Entity Relationship Diagram showing all database tables and their relationships.

### System Architecture

**File:** [system-architecture.md](./system-architecture.md)

High-level overview of the application architecture including frontend, backend, and external services.

### Authentication Flow

**File:** [authentication-flow.md](./authentication-flow.md)

How users authenticate via Patreon and how access control works.

### Patreon OAuth

**File:** [patreon-oauth-flow.md](./patreon-oauth-flow.md)

The Patreon login flow and tier verification process.

### API Routes

**File:** [api-routes-middleware.md](./api-routes-middleware.md)

Overview of API endpoints and access control.

### Component Hierarchy

**File:** [component-hierarchy.md](./component-hierarchy.md)

Organization of UI components.

### Data Flow

**File:** [data-flow.md](./data-flow.md)

How data moves through the application.

### Deployment

**File:** [deployment-architecture.md](./deployment-architecture.md)

Production deployment and hosting setup.

---

## Technology Stack

### Frontend

- **Framework:** Next.js with React
- **Styling:** Tailwind CSS
- **Package Manager:** Bun

### Backend

- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth + Patreon OAuth
- **Hosting:** Netlify

### External APIs

- **Patreon:** OAuth & tier verification
- **Moxfield:** Deck data import
- **Scryfall:** Card data & images
- **Resend:** Email notifications

---

## Viewing Diagrams

All diagrams use **Mermaid** syntax and can be viewed in:

1. **GitHub** - Renders Mermaid diagrams natively
2. **VS Code** - With "Markdown Preview Mermaid Support" extension
3. **Mermaid Live Editor** - [mermaid.live](https://mermaid.live)

---

**Last Updated:** 2025-10-31
