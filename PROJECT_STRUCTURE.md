# PWA Scheduler - Project Structure

## 📁 Organized Folder Structure

```
src/
├── api/                    # API calls and server communication
│   ├── auth.ts            # Authentication API endpoints
│   ├── schedules.ts       # Schedule management API endpoints
│   └── index.ts           # Barrel export for API modules
│
├── components/            # Vue components
│   ├── common/           # Reusable UI components
│   │   ├── NavItem.vue   # Navigation item component
│   │   └── index.ts      # Barrel export
│   ├── Calendar.vue      # Calendar component
│   ├── Login.vue         # Login form component
│   └── index.ts          # Barrel export for all components
│
├── config/               # Application configuration
│   ├── axios.ts         # Axios HTTP client configuration
│   └── index.ts         # Configuration barrel export
│
├── hooks/               # Vue composables (for future use)
│
├── router/              # Vue Router configuration
│   ├── index.ts         # Route definitions and router setup
│
├── stores/              # Pinia store modules
│   ├── auth.ts          # Authentication state management
│   ├── schedules.ts     # Schedule state management
│   └── index.ts         # Barrel export for all stores
│
├── styles/              # Global styles
│   └── tailwind.css     # Tailwind CSS imports and utilities
│
├── types/               # TypeScript type definitions
│   ├── auth.ts          # Authentication related types
│   └── index.ts         # Barrel export for all types
│
├── utils/               # Utility functions and helpers
│   ├── axios.ts         # Axios instance (moved to config/)
│   ├── db.ts            # IndexedDB utilities for offline support
│   └── jwt.ts           # JWT token utilities
│
├── views/               # Page components (route components)
│   ├── Home.vue         # Home page
│   ├── CalendarView.vue # Calendar view page
│   ├── Profile.vue      # User profile page
│   ├── Register.vue     # Registration page
│   ├── Settings.vue     # Settings page
│   └── ShareView.vue    # Schedule sharing page
│
├── App.vue              # Root component
├── main.ts              # Application entry point
└── shims-vue.d.ts       # Vue TypeScript type definitions
```

## 🔄 Architecture Pattern

### API Layer (`src/api/`)
- Contains all API calls and server communication
- Uses configured axios instance from `config/`
- Handles data fetching, caching, and error handling
- Clean separation from state management

### State Management (`src/stores/`)
- Uses Pinia for state management
- Orchestrates API calls through the API layer
- Manages application state and derived data

### Configuration (`src/config/`)
- Centralized application configuration
- HTTP client setup with interceptors
- Authentication token management

### Components (`src/components/`)
- Organized by responsibility
- `common/` - Reusable UI components
- Feature-specific components at root level

### Types (`src/types/`)
- Centralized TypeScript type definitions
- Shared interfaces for API requests/responses
- Type safety across the application

## 📊 Data Flow

```
Views/Components
       ↓
    Stores (Pinia)
       ↓
   API Layer
       ↓
 Configuration (Axios)
       ↓
   Backend API
```

## ✅ Benefits of This Structure

1. **Scalability** - Easy to add new features following the established patterns
2. **Maintainability** - Clear separation of concerns
3. **Type Safety** - Centralized type definitions
4. **Testing** - Each layer can be tested independently
5. **Offline Support** - IndexedDB utilities for PWA functionality
6. **Modular** - Barrel exports for cleaner imports
7. **PWA Ready** - Proper structure for Progressive Web App development

## 🔧 Removed Items

- ❌ `registerServiceWorker.js` - Handled by `vite-plugin-pwa`
- ❌ Duplicate `.js` and `.js.map` files - Build artifacts
- ❌ Old `services/` folder - Replaced with `api/` layer
- ❌ Old `utils/axios.ts` - Moved to `config/axios.ts`

## 📦 Dependencies Overview

- **Vue 3** - Progressive JavaScript framework
- **Pinia** - State management
- **Vue Router** - Client-side routing
- **Axios** - HTTP client
- **IndexedDB** - Browser local database (offline support)
- **Tailwind CSS** - Utility-first CSS framework
- **Full Calendar** - Calendar component
- **Heroicons Vue** - Icon library

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Type checking
npm run type-check

# Linting
npm run lint
```

## 📝 Import Examples

### Recommended Import Patterns

```typescript
// Using barrel exports (recommended)
import { NavItem } from '@/components'
import { useAuthStore, useSchedulesStore } from '@/stores'
import { authApi, schedulesApi } from '@/api'
import type { LoginCredentials } from '@/types'
import { axiosInstance } from '@/config'

// Direct imports (when needed)
import { NavItem } from '@/components/common/NavItem.vue'
import { useAuthStore } from '@/stores/auth'
```

## 🔐 Service Worker & PWA

The PWA configuration is handled by `vite-plugin-pwa` in `vite.config.js`. The service worker is automatically generated and managed during the build process. No manual service worker registration is needed.

## 📱 Offline Support

The app supports offline functionality through:
- **IndexedDB** (`src/utils/db.ts`) - Local data persistence
- **Service Worker** - Automatic caching via vite-plugin-pwa
- **Fallback Logic** - API layer falls back to local DB when offline
