# Konto - Multi-Shop Inventory Management System

A comprehensive inventory management system built with Payload CMS and Next.js, designed for managing inventory across multiple shops with advanced features like batch tracking, expiry management, and inter-shop stock transfers.

## 🚀 Features

### 📦 Core Inventory Management

- **Multi-Shop Operations**: Manage inventory across multiple retail/wholesale locations
- **Product Catalog**: Complete product management with categories, pricing, and specifications
- **Batch & Expiry Tracking**: Monitor product batches with expiry dates for perishable goods
- **Stock Movement**: Transfer inventory between shops with detailed audit trails
- **Supplier Management**: Track supplier information and purchase relationships
- **Service Management**: Manage services alongside products

### 📊 Advanced Inventory Features

- **Real-time Inventory Tracking**: Live inventory quantities with configurable stock alerts
- **Dual Tracking Modes**:
  - Simple inventory tracking for basic products
  - Advanced batch-based tracking for products with expiry dates
- **Stock Movement API**: RESTful API for programmatic stock transfers and automation
- **Inventory Alerts**: Automated notifications for low stock levels
- **Comprehensive Audit Trail**: Complete history of all stock movements and changes

### 👥 User & Access Management

- **Role-based Access Control**: Vendors, admins, and custom user roles
- **Multi-tenant Architecture**: Each shop can have its own users and permissions
- **Secure Authentication**: Built-in user management with Payload CMS

### 🔧 Technical Features

- **Payload CMS Admin Panel**: Intuitive admin interface for all operations
- **Next.js Frontend**: Modern React-based user interface
- **MongoDB Database**: Flexible NoSQL database for scalable data storage
- **TypeScript**: Full type safety across the entire application
- **RESTful APIs**: Well-documented APIs for integration and automation
- **Comprehensive Testing**: Integration tests for critical business logic
- **Advanced CI/CD Pipeline**: 
  - Automated testing with GitHub Actions
  - Smart semantic versioning based on commit messages
  - Staging deployment with automatic version bumping
  - Production deployment with manual approval gates
  - Automated release creation with changelog generation
- **Deployment Pipeline**:
  - Integration tests → Staging deploy → Version bump → Release creation → Production approval → Production deploy
  - Vercel hosting with separate staging and production environments
  - Git tags and GitHub releases automatically created

## 🛠️ Quick Start

### Prerequisites

- **Node.js** 18 or higher
- **pnpm** package manager
- **MongoDB** database (local or MongoDB Atlas)

### 🚀 Local Development Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd konto
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Update the following variables in your `.env` file:

   ```env
   MONGODB_URI=your_mongodb_connection_string
   MONGODB_URI_TEST=your_mongodb_connection_string_for_testing
   PAYLOAD_SECRET=your-secret-key-32-characters-long
   NODE_ENV=development
   ```

4. **Set up MongoDB Database**

   **Option A: MongoDB Atlas (Recommended)**

   - Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Create a new cluster
   - Get your connection string and update `MONGODB_URI` in `.env`

   **Option B: Local MongoDB with Docker**

   ```bash
   docker run --name mongodb -d -p 27017:27017 mongo:latest
   # Use: mongodb://localhost:27017/konto
   ```

5. **Generate Payload types**

   ```bash
   pnpm generate:types
   ```

6. **Start the development server**

   ```bash
   pnpm dev
   ```

7. **Access the application**
   - **Frontend**: `http://localhost:3000`
   - **Admin Panel**: `http://localhost:3000/admin`

### 🎯 First Time Setup

1. **Create Admin User**: Visit `/admin` and create your first admin user
2. **Set Up Your First Shop**: Add your shop details in the admin panel
3. **Add Categories**: Create product categories for organization
4. **Add Suppliers**: Set up your supplier database
5. **Create Products**: Start adding products to your inventory
6. **Configure Stock Alerts**: Set up low stock notifications

## 📁 Project Structure

```
src/
├── collections/              # Payload CMS Collections
│   ├── Users.ts             # User authentication & management
│   ├── Shops.ts             # Shop/store management
│   ├── Products.ts          # Product catalog
│   ├── Categories.ts        # Product categorization
│   ├── Suppliers.ts         # Supplier management
│   ├── Batches.ts           # Batch/expiry tracking
│   ├── Stock.ts             # Stock movement history
│   ├── Services.ts          # Service management
│   └── Media.ts             # File uploads
├── endpoints/               # Custom API Endpoints
│   └── moveStock/           # Stock movement API
├── lib/
│   └── utils/              # Utility functions
├── components/             # Reusable UI components
├── constants/              # Application constants
└── app/                   # Next.js App Router
    ├── (frontend)/        # Public frontend pages
    └── (payload)/         # Admin panel routes
```

