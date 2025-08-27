# Transformer Maintenance System

> A modern web platform for power transformer maintenance, combining AI-powered thermal imaging, inspection management, and digital record-keeping.

---

## 🚀 Overview

Transformer Maintenance System (TMS) helps power grid operators and technical officers monitor, inspect, and maintain transformers efficiently. The system uses AI-powered thermal image analysis to detect faults, supports manual validation, and maintains a complete history of maintenance actions.

---

## 🟢 Phase 1: Transformer & Baseline Image Management

**Current Focus:**
- Manage transformer records (add, edit, view, list)
- Upload, store, and view baseline and inspection thermal images for each transformer
- Establish foundation for future inspection and anomaly detection features

---

## ✨ Implemented Features
- Add, edit, view, and list transformers
- Upload and view baseline thermal images for each transformer
- Upload and view inspection images (if implemented)
- Responsive React frontend for all management tasks
- RESTful backend API for transformer and image management
- User authentication for technical officers (if implemented)

---

## ⚡ Setup Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) (for frontend)
- [Java 21](https://adoptium.net/) (for backend)
- [PostgreSQL](https://www.postgresql.org/) (database)
- [Git](https://git-scm.com/) (for cloning)

### 1. Clone the Repository
```powershell
git clone https://github.com/thermo-track/transformer-maintenance-system.git
cd transformer-maintenance-system
```

### 2. Backend Setup
- Navigate to backend folder:
  ```powershell
  cd tms-backend-application
  ```
- Configure database in `src/main/resources/application.properties`:
  ```
  spring.datasource.url=jdbc:postgresql://localhost:5432/tms
  spring.datasource.username=your_db_user
  spring.datasource.password=your_db_password
  ```
- Build and run backend:
  ```powershell
  ./mvnw spring-boot:run
  ```

### 3. Frontend Setup
- Open a new terminal and navigate to frontend folder:
  ```powershell
  cd tms-frontend-application
  ```
- Install dependencies:
  ```powershell
  npm install
  ```
- Start development server:
  ```powershell
  npm run dev
  ```

### 4. Access the Application
- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend API: [http://localhost:8080](http://localhost:8080)

---

## 📚 API Endpoints (Sample)
- `GET /api/transformers` — List all transformers
- `POST /api/transformers` — Add a new transformer
- `GET /api/transformers/{id}` — Get transformer details
- `PUT /api/transformers/{id}` — Update transformer record
- `POST /api/transformers/{id}/baseline-image` — Upload baseline image
- `GET /api/transformers/{id}/baseline-image` — Get baseline image

---

## ⚙️ Environment Variables

### Backend (`application.properties`)
```
spring.datasource.url=jdbc:postgresql://localhost:5432/tms
spring.datasource.username=your_db_user
spring.datasource.password=your_db_password
```

### Frontend (`src/config/env.js`)
```
export const API_BASE_URL = 'http://localhost:8080/api';
```

---

## 🚢 Deployment
- Backend: Deploy as a Spring Boot application (JAR/WAR) on your preferred server
- Frontend: Build with Vite and serve static files (`npm run build`)
- Database: Ensure PostgreSQL is running and accessible

---

## 🐞 Known Limitations & Issues
- AI anomaly detection is not yet implemented (planned for future phases)
- No role-based access control (if not implemented)
- No email notifications or advanced user management
- Image upload size may be limited by backend configuration
- Some UI features may be incomplete or under development
- Error handling and validation may need improvement

---

## 🤝 Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes
4. Push to the branch
5. Open a pull request

---

## 📄 License

This project is for academic and demonstration purposes.

---

## 👤 Authors & Credits
- Thermo-Track Team
- Special thanks to all contributors
