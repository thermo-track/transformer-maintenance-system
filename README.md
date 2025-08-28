# Transformer Maintenance System

A modern web platform for power transformer maintenance, combining AI-powered thermal imaging, inspection management, and digital record-keeping.

## 🚀 Overview

The **Transformer Maintenance System (TMS)** helps operators and technical officers monitor, inspect, and maintain transformers efficiently. The system uses **AI-powered thermal image analysis** to detect faults, supports manual validation, and maintains a complete history of maintenance actions.

## 🟢 Phase 1: Transformer & Baseline Image Management

*Current Focus:*
- Manage transformer records (add, edit, view, list, delete)
- Upload, store, view, and delete baseline and inspection thermal images for each transformer

## ✨ Implemented Features

### Transformer Management
- Add, view, edit, list, and delete transformers
- Store transformer metadata in a relational database (PostgreSQL)

### Thermal Image Upload & Management
- Upload, edit, view, and delete baseline thermal images for each transformer
- Upload, edit, view, and delete maintenance/inspection images for periodic checks
- Each image is tagged with:
  - Image type (Baseline / Maintenance)
  - Environmental condition (Sunny, Cloudy, Rainy) – for baseline images
  - Metadata: upload date/time, uploader (admin user ID or name)

### Inspection Management
- Create, edit, view, and delete inspections under transformers
- Associate multiple inspection images with each inspection record

### Map Integration
- Add transformer locations via interactive map
- View transformers on the map and get directions in Google Maps

### System Architecture
- Responsive React frontend for all management tasks
- RESTful Spring Boot backend API for transformer, inspection, and image management
- Efficient image storage and retrieval integrated with Cloudinary
- All transformer and image metadata stored in PostgreSQL

## ⚡ Setup Instructions

### 🔑 Prerequisites

- [Node.js](https://nodejs.org/) (for frontend)
- [Java 21](https://www.oracle.com/apac/java/technologies/downloads/#java21) (for backend)
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
2. Copy **Cloud Name** and **API Key** from your dashboard
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

- Authentication & Authorization: No user accounts, roles, or access control (all operations are unrestricted).
- AI Thermal Analysis: Automated anomaly detection not yet integrated (images stored only).
- Data Validation: Limited server-side validation for some numeric and domain-specific fields.
- Security Hardening: No rate limiting, content security policy, or request size constraints configured.
- Deployment: No IaC scripts (Terraform/Docker Compose) provided.
- Bulk Operations: No bulk import/export (CSV/Excel) for transformers or inspections.
- Mobile: Layout not optimized for narrow devices.


## 📄 License

This project is for **academic and demonstration purposes**.

## 👥 Authors

- **210325M** - Kuruppu M.P.
- **210349N** - Madhushan I.D.
- **210371A** - Manatunge J.M.
- **210463H** - Perera L.C.S.

---

*For issues or contributions, please contact the development team.*