## 🔌 API Endpoints

### Stock Movement API

Transfer inventory between shops programmatically:

```http
POST /api/move-stock
Content-Type: application/json
Authorization: Bearer <your-token>

[
  {
    "fromShopId": "shop_id_1",
    "toShopId": "shop_id_2",
    "productId": "product_id",
    "quantity": 10,
    "batchId": "batch_id" // Optional, required for batch-tracked products
  }
]
```

**Response:**

```json
{
  "success": true,
  "message": "Stock move request validated successfully",
  "data": [
    {
      "productId": "product_id",
      "fromShopId": "shop_id_1",
      "toShopId": "shop_id_2",
      "quantity": 10,
      "status": "completed"
    }
  ]
}
```

### Other Available APIs

- **Products API**: `/api/products` - CRUD operations for products
- **Shops API**: `/api/shops` - Shop management
- **Batches API**: `/api/batches` - Batch tracking
- **Stock API**: `/api/stock` - Stock movement history
- **Categories API**: `/api/categories` - Product categories
- **Suppliers API**: `/api/suppliers` - Supplier management

## 🧪 Testing

### Run Tests

```bash
# Run all tests (integration + e2e)
pnpm test

# Run integration tests only
pnpm test:int

# Run end-to-end tests only
pnpm test:e2e

# Run tests in watch mode (development)
pnpm test:int --watch
```

### Test Coverage

Comprehensive integration tests covering:

- ✅ **Stock Movement Logic**: Validation, business rules, and inventory updates
- ✅ **Inventory Tracking**: Quantity calculations and stock alerts
- ✅ **Batch Management**: Expiry tracking and batch-based movements
- ✅ **Multi-Shop Operations**: Cross-shop inventory transfers
- ✅ **API Validation**: Input validation and error handling
- ✅ **Database Operations**: CRUD operations and data integrity

## 📊 Database Schema

### Core Collections

- **Users** 👥: Authentication, user roles, and permissions
- **Shops** 🏪: Store locations, contact info, and settings
- **Categories** 📂: Product categorization and organization
- **Suppliers** 🚚: Vendor information and contact details
- **Products** 📦: Product catalog with pricing, specifications, and inventory settings
- **Batches** 🏷️: Batch tracking for expiry management and lot control
- **Stock** 📈: Complete audit trail of all stock movements and transactions
- **Services** 🛠️: Service offerings alongside products
- **Media** 🖼️: File uploads for product images and documents

### Relationship Overview

```
Shops ←→ Products ←→ Categories
  ↓         ↓
Stock ←→ Batches
  ↓
Users (Created/Updated tracking)
```

## 🚀 Production Deployment

### Automated CI/CD Pipeline

This project features a sophisticated deployment pipeline with GitHub Actions:

#### **🔄 Deployment Flow**
1. **Integration Tests** - Comprehensive test suite with MongoDB
2. **Staging Deployment** - Automatic deployment to Vercel staging environment
3. **Smart Version Bumping** - Semantic versioning based on commit messages
4. **Release Creation** - Automatic Git tags and GitHub releases with changelog
5. **Production Approval** - Manual approval gate for production deployments
6. **Production Deployment** - Deployment to Vercel production after approval

#### **📋 Pipeline Features**
- ✅ **Pre-commit hooks** with linting, formatting, and integration tests
- ✅ **Smart semantic versioning** using conventional commits
- ✅ **Automated changelogs** from commit messages
- ✅ **Staging environment** for testing before production
- ✅ **Manual approval gates** for production releases
- ✅ **Separate Vercel environments** (staging/production)
- ✅ **Git tag creation** with proper release management

#### **🔐 Required Secrets**
Set up these secrets in your GitHub repository:

```env
# Payload CMS
PAYLOAD_SECRET=your-production-secret-key-32-chars-min

# Vercel Deployment
VERCEL_TOKEN=your-vercel-api-token
ORG_ID=your-vercel-organization-id
PROJECT_ID=your-vercel-project-id

# GitHub (automatically provided)
GITHUB_TOKEN=automatically-provided-by-github
```

### Manual Deployment

#### Using Docker

```bash
# Build and run with Docker Compose
docker-compose up --build -d
```

#### Environment Variables for Production

```env
NODE_ENV=production
MONGODB_URI=your_production_mongodb_connection_string
PAYLOAD_SECRET=your-production-secret-key-32-chars-min
NEXT_PUBLIC_SERVER_URL=https://yourdomain.com
```

