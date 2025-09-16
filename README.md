# hoga

A modern contribution and donation platform built with PayloadCMS and Next.js. hoga allows users to create donation "jars" and manage contributions with integrated payment processing.

## 🚀 Features

- **Donation Jars**: Create and manage fundraising campaigns with images and descriptions
- **Contributions Management**: Track donations with contributor phone numbers and amounts
- **Payment Integration**: Automated payment link generation with status tracking
- **Payment Status Components**: Visual status indicators (pending, completed, failed) with Tailwind CSS styling
- **User Management**: Admin authentication and user roles
- **Media Management**: Image upload and management system for jar campaigns
- **Admin Dashboard**: Full-featured PayloadCMS interface for content management
- **Type Safety**: Full TypeScript implementation with generated types
- **Modern UI**: Tailwind CSS v4 with custom utility classes and responsive design

## 🛠 Tech Stack

- **Framework**: Next.js 15.4.5
- **CMS**: PayloadCMS 3.49.1
- **Database**: MongoDB
- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.1.11 + SCSS
- **UI Utils**: clsx + tailwind-merge for class management
- **Testing**: Vitest + Playwright
- **Package Manager**: pnpm

## 📁 Project Structure

```
hoga/
├── cms/                    # PayloadCMS backend application
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
└── README.md              # This file
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- MongoDB database

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/adolfokrah/hoga.git
   cd hoga
   ```

2. **Navigate to the CMS directory**
   ```bash
   cd cms
   ```

3. **Install dependencies**
   ```bash
   pnpm install
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your:
   - MongoDB connection string (`MONGODB_URI`)
   - PayloadCMS secret (`PAYLOAD_SECRET`)
   - Any payment gateway credentials

5. **Start the development server**
   ```bash
   pnpm dev
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Admin Panel: http://localhost:3000/admin

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

The application can be deployed to various platforms:

1. **PayloadCMS Cloud**: Direct deployment with managed MongoDB
2. **Vercel/Netlify**: For the Next.js application
3. **Docker**: Using the provided Dockerfile and docker-compose.yml

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
- Check the [CMS README](./cms/README.md) for technical details
- Review the [PayloadCMS documentation](https://payloadcms.com/docs)
- Open an issue for bugs or feature requests

## 🔄 Version History

- **v1.1.2**: Current version with enhanced UI components and Tailwind CSS integration
  - Added PaymentStatus component with visual status indicators
  - Integrated Tailwind CSS v4 with custom utility functions
  - Enhanced admin panel styling with custom SCSS
  - Improved TypeScript configuration and linting
- **v1.0.0**: Initial release with core donation platform features

---

Built with ❤️ using PayloadCMS and Next.js
