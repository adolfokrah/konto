# Konto

A modern contribution and donation platform built with PayloadCMS, Next.js, and React Native/Expo. Konto allows users to create donation "jars" and manage contributions with integrated payment processing across web and mobile platforms.

This is a **monorepo** managed with **pnpm workspaces**, containing shared packages, backend CMS, and mobile application.

## 🚀 Features

- **Monorepo Architecture**: Shared code and utilities across web and mobile platforms
- **Cross-Platform Access**: Web admin dashboard and mobile app for contributors
- **Shared Type Safety**: TypeScript types shared between all applications
- **Donation Jars**: Create and manage fundraising campaigns with images and descriptions
- **Mobile-First Contributions**: Native mobile app for easy donation experiences
- **Contributions Management**: Track donations with contributor phone numbers and amounts
- **Payment Integration**: Automated payment link generation with status tracking
- **Payment Status Components**: Visual status indicators (pending, completed, failed) with modern styling
- **User Management**: Admin authentication and user roles across platforms
- **Media Management**: Image upload and management system for jar campaigns
- **Admin Dashboard**: Full-featured PayloadCMS interface for content management
- **Native Mobile UI**: Expo Router-based navigation with React Native components
- **Shared Utilities**: Common functions for formatting, validation, and business logic
- **Modern UI**: Tailwind CSS v4 for web, React Native styling for mobile

## 🛠 Tech Stack

### Monorepo & Tooling
- **Monorepo**: pnpm workspaces for efficient dependency management
- **Package Manager**: pnpm with workspace protocol
- **Shared Packages**: TypeScript types and utilities across platforms
- **Code Quality**: ESLint, Prettier, Husky, lint-staged

### Backend & Web
- **Framework**: Next.js 15.4.5
- **CMS**: PayloadCMS 3.50.0
- **Database**: MongoDB
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.1.11 + SCSS
- **UI Utils**: clsx + tailwind-merge for class management

### Mobile
- **Framework**: React Native 0.79.5 + Expo ~53.0.20
- **Navigation**: Expo Router 5.1.4 with tab-based architecture
- **UI Components**: React Native with Expo Vector Icons
- **Animations**: React Native Reanimated 3.17.4
- **Language**: TypeScript 5.8.3

### Development & Testing
- **Runtime**: Node.js 18+
- **Testing**: Vitest + Playwright (web), Jest (mobile)
- **Package Manager**: pnpm with workspaces
- **Linting**: ESLint with Expo config

## 📁 Project Structure

```
konto/                      # Monorepo root
├── packages/               # Shared packages
│   ├── shared-types/      # TypeScript types shared across platforms
│   │   ├── src/
│   │   │   └── index.ts   # Jar, Contribution, User, Payment types
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── shared-utils/      # Utility functions shared across platforms
│       ├── src/
│       │   └── index.ts   # Currency, phone, validation utilities
│       ├── package.json
│       └── tsconfig.json
├── cms/                    # PayloadCMS backend application (@konto/cms)
│   ├── src/
│   │   ├── collections/    # PayloadCMS collections
│   │   │   ├── Jars/      # Donation jar management with payment links
│   │   │   ├── Contributions/ # Donation tracking with status components
│   │   │   ├── Users/     # User authentication and management
│   │   │   └── Media/     # File uploads and media library
│   │   ├── app/           # Next.js app directory
│   │   │   ├── (frontend)/ # Public frontend routes
│   │   │   └── (payload)/ # Admin panel routes with custom styling
│   │   ├── lib/           # Utility functions
│   │   │   └── utils/     # Tailwind CSS utilities (cn function)
│   │   └── payload.config.ts # PayloadCMS configuration
│   ├── tests/             # E2E and integration tests
│   │   ├── e2e/          # End-to-end tests with Playwright
│   │   ├── int/          # Integration tests with Vitest
│   │   └── utils/        # Test utilities and cleanup
│   ├── postcss.config.mjs # PostCSS configuration for Tailwind
│   ├── tailwind.config.js # Tailwind CSS v4 configuration
│   ├── package.json
│   └── README.md          # CMS-specific documentation
├── mobile-app/             # React Native Expo mobile application (@konto/mobile-app)
│   ├── app/               # Expo Router app directory
│   │   ├── (tabs)/       # Tab-based navigation screens
│   │   │   ├── index.tsx # Home screen
│   │   │   └── explore.tsx # Explore/Browse jars screen
│   │   ├── _layout.tsx   # Root layout configuration
│   │   └── +not-found.tsx # 404 screen
│   ├── components/        # Reusable React Native components
│   ├── constants/         # App constants and configuration
│   ├── hooks/            # Custom React hooks for mobile
│   ├── assets/           # Images, icons, and static files
│   ├── scripts/          # Build and development scripts
│   ├── app.json          # Expo configuration
│   ├── package.json
│   └── README.md          # Mobile app documentation
├── package.json            # Root monorepo configuration
├── pnpm-workspace.yaml    # pnpm workspace configuration
├── tsconfig.json          # Root TypeScript configuration
└── README.md              # This file
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm 9+ (for workspace support)
- MongoDB database
- For mobile development: iOS Simulator (macOS) or Android Studio

### Monorepo Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/adolfokrah/konto.git
   cd konto
   ```

