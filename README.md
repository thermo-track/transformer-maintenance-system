# Transformer Maintenance System

A modern web platform for power transformer maintenance, combining AI-powered thermal imaging, inspection management, and digital record-keeping.

## 🚀 Overview

**Transformer Maintenance System (TMS)** helps operators and technical officers monitor, inspect, and maintain transformers efficiently. The system uses **AI-powered thermal image analysis** to detect faults, supports manual validation, and maintains a complete history of maintenance actions.

## 🟢 Phase 1: Transformer & Baseline Image Management

*Current Focus:*
- Manage transformer records (add, edit, view, list, delete)
- Upload, store, view, and delete baseline and inspection thermal images for each transformer

## ✨ Implemented Features

- Add, edit, view, list, delete transformers
- Upload, edit, view, and delete **baseline thermal images** for each transformer
- Upload, edit, view, and delete **inspection images** for each inspection
- Responsive **React frontend** for all management tasks
- **RESTful backend API** for transformer and image management

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
VITE_CLOUDINARY_API_KEY=<your_cloudinary_api_key>

# Backend API endpoint
VITE_BACKEND_API_URL=http://localhost:8080/api
```

### 3. Backend Setup

```bash
cd tms-backend-application
mvn spring-boot:run
```

### 4. Frontend Setup

```bash
cd tms-frontend-application
npm install
npm run dev
```

### 5. Access the Application

- Frontend: http://localhost:5173
- Backend: http://localhost:8080/api

## ☁️ Cloudinary Setup

Cloudinary stores and manages transformer images (baseline + inspection).

**Quick Setup:**
1. Sign up at [cloudinary.com](https://cloudinary.com/)
2. Copy **Cloud Name** and **API Key** from your dashboard
3. Create an upload preset: **Settings → Upload → Upload Presets → Add Upload Preset**
4. Set **Signing Mode** to `Unsigned` and save
5. Add credentials to your frontend `.env` file

## 🚢 Deployment

- **Backend**: Deploy as Spring Boot application
- **Frontend**: Build with `npm run build` and serve static files
- **Database**: Ensure PostgreSQL is running and accessible

## 📄 License

This project is for **academic and demonstration purposes**.

## 👤 Authors

- 210325M - Kuruppu M.P.
- 210349N - Madhushan I.D.
- 210371A - Manatunge J.M.
- 210463H - Perera L.C.S.