### Deployment Checklist

- [ ] Set up GitHub repository secrets
- [ ] Configure Vercel project with staging/production environments
- [ ] Set up production MongoDB database
- [ ] Configure GitHub environment protection rules
- [ ] Test the complete CI/CD pipeline
- [ ] Set up SSL certificates
- [ ] Configure backup strategy
- [ ] Set up monitoring and logging
- [ ] Test stock movement operations
- [ ] Verify user authentication

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Make** your changes
4. **Add** tests for new functionality
5. **Ensure** all tests pass (`pnpm test`)
6. **Commit** your changes using conventional commit format (see below)
7. **Push** to the branch (`git push origin feature/amazing-feature`)
8. **Open** a Pull Request

### 📝 Conventional Commit Guidelines

This project uses conventional commits for automatic semantic versioning. Your commit messages determine how the version number is bumped:

#### **🚀 Major Version Bump** (`feat:`)
Use for new features and breaking changes:
```bash
feat: add user authentication system
feat: implement batch tracking for inventory
feat: add multi-currency support
```
**Result**: `1.0.0` → `2.0.0`

#### **🔧 Minor Version Bump** (`chore:`, `dependency:`, `devops:`)
Use for maintenance, dependencies, and infrastructure:
```bash
chore: update dependencies to latest versions
dependency: bump react to v19
devops: improve CI/CD pipeline performance
chore: refactor database connection logic
```
**Result**: `1.0.0` → `1.1.0`

#### **🐛 Patch Version Bump** (`fix:`)
Use for bug fixes and small improvements:
```bash
fix: resolve stock calculation error
fix: correct user permission validation
fix: handle edge case in batch expiry
```
**Result**: `1.0.0` → `1.0.1`

#### **📚 Other Prefixes** (Patch bump)
```bash
docs: update API documentation
test: add integration tests for stock movement
style: fix code formatting issues
refactor: improve product search performance
```

#### **⚠️ Non-Conventional Commits**
If you don't use prefixes, the system will analyze your commit content:
- Keywords like "breaking", "new feature" → Major bump
- Keywords like "update", "dependency", "improve" → Minor bump  
- Keywords like "fix", "bug", "resolve" → Patch bump
- Default → Patch bump

### Development Guidelines

- Follow TypeScript best practices
- Add integration tests for new features
- Update documentation for API changes
- Use conventional commit messages for proper versioning
- Test locally before pushing (`pnpm test`)
- Ensure pre-commit hooks pass (includes linting and type checking)

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **CMS**: Payload CMS 3.46 (Headless CMS with admin panel)
- **Database**: MongoDB with Mongoose ODM
- **Language**: TypeScript (Full type safety)
- **Styling**: Tailwind CSS + CSS Modules
- **Testing**: Vitest (Integration) + Playwright (E2E)
- **Build Tool**: Next.js built-in tooling
- **Package Manager**: pnpm
- **CI/CD**: GitHub Actions with automated semantic versioning
- **Deployment**: Vercel with staging/production environments
- **Version Control**: Git with conventional commits and automated releases
- **Pre-commit Hooks**: Husky with linting, formatting, and testing
- **Validation**: Zod schemas
- **Authentication**: Built-in Payload CMS auth

## 📚 Key Dependencies

```json
{
  "@payloadcms/db-mongodb": "3.46.0",
  "@payloadcms/next": "3.46.0",
  "@payloadcms/richtext-lexical": "3.46.0",
  "next": "15.3.2",
  "react": "19.1.0",
  "tailwindcss": "4.1.11",
  "zod": "4.0.5"
}
```

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🆘 Support & Documentation

### Getting Help

- 📖 **Documentation**: Check the `/docs` folder for detailed guides
- 🐛 **Issues**: [Create an issue](https://github.com/your-repo/konto/issues) for bugs or feature requests
- 💬 **Discussions**: Join our [GitHub Discussions](https://github.com/your-repo/konto/discussions)
- 📧 **Email**: Contact the maintainers for enterprise support

### Useful Resources

- 🔗 **Payload CMS Docs**: [https://payloadcms.com/docs](https://payloadcms.com/docs)
- 🔗 **Next.js Docs**: [https://nextjs.org/docs](https://nextjs.org/docs)
- 📝 **Test Examples**: Review test files in `/tests` for usage examples
- 🎯 **API Examples**: Check integration tests for API usage patterns

---

**Made with ❤️ for inventory management** • Built with Payload CMS & Next.js