2. **Install all dependencies** (root + all workspaces)
   ```bash
   pnpm install
   ```

3. **Build shared packages**
   ```bash
   pnpm --filter "@konto/shared-*" build
   ```

### Backend Setup

1. **Navigate to the CMS directory**
   ```bash
   cd cms
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your:
   - MongoDB connection string (`MONGODB_URI`)
   - PayloadCMS secret (`PAYLOAD_SECRET`)
   - Any payment gateway credentials

3. **Start the development server**
   ```bash
   # From root
   pnpm dev:cms
   
   # Or from cms directory
   cd cms && pnpm dev
   ```

4. **Access the web application**
   - Frontend: http://localhost:3000
   - Admin Panel: http://localhost:3000/admin

### Mobile App Setup

1. **Start the Expo development server**
   ```bash
   # From root
   pnpm dev:mobile
   
   # Or from mobile-app directory
   cd mobile-app && pnpm dev
   ```

2. **Run on device/simulator**
   ```bash
   # From mobile-app directory
   cd mobile-app
   
   # iOS (requires macOS and Xcode)
   pnpm ios
   
   # Android (requires Android Studio)
   pnpm android
   
   # Web browser
   pnpm web
   ```

3. **Use Expo Go app** (Alternative)
   - Install Expo Go on your mobile device
   - Scan the QR code from the terminal

### Development Workflow

**Start everything:**
```bash
# Start all apps in parallel
pnpm dev
```

**Work on specific parts:**
```bash
# Backend only
pnpm dev:cms

# Mobile only
pnpm dev:mobile

# Build shared packages when you modify them
pnpm --filter "@konto/shared-*" build
```

### Docker Setup (Optional)

For local development with Docker:

```bash
cd cms
docker-compose up -d
pnpm dev
```

## 📊 Core Collections

### Jars
- **Purpose**: Fundraising campaigns/donation jars
- **Features**: Name, description, target amount, image uploads
- **Fields**: Name, description, image (media upload), target amount, currency
- **Hooks**: Automatic payment link generation on creation
- **Admin**: Uses name as title, organized display

### Contributions
- **Purpose**: Individual donations to jars
- **Features**: Amount tracking, contributor info, payment status with visual indicators
- **Fields**: Jar relationship, contributor name, phone number, amount, payment status
- **Components**: Custom PaymentStatus component with Tailwind CSS styling
- **Hooks**: Payment status updates and validation
- **Admin**: Uses contributor phone number as title

### Users
- **Purpose**: System authentication and user management
- **Features**: Admin authentication, role-based access control
- **Fields**: Standard PayloadCMS user fields with custom extensions

### Media
- **Purpose**: File and image management for jar campaigns
- **Features**: Upload handling, media library integration
- **Usage**: Referenced by jars for campaign images

## 🧪 Testing

The project includes comprehensive testing:

```bash
cd cms

# Run all tests
pnpm test

# Integration tests only
pnpm test:int

# End-to-end tests only
pnpm test:e2e
```

## 🏗 Development Scripts

### Monorepo Commands (from root)
```bash
# Install all dependencies
pnpm install

# Start all applications
pnpm dev

# Build all applications
pnpm build

# Lint all code
pnpm lint

# Format all code
pnpm format

# Type check all code
pnpm type-check

# Clean all build artifacts
pnpm clean

# Clean all node_modules
pnpm clean:deps

