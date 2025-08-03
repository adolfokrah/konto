# Konto

A modern contribution and donation platform built with PayloadCMS and Next.js. Konto allows users to create donation "jars" and manage contributions with integrated payment processing.

## 🚀 Features

- **Donation Jars**: Create and manage fundraising campaigns
- **Contributions Management**: Track donations and contributors
- **Payment Integration**: Automated payment link generation
- **User Management**: Admin and contributor user roles
- **Media Management**: Handle images and files for campaigns
- **Real-time Updates**: Payment status tracking and notifications
- **Admin Dashboard**: Full-featured CMS for content management

## 🛠 Tech Stack

- **Framework**: Next.js 15.4.4
- **CMS**: PayloadCMS 3.49.1
- **Database**: MongoDB
- **Runtime**: Node.js
- **Language**: TypeScript
- **Styling**: CSS/SCSS
- **Testing**: Vitest + Playwright
- **Package Manager**: pnpm

## 📁 Project Structure

```
konto/
├── cms/                    # PayloadCMS backend application
│   ├── src/
│   │   ├── collections/    # PayloadCMS collections
│   │   │   ├── Jars/      # Donation jar management
│   │   │   ├── Contributions/ # Donation tracking
│   │   │   ├── Users/     # User management
│   │   │   └── Media/     # File uploads
│   │   ├── app/           # Next.js app directory
│   │   │   ├── (frontend)/ # Public frontend routes
│   │   │   └── (payload)/ # Admin panel routes
│   │   └── payload.config.ts # PayloadCMS configuration
│   ├── tests/             # E2E and integration tests
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
   git clone https://github.com/adolfokrah/konto.git
   cd konto
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
- **Features**: Name, description, target amount, payment links
- **Hooks**: Automatic payment link generation

### Contributions
- **Purpose**: Individual donations to jars
- **Features**: Amount tracking, contributor info, payment status
- **Hooks**: Payment status updates, notifications

### Users
- **Purpose**: System users (admins, contributors)
- **Features**: Authentication, role management

### Media
- **Purpose**: File and image management
- **Features**: Upload handling, media library

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
```

## 🔧 Configuration

### PayloadCMS Configuration
The main configuration is in `/cms/src/payload.config.ts`:
- Database connection
- Collections setup
- Admin panel customization
- Authentication settings

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

- **v1.0.0**: Initial release with core donation platform features

---

Built with ❤️ using PayloadCMS and Next.js
