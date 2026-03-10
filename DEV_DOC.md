# Car-Pooling System - Frontend Documentation

Welcome to the development documentation for the **Car-Pooling System Web Frontend**. This project is built using modern web technologies to provide a seamless experience for both drivers and riders.

## Tech Stack

- **Core**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Authentication**: [Clerk](https://clerk.com/)
- **Routing**: [React Router DOM v7](https://reactrouter.com/en/main)
- **Styling**: 
  - [Tailwind CSS v4](https://tailwindcss.com/)
  - [Styled Components](https://styled-components.com/)
  - CSS Variables for Theming (`src/index.css`)
- **API Layer**: Custom `fetch` wrapper in `src/lib/api.js`
- **File Storage**: [Firebase Storage](https://firebase.google.com/docs/storage)
- **Maps**: `@react-google-maps/api`
- **Icons**: [Lucide React](https://lucide.dev/)

---

## Project Structure

```text
Car-Pooling-System-Web-Frontend/
├── .github/              # GitHub Actions / Workflows
├── public/               # Static assets
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── common/       # Shared generic components (FilePicker, etc.)
│   │   ├── home/         # Homepage-specific components
│   │   └── layout/       # App layout & navigation
│   ├── constants/        # Global constants (Theme, Clerk Appearance)
│   ├── hooks/            # Custom React hooks (useProfile)
│   ├── lib/              # Library configurations (api.js)
│   ├── Pages/            # Page-level components
│   │   ├── driver/       # Pages for Driver role
│   │   ├── rider/        # Pages for Rider role
│   │   └── ...           # Shared pages (Auth, Profile, Role Selection)
│   ├── services/         # API Service layer (rideService, driverService)
│   ├── App.jsx           # Main routing & app entry
│   ├── index.css         # Global Tailwind & base styling
│   └── main.jsx          # React DOM mounting
├── utils/                # Utility functions & external integrations
│   ├── firbase.js        # Firebase initialization
│   └── uploadToStorage.js # File upload/delete logic
├── .env                  # Environment variables
├── vite.config.js        # Vite configuration
└── package.json          # Dependencies & Scripts
```

---

## Authentication & Roles

The system uses **Clerk** for authentication. User roles are managed via Clerk's `unsafeMetadata`.

### Roles
- **Rider**: Default role. Can search and book rides.
- **Driver**: Can create rides and manage their driver profile.

### Role Logic (`src/App.jsx`)
- Upon sign-in, users with no role are redirected to `/role-selection`.
- Routing is dynamic; certain paths (like `/driver/create-ride`) are protected and based on the user's role.

---

## API Architecture

The application communicates with the backend via the `src/lib/api.js` layer.

### Features of the API Layer:
- **Automatic Fallback**: Attempts to connect to `VITE_BACKEND_URL` and falls back to `localhost:3000` if unavailable.
- **Helpers**: Clean wrappers for `get`, `post`, `put`, and `del`.
- **Driver/Rider Split**: Centralized exports for all major endpoints like `getDriverProfile`, `bookRide`, etc.

### External Services:
- **Firebase**: Used for uploading/deleting files (driver docs, vehicle images) via `utils/uploadToStorage.js`.

---

## Key Routes

| Path | Component | Description |
| :--- | :--- | :--- |
| `/` | `HomePage` | Dashboard / Landing |
| `/sign-in` | `SignInPage` | Auth Sign In |
| `/role-selection` | `RoleSelection` | Initial role setup |
| `/profile` | `MyProfilePage` | Unified profile view |
| `/my-rides` | `DriverRides` / `RiderRides` | Role-based history |
| `/search` | `SearchRidesPage` | Search for available trips |
| `/driver/register`| `DriverRegistration`| Multi-step onboarding for drivers |
| `/driver/create-ride`| `CreateRidePage`| Driver tool to publish a trip |

---

## Styling & Theming

### Design System
Colors are defined as CSS Variables in `src/index.css`:
- `--color-primary`: `#13ec5b` (Vibrant Green)
- `--color-bg`: `#f6f8f6` (Soft Neutral)
- `--color-surface`: `#ffffff`

### Approach
- **Tailwind**: Used for layout, spacing, and modern utilities.
- **Styled Components**: Used for more complex, logic-heavy UI elements where internal state affects styling.

---

## Development Workflow

### Scripts
- `npm run dev`: Start local development server (Vite).
- `npm run build`: Generate production build in `/dist`.
- `npm run lint`: Run ESLint checks.
- `npm run format`: Prettify code.

### Adding New Features
1. **API**: Add endpoints to `src/lib/api.js` or `src/services/`.
2. **Components**: Place reusable parts in `src/components/common/`.
3. **Pages**: Add role-specific pages under `src/Pages/driver` or `src/Pages/rider`.
4. **Routes**: Register the new page in `src/App.jsx`.

---

## File Handling (Firebase)

Drivers must upload verification documents.
1. The frontend uses `FilePickerButton.jsx`.
2. `uploadToStorage.js` handles the communication with Firebase.
3. The resulting URL is sent to the backend to be saved in the database.

---

## Known Environment Variables

- `VITE_CLERK_PUBLISHABLE_KEY`: Clerk authentication key.
- `VITE_BACKEND_URL`: URL for the backend API.
- `VITE_FIREBASE_*`: Configuration for Firebase Storage.
- `VITE_GOOGLE_MAPS_API_KEY`: API key for map integration.

---

