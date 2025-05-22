# ComplyArk - DPDPA Compliance Management System

## Overview

ComplyArk is a web application designed to help organizations manage DPDPA (Data Privacy and Data Protection Act) compliance. The system allows organizations to create and manage privacy notices, handle data subject requests, and manage other compliance requirements.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

ComplyArk follows a full-stack JavaScript architecture with a clear separation between client and server:

1. **Frontend**: React-based SPA with Tailwind CSS, Radix UI components via shadcn UI
2. **Backend**: Node.js with Express
3. **Database**: PostgreSQL with Drizzle ORM
4. **Authentication**: Session-based authentication with express-session

The application is organized into a monorepo structure with clear separation between client, server, and shared code:

- `/client` - React frontend application
- `/server` - Express backend API
- `/shared` - Shared types and database schema

## Key Components

### Frontend

1. **Component Library**: Shadcn UI components built on Radix UI primitives for consistent design
2. **State Management**: React Query for server state and local React state for UI
3. **Routing**: Wouter for lightweight client-side routing
4. **Forms**: React Hook Form with zod for validation

### Backend

1. **API Routes**: Organized by domain (auth, organizations, users, templates, notices, DPRs)
2. **Controllers**: Handle business logic for each route
3. **Middleware**: Authentication and authorization checks
4. **Storage Layer**: Abstracts database operations using Drizzle ORM

### Database Models

1. **Users**: System users with role-based permissions
2. **Organizations**: Business entities using the system
3. **Industries**: Categories for organizations
4. **Templates**: Document templates for privacy notices
5. **Notices**: Generated privacy notices
6. **DPRequests**: Data privacy requests from data subjects

## Data Flow

### Authentication Flow

1. User submits credentials to `/api/auth/login`
2. Server validates credentials and creates a session
3. Client stores session cookie and queries `/api/auth/me` to get user data
4. Protected routes check for authenticated sessions via middleware

### Notice Generation Flow

1. User completes questionnaire in frontend
2. Form data is sent to backend to generate a notice
3. Notice is saved to database and optionally translated
4. Generated notices are made available for download

### Data Request Flow

1. Data subjects submit requests via a public form
2. Requests are stored and assigned to organization users
3. Users process requests through a workflow with status updates
4. Request history is maintained for compliance records

## External Dependencies

### Production Dependencies

1. **UI Components**: Radix UI component library (accordion, dialog, dropdown, etc.)
2. **Styling**: Tailwind CSS with class-variance-authority
3. **Database**: Drizzle ORM with PostgreSQL
4. **API Communication**: React Query
5. **Forms**: React Hook Form with zod validation
6. **Date Handling**: date-fns

### Development Tools

1. **Build Tools**: Vite for frontend, esbuild for backend
2. **TypeScript**: For type safety across the application
3. **Database Migrations**: Drizzle Kit for schema changes

## Deployment Strategy

The application is configured for deployment on Replit with:

1. **Production Build**:
   - Frontend: Vite builds static assets to `/dist/public`
   - Backend: ESBuild bundles server code to `/dist`

2. **Environment Configuration**:
   - Development mode: `npm run dev` runs both client and server with hot reloading
   - Production mode: `npm run start` serves the built application

3. **Database**:
   - Uses PostgreSQL via the Replit database
   - Connection string provided via `DATABASE_URL` environment variable

4. **Scaling**:
   - Configured for autoscaling via Replit's deployment system
   - Ports: Internal port 5000 mapped to external port 80

## Getting Started

1. **Setup Database**:
   - The database schema is defined in `shared/schema.ts`
   - Run `npm run db:push` to create/update the database schema

2. **Development**:
   - Run `npm run dev` to start the development server
   - Frontend will be available at `http://localhost:5000`

3. **Production Build**:
   - Run `npm run build` to create production-ready assets
   - Run `npm run start` to start the production server