# Specific workspace commands
pnpm dev:cms              # Start CMS only
pnpm dev:mobile           # Start mobile app only
pnpm build:cms            # Build CMS only
pnpm build:mobile         # Build mobile app only
pnpm test:cms             # Test CMS only

# Shared packages
pnpm --filter "@konto/shared-*" build    # Build all shared packages
pnpm --filter "@konto/shared-types" dev  # Watch shared types
```

### Backend (CMS)
```bash
cd cms

# Development
pnpm dev              # Start dev server
pnpm devsafe          # Clean start (removes .next)

# Building
pnpm build            # Production build
pnpm start            # Start production server

# PayloadCMS
pnpm payload          # PayloadCMS CLI
pnpm generate:types   # Generate TypeScript types
pnpm generate:importmap # Generate import map

# Code Quality
pnpm lint             # ESLint check
pnpm lint:fix         # ESLint auto-fix
pnpm format           # Prettier formatting
pnpm format:check     # Check formatting
pnpm format:lint      # Format and lint together
pnpm type-check       # TypeScript type checking
pnpm clean            # Clean build artifacts
```

### Mobile App
```bash
cd mobile-app

# Development
pnpm dev              # Start Expo dev server
pnpm android          # Run on Android
pnpm ios              # Run on iOS
pnpm web              # Run in web browser

# Building
pnpm build            # Export for production

# Utilities
pnpm lint             # ESLint check
pnpm type-check       # TypeScript check
pnpm reset-project    # Reset Expo project
pnpm clean            # Clean build artifacts
```

### Shared Packages
```bash
# From root, build all shared packages
pnpm --filter packages/* build

# Build specific package
pnpm --filter @konto/shared-types build
pnpm --filter @konto/shared-utils build

# Watch mode for development
pnpm --filter @konto/shared-types dev
```

## 🔧 Configuration

### PayloadCMS Configuration
The main configuration is in `/cms/src/payload.config.ts`:
- Database connection (MongoDB)
- Collections setup (Jars, Contributions, Users, Media)
- Admin panel customization with custom SCSS
- Authentication settings and user roles

### Tailwind CSS Configuration
- **Version**: Tailwind CSS v4.1.11 with modern CSS features
- **Config**: `tailwind.config.js` for content paths and customization
- **Custom SCSS**: `/cms/src/app/(payload)/custom.scss` for admin panel styling
- **Utilities**: Custom `cn()` function in `/cms/src/lib/utils/tw-merge.ts` for class merging

### Environment Variables
Required environment variables:
- `MONGODB_URI`: MongoDB connection string
- `PAYLOAD_SECRET`: Secret key for PayloadCMS
- Additional payment gateway variables as needed

## 🚀 Deployment

### Backend Deployment
The PayloadCMS backend can be deployed to various platforms:

1. **PayloadCMS Cloud**: Direct deployment with managed MongoDB
2. **Vercel/Netlify**: For the Next.js application
3. **Docker**: Using the provided Dockerfile and docker-compose.yml

### Mobile App Deployment

1. **Expo Application Services (EAS)**
   ```bash
   cd mobile-app
   
   # Build for iOS/Android
   npx eas build --platform all
   
   # Submit to app stores
   npx eas submit --platform all
   ```

2. **Web Deployment**
   ```bash
   cd mobile-app
   pnpm web
   npx expo export:web
   ```

3. **Over-the-Air Updates**
   ```bash
   cd mobile-app
   npx eas update
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Check the [CMS README](./cms/README.md) for backend technical details
- Check the [Mobile App README](./mobile-app/README.md) for mobile development details
- Review the [PayloadCMS documentation](https://payloadcms.com/docs)
- Review the [Expo documentation](https://docs.expo.dev/)
- Open an issue for bugs or feature requests

## 🔄 Version History

- **v1.1.2**: Added mobile app with React Native/Expo
  - Native mobile application with Expo Router navigation
  - Cross-platform support (iOS, Android, Web)
  - Tab-based mobile UI architecture
  - React Native animations and gestures
  - Enhanced UI components with visual status indicators
  - Integrated Tailwind CSS v4 with custom utility functions
  - Enhanced admin panel styling with custom SCSS
  - Improved TypeScript configuration and linting
- **v1.0.0**: Initial release with core donation platform features

---

Built with ❤️ using PayloadCMS, Next.js, and React Native/Expo
