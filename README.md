# Transformer Maintenance System

A modern web platform for power transformer maintenance, combining AI-powered thermal imaging, inspection management, and digital record-keeping.

## 🚀 Overview

The **Transformer Maintenance System (TMS)** helps operators and technical officers monitor, inspect, and maintain transformers efficiently. The system uses **AI-powered thermal image analysis** to detect faults, supports manual validation, and maintains a complete history of maintenance actions.

## 🟢 Phase 1: Transformer & Baseline Image Management

*Current Focus:*
- Manage transformer records (add, edit, view, list, delete)
- Manage inspection records (add, edit, view, list, delete)
- Upload, store, view, and delete baseline and inspection thermal images for each transformer

## ✨ Implemented Features

### Transformer Management
- **Complete CRUD Operations**: Add, view, edit, list, and delete transformer records
- **Metadata Storage**: All transformer data stored in PostgreSQL relational database
- **Comprehensive Records**: Track transformer specifications, location, and operational data

### Inspection Management
- **Inspection Lifecycle**: Add, view, edit, list, and delete inspections for each transformer
- **Inspection Records**: Associate multiple inspection records with each transformer entry
- **Latest Inspection Dashboard**: Dedicated page showing the most recent inspection record for each transformer
- **Historical Tracking**: Maintain complete inspection history for each transformer

### Thermal Image Upload & Management
- **Baseline Image Storage**: Upload and manage baseline thermal images for different weather conditions (sunny, rainy, cloudy weather conditions)
- **Inspection Images**: Upload, edit, view, and delete inspection images for periodic checks
- Each image is tagged with:
  - Environmental condition (Sunny, Cloudy, Rainy)
  - Metadata: upload date/time, uploader
- **Comparison Window**: View inspection images alongside baseline images depending on weather conditions

### Map Integration
- **Location Management**: Add transformer locations using interactive map interface
- **Google Maps Integration**:
  - View individual transformers on map
  - Get directions to transformer locations through Google Maps
  - Overview map showing all transformers for quick reference

### Search and Filtering
- **Transformer Filtering**: Multiple filter options for efficient transformer list management
- **Inspection Filtering**: Dedicated filtering mechanisms for inspection records
- **Quick Search**: Fast access to specific records and data

### Sliding Panel
- **Efficient Navigation**: Streamlined sliding panel interface for seamless page transitions

### System Architecture

#### Frontend
- **React Framework**: Responsive, modern React application
- **Interactive UI**: Intuitive interface for all management tasks

#### Backend
- **Spring Boot API**: RESTful API architecture
- **Comprehensive Endpoints**: Full API coverage for transformers, inspections, and image management
- **Scalable Design**: Built for performance and scalability

#### Data Storage
- **PostgreSQL Database**: Robust relational database for all metadata storage
- **Cloudinary Integration**: Efficient cloud-based image storage and retrieval

#### Key Integrations
- **Google Maps API**: Location services and mapping functionality
- **Cloudinary CDN**: Advanced image management and delivery

## ⚡ Setup Instructions

### 🔑 Prerequisites

- [Node.js](https://nodejs.org/) (for frontend)
- [Java 21](https://www.oracle.com/java/technologies/downloads/#java21) (for backend)
- [PostgreSQL](https://www.postgresql.org/) (database)
- [Git](https://git-scm.com/) (for cloning)

### 1. Clone the Repository

```bash
git clone https://github.com/thermo-track/transformer-maintenance-system.git
cd transformer-maintenance-system
```

### 2. Environment Variables

**Backend (`.env`)**
```env
# Database configuration
DB_URL=jdbc:postgresql://localhost:<port>/<database_name>
DB_USERNAME=<postgres_username>
DB_PASSWORD=<postgres_password>
```

**Frontend (`.env`)**
```env
# Cloudinary configuration
VITE_CLOUDINARY_CLOUD_NAME=<your_cloudinary_cloud_name>
VITE_CLOUDINARY_UPLOAD_PRESET=<your_cloudinary_upload_preset>

# Backend API endpoint
VITE_BACKEND_API_URL=http://localhost:8080/api
```

### 3. Backend Setup

```bash
cd tms-backend-application
mvn spring-boot:run
```

*Note: Ensure PostgreSQL is running and the database is created before starting the backend.*

### 4. Frontend Setup

```bash
cd tms-frontend-application
npm install
npm run dev
```

### 5. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080/api

## ☁️ Cloudinary Setup

Cloudinary stores and manages transformer images (baseline + inspection).

**Setup Steps:**
1. Sign up at [cloudinary.com](https://cloudinary.com/)
2. Copy **Cloud Name** from your dashboard
3. Create an upload preset:
   - Go to **Settings → Upload → Upload Presets → Add Upload Preset**
   - Set **Signing Mode** to `Unsigned` and save
4. Add credentials to your frontend `.env` file

## 🚢 Deployment

### Production Deployment
- **Backend**: Deploy as Spring Boot application (JAR file or Docker container)
- **Frontend**: Build with `npm run build` and serve static files via web server (Nginx/Apache)
- **Database**: Ensure PostgreSQL is running and accessible with proper security configurations

### Environment Considerations
- Update environment variables for production URLs
- Configure CORS settings appropriately
- Set up SSL certificates for HTTPS
- Configure proper database connection pooling

## 🛠️ Technology Stack

- **Frontend**: React, Vite, JavaScript/TypeScript
- **Backend**: Spring Boot, Java 21
- **Database**: PostgreSQL
- **Cloud Storage**: Cloudinary
- **Build Tools**: Maven (backend), npm (frontend)

## 🔧 Development

### Running in Development Mode
```bash
# Backend (runs on port 8080)
cd tms-backend-application
mvn spring-boot:run

# Frontend (runs on port 5173)
cd tms-frontend-application
npm run dev
```

### Building for Production
```bash
# Backend
cd tms-backend-application
mvn clean package

# Frontend
cd tms-frontend-application
npm run build
```

## 🚧 Current Limitations

- **Authentication & Authorization**: No user accounts, roles, or access control (all operations are unrestricted)
- **AI Thermal Analysis**: Automated anomaly detection not yet integrated (images stored only)
- **Data Validation**: Limited server-side validation for some numeric and domain-specific fields
- **Security Hardening**: No rate limiting, content security policy, or request size constraints configured
- **Deployment**: No IaC scripts (Terraform/Docker Compose) provided
- **Bulk Operations**: No bulk import/export (CSV/Excel) for transformers or inspections
- **Mobile Optimization**: Layout not fully optimized for narrow devices

## 📄 License

This project is for **academic and demonstration purposes**.

## 👥 Authors

- **210325M** - Kuruppu M.P.
- **210349N** - Madhushan I.D.
- **210371A** - Manatunge J.M.
- **210463H** - Perera L.C.S.

---

*For issues or contributions, please contact the development team.*