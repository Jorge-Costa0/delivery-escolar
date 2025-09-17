# Overview

Pão na Hora is a school-focused bread delivery system built as a full-stack web application. The system allows students and staff to pre-order filled breads for delivery during school breaks, optimizing the traditional manual selling process. It features a React frontend with shadcn/ui components, an Express.js backend, PostgreSQL database with Drizzle ORM, and includes payment processing capabilities through PIX integration.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client uses React with TypeScript and a modern component-based architecture built on Vite for development and bundling. The UI is constructed using shadcn/ui components with Radix UI primitives, providing a comprehensive design system with Tailwind CSS for styling. State management is handled through React Query for server state and React hooks for local state. The routing system uses Wouter for a lightweight navigation solution.

## Backend Architecture
The server is built with Express.js and TypeScript, following a RESTful API design pattern. The authentication system uses JWT tokens with bcrypt for password hashing, supporting role-based access control (student/admin). The storage layer implements a repository pattern through a DatabaseStorage class, providing clean separation between business logic and data access. File structure is organized with separate concerns: routes, storage, database connection, and seed data.

## Data Storage
PostgreSQL serves as the primary database with Neon as the hosting provider. Drizzle ORM handles database operations with type-safe queries and migrations. The schema includes users, products, orders, and order items with proper relational constraints. Database migrations are managed through Drizzle Kit with schema definitions shared between client and server.

## Authentication & Authorization
JWT-based authentication with secure token storage in localStorage. Role-based access control distinguishes between students and administrators. Protected routes require authentication middleware, and admin-specific operations require additional role validation. Password security is implemented using bcrypt with proper salt rounds.

## External Dependencies
- **Neon Database**: PostgreSQL hosting with serverless capabilities
- **Stripe Integration**: Payment processing setup for future PIX implementation
- **Radix UI**: Comprehensive component library for accessible UI primitives
- **React Query**: Server state management and caching
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Drizzle ORM**: Type-safe database toolkit with migration support
- **Zod**: Runtime type validation for API requests and responses