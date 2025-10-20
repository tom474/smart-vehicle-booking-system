# Smart Vehicle Booking System – Client

This is the frontend application for the Smart Vehicle Booking System developed for **De Heus Vietnam**. It provides a modern, responsive web interface for employees, drivers, coordinators, executives, and admins to manage vehicle bookings, trips, expenses, and system operations.

---

## Folder Structure

```
client/
├── app/                         # Next.js App Router pages and layouts
│   ├── admin/                   # Admin dashboard and management
│   ├── dashboard/               # Main dashboard views
│   ├── driver/                  # Driver-specific features
│   │   ├── expense/             # Expense management
│   │   ├── leave/               # Leave requests
│   │   ├── services/            # Vehicle service requests
│   │   ├── trips/               # Trip management
│   │   └── executive/           # Executive activity tracking
│   ├── executive/               # Executive role features
│   ├── requester/               # Employee booking features
│   │   └── bookings/            # Booking management and trips
│   ├── public/                  # Public trip tracking pages
│   └── globals.css              # Global styles and Tailwind imports
├── apis/                        # API client functions and types
├── components/                  # Reusable UI components
│   └── ui/                      # shadcn/ui component library
├── hooks/                       # Custom React hooks
├── lib/                         # Utility functions and configurations
├── types/                       # TypeScript type definitions
├── services/                    # Business logic and API services
├── locales/                     # Internationalization files
├── i18n/                        # i18n configuration
├── assets/                      # Static assets (images, icons)
├── public/                      # Public static files
├── certificates/                # SSL certificates (gitignored)
├── .next/                       # Next.js build output (auto-generated)
├── .env                         # Environment variables
├── next.config.ts               # Next.js configuration
├── tailwind.config.js           # Tailwind CSS configuration
└── README.md                    # Project overview (you are here)
```

---

## Core Dependencies

| Category             | Libraries/Tools                                            |
| -------------------- | ---------------------------------------------------------- |
| Framework            | `next`, `react`, `react-dom`                               |
| Styling              | `tailwindcss`, `@tailwindcss/typography`, `tailwind-merge` |
| UI Components        | `@radix-ui/*`, `lucide-react`, `sonner`                    |
| Forms & Validation   | `react-hook-form`, `@hookform/resolvers`, `zod`            |
| State Management     | `swr`, `zustand`                                           |
| Authentication       | `@azure/msal-browser`, `@azure/msal-react`                 |
| Internationalization | `next-intl`                                                |
| Date Handling        | `date-fns`                                                 |
| Maps & Location      | `@googlemaps/google-maps-services-js`                      |
| File Upload          | `@azure/storage-blob`                                      |
| Drag & Drop          | `@dnd-kit/core`, `@dnd-kit/sortable`                       |
| Dev Tools            | `typescript`, `eslint`, `prettier`, `@biomejs/biome`       |
| Runtime              | `bun` (package manager and runtime)                        |

---

## Environment Variables

The client uses the following environment variables, which should be defined in a `.env` file at the project root.

| Category                     | Variable Name                        | Description                           |
| ---------------------------- | ------------------------------------ | ------------------------------------- |
| **Google Maps**              | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`    | API key for Google Maps integration   |
|                              | `GOOGLE_MAPS_API_KEY`                | Same API key for server API functions |
| **Microsoft Authentication** | `NEXT_PUBLIC_MICROSOFT_CLIENT_ID`    | Azure Entra ID application client ID  |
|                              | `NEXT_PUBLIC_MICROSOFT_TENANT_ID`    | Azure tenant ID                       |
|                              | `NEXT_PUBLIC_MICROSOFT_CALLBACK_URL` | OAuth redirect URI for Microsoft SSO  |
|                              | `POST_LOGOUT_URL`                    | URL to redirect after logout          |

> 💡 Note: Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. Keep sensitive data in server-only variables.

> 💡 Tip: Do **not** commit your `.env` file. Use `.env.example` to share config templates.

---

## Scripts

| Script          | Description                             |
| --------------- | --------------------------------------- |
| `bun dev`       | Start development server with Turbopack |
| `bun run build` | Build production-ready application      |
| `bun start`     | Start production server                 |
| `bun lint`      | Run ESLint for code quality checks      |

---

## Getting Started

First, install dependencies:

```bash
bun install
```

Then, run the development server:

```bash
bun dev
```

---

## Deployment

### Docker Deployment

The application includes a multi-stage `Dockerfile` for containerized deployment:

```bash
# Build the Docker image
docker build -t deheus-svb-client .

# Run the container
docker run -p 3000:3000 deheus-svb-client
```

---

## Development Guidelines

### Code Organization

- Use the `app` directory for pages and layouts
- Place reusable components in `components`
- Keep API functions in `apis`
- Store utility functions in `lib`

### Styling

- Use Tailwind CSS for styling
- Follow the design system defined in `tailwind.config.js`
- Use shadcn/ui components for consistent UI elements

### State Management

- Use SWR for server state management
- Local state with React hooks
- Form state with react-hook-form

### Type Safety

- All API responses should have corresponding TypeScript types
- Use Zod schemas for runtime validation
- Leverage Next.js TypeScript integration
