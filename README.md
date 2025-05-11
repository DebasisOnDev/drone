# DroneTech Platform

A modern drone management and control platform consisting of a real-time API server and a Next.js-based web client interface.

## Overview

DroneTech is a full-stack application that enables real-time drone monitoring, mission planning, and management. The platform is built with modern technologies and follows best practices for scalability and real-time communication.

## Project Structure

The project is divided into two main components:

- `drone-api/` - Backend REST API and WebSocket server
- `drone-client/` - Next.js frontend application

## Technologies Used

### Backend (drone-api)

- Node.js with TypeScript
- Express.js for REST API
- Socket.IO for real-time communication
- PostgreSQL with Drizzle ORM
- Redis for Socket.IO adapter and caching
- Docker for development environment

### Frontend (drone-client)

- Next.js 15
- React 19
- TailwindCSS
- React Query for data fetching
- Leaflet for map visualization
- Radix UI components
- TypeScript

## Prerequisites

- Node.js (v18 or higher)
- pnpm package manager
- Docker and Docker Compose
- Git

## Getting Started

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd dronetech
   ```

2. Set up the API server:

   ```bash
   cd drone-api
   cp .env.example .env  # Configure your environment variables
   pnpm install
   docker-compose up -d  # Start PostgreSQL and Redis
   pnpm db:generate     # Generate database schemas
   pnpm db:migrate      # Run database migrations
   pnpm db:seed        # Seed initial data
   pnpm dev            # Start the development server
   ```

3. Set up the client application:
   ```bash
   cd ../drone-client
   cp .env.example .env  # Configure your environment variables
   pnpm install
   pnpm dev            # Start the Next.js development server
   ```

The API server will be available at `http://localhost:3000` (or your configured port)
The client application will be available at `http://localhost:3001`

## Features

- Real-time drone tracking and monitoring
- Mission planning and management
- Interactive map interface
- Drone status and telemetry data
- User-friendly dashboard
- Responsive design

## Development

### API Server Commands

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm db:generate` - Generate Drizzle ORM schemas
- `pnpm db:migrate` - Run database migrations
- `pnpm db:studio` - Open Drizzle Studio for database management
- `pnpm db:seed` - Seed the database with initial data

### Client Commands

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

## Docker Support

The project includes Docker support for the development environment. The `docker-compose.yml` file in the API directory sets up:

- PostgreSQL database
- Redis server

Both services are configured with health checks and persistent volume storage.

## License

ISC License
