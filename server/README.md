# Smart Vehicle Booking System – Server

This is the backend service for the Smart Vehicle Booking System developed for **De Heus Vietnam**. It handles core business logic for vehicle booking, trip management, user roles, and system notifications, powering the web platform used by employees, drivers, coordinators, executives, and admins.

---

## Folder Structure

```
server/
├── seeds/                       # Master & mock data seeding scripts
│   ├── master-data/
│   └── mock-data/
├── src/
│   ├── app.ts                   # App bootstrap and routing
│   ├── config/                  # Database, environment, logger config
│   ├── constants/               # Enums, keys, config maps
│   ├── controllers/             # REST controllers by feature
│   ├── cron/                    # Scheduled tasks and jobs
│   ├── database/                # Migration files and CLI configs
│   ├── dtos/                    # Data Transfer Objects
│   ├── middlewares/             # Global and scoped middleware
│   ├── repositories/            # Data access and custom repo logic
│   ├── services/                # Business logic for each module
│   ├── templates/               # Global templates
│   └── utils/                   # Helper functions and shared utilities
├── dist/                        # Compiled JS output (auto-generated)
├── .env                         # Environment variables
├── tsconfig.json                # TypeScript configuration
└── README.md                    # Project overview (you are here)
```

---

## Core Dependencies

| Category         | Libraries/Tools                                          |
| ---------------- | -------------------------------------------------------- |
| Server Framework | `express`, `routing-controllers`, `typedi`               |
| Auth & Security  | `jsonwebtoken`, `bcrypt`, `cookie-parser`                |
| ORM & DB         | `typeorm`, `pg`, `pg-query-stream`                       |
| Validation       | `class-validator`, `class-transformer`                   |
| Logging          | `pino`, `pino-http`                                      |
| Scheduling       | `node-cron`, `cronstrue`                                 |
| File Handling    | `multer`, `@azure/storage-blob`, `archiver`              |
| Dev Tools        | `typescript`, `ts-node`, `nodemon`, `eslint`, `prettier` |
| Others           | `dotenv`, `axios`, `@googlemaps/google-maps-services-js` |

---

## Environment Variables

The server uses the following environment variables, which should be defined in a `.env` file at the project root.

| Category                 | Variable Name             | Description                                                |
| ------------------------ | ------------------------- | ---------------------------------------------------------- |
| **Environment**          | `NODE_ENV`                | Application environment: `development`, `production`, etc. |
| **Port**                 | `PORT`                    | Port the server listens on                                 |
| **Database**             | `DB_HOST`                 | Database host (e.g., `localhost`, or Azure DB hostname)    |
|                          | `DB_PORT`                 | Database port (typically `5432` for PostgreSQL)            |
|                          | `DB_USERNAME`             | Database username                                          |
|                          | `DB_PASSWORD`             | Database password                                          |
|                          | `DB_NAME`                 | Name of the database                                       |
| **JWT**                  | `JWT_SECRET`              | Secret key for signing JWT tokens                          |
| **Google Maps**          | `GOOGLE_MAPS_API_KEY`     | API key for Google Maps services (ETAs, routes, etc.)      |
| **Authentication (SSO)** | `MICROSOFT_CLIENT_ID`     | Azure Entra ID application client ID                       |
|                          | `MICROSOFT_CLIENT_SECRET` | Azure Entra ID client secret                               |
|                          | `MICROSOFT_TENANT_ID`     | Azure tenant ID                                            |
|                          | `MICROSOFT_CALLBACK_URL`  | OAuth redirect URI for Microsoft SSO                       |
| **Client App**           | `CLIENT_URL`              | Frontend base URL for CORS and redirects                   |
| **Blob Storage**         | `BLOB_CONTAINER_SAS_URL`  | Azure Blob SAS URL for uploading receipts/documents        |
| **Trip Optimizer**       | `TRIP_OPTIMIZER_URL`      | Endpoint of the trip optimizer microservice                |
|                          | `TRIP_OPTIMIZER_API_KEY`  | API key to authenticate with the optimizer service         |

> 💡 Tip: Do **not** commit your `.env` file. Use `.env.example` to share config templates.

---

## Scripts

| Script                       | Description                                               |
| ---------------------------- | --------------------------------------------------------- |
| `npm run dev`                | Start server in development with `nodemon` and TypeScript |
| `npm run build`              | Compile TypeScript to JavaScript (`dist/`)                |
| `npm run start`              | Start production-ready server using compiled files        |
| `npm run clean`              | Remove the `dist/` folder                                 |
| `npm run seed`               | Seed master and mock data (dev only)                      |
| `npm run seed:master`        | Seed master data (roles, permissions, etc.)               |
| `npm run seed:mock`          | Seed mock data (vehicles, requests, etc.)                 |
| `npm run seed:production`    | Run seeding using built JS files (post-deploy)            |
| `npm run format`             | Format code with Prettier                                 |
| `npm run format:check`       | Check formatting without modifying files                  |
| `npm run lint`               | Run ESLint for code quality                               |
| `npm run lint:fix`           | Fix linting issues automatically                          |
| `npm run migration:generate` | Generate a new migration from entity changes              |
| `npm run migration:run`      | Run pending database migrations                           |
| `npm run migration:revert`   | Revert the last migration                                 |

---
