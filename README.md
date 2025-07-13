# Konto - Inventory Management System

A comprehensive inventory management system built with Payload CMS and Next.js, designed for multi-shop inventory tracking with advanced features like batch management, expiry tracking, and stock movement operations.

## Features

### Core Functionality
- **Multi-Shop Management**: Manage inventory across multiple retail/wholesale shops
- **Product Management**: Track products with categories, pricing, and specifications
- **Batch & Expiry Tracking**: Monitor product batches with expiry dates for perishable items
- **Stock Movement**: Transfer inventory between shops with detailed audit trails
- **Supplier Management**: Track supplier information and relationships

### Advanced Features
- **Inventory Tracking**: Real-time inventory quantities with stock alerts
- **Dual Tracking Modes**: Simple inventory tracking or advanced batch-based tracking
- **Stock Movement API**: RESTful API for programmatic stock transfers
- **User Management**: Role-based access control (vendors, admins)
- **Audit Trails**: Complete history of all stock movements and changes

### Technical Features
- **Built with Payload CMS**: Powerful headless CMS with admin interface
- **Next.js Frontend**: Modern React-based frontend
- **MongoDB Database**: Robust NoSQL database for flexible data storage
- **TypeScript**: Full type safety across the application
- **Comprehensive Testing**: Integration tests for critical business logic
- **CI/CD Pipeline**: Automated testing with GitHub Actions

## Quick Start

### Prerequisites
- Node.js 18 or higher
- pnpm package manager
- MongoDB database (local or cloud)

### Local Development Setup

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
   PAYLOAD_SECRET=your-secret-key-32-characters-long
   NODE_ENV=development
   ```

4. **Set up MongoDB Database**
   
   **Option A: Local MongoDB**
   ```bash
   # Install MongoDB locally or use Docker
   docker run --name mongodb -d -p 27017:27017 mongo:latest
   ```
   
   **Option B: MongoDB Atlas (Cloud)**
   - Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Create a new cluster
   - Get your connection string and update `MONGODB_URI` in `.env`

5. **Generate Payload types**
   ```bash
   pnpm generate:types
   ```

6. **Start the development server**
   ```bash
   pnpm dev
   ```

7. **Access the application**
   - Frontend: `http://localhost:3000`
   - Admin Panel: `http://localhost:3000/admin`

### First Time Setup

1. Create your first admin user by visiting `/admin`
2. Set up your first shop in the admin panel
3. Add product categories and suppliers
4. Start adding products and managing inventory

## Project Structure

```
src/
├── collections/           # Payload CMS collections
│   ├── Products.ts       # Product management
│   ├── Stock.ts          # Stock movement tracking
│   ├── Batches.ts        # Batch/expiry tracking
│   ├── Shops.ts          # Shop management
│   ├── Suppliers.ts      # Supplier management
│   ├── Categories.ts     # Product categories
│   └── Users.ts          # User management
├── endpoints/            # Custom API endpoints
│   └── moveStock/        # Stock movement API
├── lib/
│   └── utils/           # Utility functions
├── components/          # Reusable components
└── app/                # Next.js app router
    ├── (frontend)/     # Public frontend
    └── (payload)/      # Admin panel
```

## API Endpoints

### Stock Movement API
```http
POST /api/move-stock
Content-Type: application/json

[
  {
    "fromShopId": "shop_id_1",
    "toShopId": "shop_id_2", 
    "productId": "product_id",
    "quantity": 10,
    "batchId": "batch_id" // Optional, for batch-tracked products
  }
]
```

## Testing

### Run Integration Tests
```bash
# Run all tests
pnpm test

# Run integration tests only
pnpm test:int

# Run tests in watch mode
pnpm test:watch
```

### Test Coverage
The project includes comprehensive integration tests covering:
- Stock movement validation and business logic
- Inventory quantity updates
- Batch tracking and expiry management
- Multi-shop operations
- API endpoint validation

## Database Schema

The system uses the following main collections:
- **Users**: Authentication and user management
- **Shops**: Store locations and details
- **Categories**: Product categorization
- **Suppliers**: Vendor information
- **Products**: Product catalog with pricing and specs
- **Batches**: Batch tracking for expiry management
- **Stock**: Stock movement transaction history

## Production Deployment

### Using Docker
```bash
# Build and run with Docker Compose
docker-compose up --build
```

### Environment Variables for Production
```env
NODE_ENV=production
MONGODB_URI=your_production_mongodb_connection_string
PAYLOAD_SECRET=your-production-secret-key
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **CMS**: Payload CMS 3.0
- **Database**: MongoDB
- **Language**: TypeScript
- **Styling**: CSS Modules
- **Testing**: Vitest + Playwright
- **CI/CD**: GitHub Actions
- **Package Manager**: pnpm

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For questions, issues, or contributions:
- Create an issue in the GitHub repository
- Check the documentation in the `/docs` folder
- Review the test files for usage examples
