# Transformer Maintenance System

A modern web platform for power transformer maintenance, combining AI-powered thermal imaging, inspection management, user authentication, and digital record-keeping.

## 🚀 Overview

The **Transformer Maintenance System (TMS)** helps operators and technical officers monitor, inspect, and maintain transformers efficiently. The system uses **AI-powered thermal image analysis** to automatically detect faults, supports manual validation, provides secure user management, and maintains a complete history of maintenance actions.

## 🟢 Phase 1: Transformer & Baseline Image Management

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

### Sliding Panel Navigation
- **Efficient Navigation**: Streamlined sliding panel interface for seamless page transitions
- **Contextual Actions**: Quick access to related transformer and inspection operations

## 🟣 Phase 2: Automated Anomaly Detection

Phase 2 introduces an AI-based engine for automatically detecting thermal anomalies by comparing maintenance thermal images with baseline images. The implementation is modular and integrates seamlessly with the web application.

### AI-Based Anomaly Detection Engine
- **Image Registration & Alignment**: Automatically aligns maintenance and baseline images for accurate comparison
- **Histogram Matching**: Normalizes image intensities to account for varying thermal conditions
- **Multi-Method Fusion**: Combines AbsDiff and (1 − SSIM) methods for robust anomaly detection
- **Hotspot Detection**: Identifies thermal hotspots, asymmetries, and changes in heat patterns
- **Adaptive Thresholding**: Supports both percentile-based and fixed thresholds for anomaly flagging

### YOLO-Based Fault Type Classification
- **Object Detection Model**: Custom-trained YOLOv11 model for identifying specific fault types
- **Multi-Class Classification**: Detects various transformer fault categories based on thermal image analysis:
  - **Normal**: No anomalies detected (mostly black/blue, no hotspots)
  - **Loose Joint (Faulty)**: Middle area reddish/orange-yellowish with blue/black background
  - **Loose Joint (Potential)**: Middle area yellowish (not reddish/orange) with blue/black background
  - **Point Overload (Faulty)**: Small spot reddish/orange-yellowish, rest of wire black/blue or yellowish
  - **Point Overload (Potential)**: Small spot yellowish, rest of wire black/blue
  - **Full Wire Overload**: Entire wire is reddish or yellowish (potentially faulty)
- **Confidence Scoring**: Provides confidence levels for each detection
- **Bounding Box Localization**: Precise region identification for detected faults
- **Severity Classification**: Distinguishes between faulty and potentially faulty conditions

### Detection Fusion & Output
- **IoU-Based Matching**: Fuses unsupervised anomaly regions with YOLO detections using Intersection over Union (IoU)
- **Enriched Metadata**: Each detected region includes:
  - Pixel coordinates and bounding boxes
  - Region area and anomaly score
  - Fault type and confidence level
  - IoU metrics for fusion quality
- **Visual Overlays**: Color-coded annotations with fault labels and confidence scores
- **Structured JSON Output**: Machine-readable results for frontend consumption and storage

### Thermal Image Classification System

The system uses color temperature analysis from thermal images to classify transformer conditions:

| Condition | Thermal Appearance | Classification | Severity |
|-----------|-------------------|----------------|----------|
| **Normal** | Mostly black/blue, no reddish or yellowish spots | Normal | ✅ Safe |
| **Loose Joint (Faulty)** | Middle area reddish/orange-yellowish, background blue/black | Faulty | ⚠️ Critical |
| **Loose Joint (Potential)** | Middle area yellowish (not reddish/orange), background blue/black | Potentially Faulty | ⚡ Warning |
| **Point Overload (Faulty)** | Small spot reddish/orange-yellowish, rest of wire black/blue or yellowish | Faulty | ⚠️ Critical |
| **Point Overload (Potential)** | Small spot yellowish, rest of wire black/blue | Potentially Faulty | ⚡ Warning |
| **Full Wire Overload** | Entire wire is reddish or yellowish | Potentially Faulty | ⚡ Warning |

**Color Temperature Guide:**
- **Black/Blue**: Normal operating temperature (safe)
- **Yellowish**: Elevated temperature (potentially faulty)
- **Orange-Yellowish**: High temperature (faulty)
- **Reddish**: Critical temperature (faulty)

**Classification Logic:**
- The model analyzes thermal color distribution patterns
- Distinguishes between localized hotspots (point overload) and area heating (loose joints)
- Differentiates severity based on color intensity (yellow vs orange/red)
- Considers spatial context (spot vs middle area vs full wire)

### Side-by-Side Comparison Interface
- **Interactive Visualization**: Compare baseline and maintenance images with synchronized zoom/pan controls
- **Anomaly Highlighting**: Real-time overlay of detected anomalies with bounding boxes and heatmaps
- **Metadata Panel**: Display detection details, confidence scores, and fault classifications
- **Manual Validation**: Allow technical officers to review and validate AI detections

### Performance & Scalability
- **CPU/GPU Support**: Runs on CPU by default, automatically utilizes CUDA when available
- **Configurable Inference**: Adjustable parameters for speed/quality trade-offs
- **Batch Processing**: Support for processing multiple image pairs efficiently
- **Real-time Processing**: Fast enough for interactive use during inspections


**Outputs:**
- Fused JSON containing anomaly regions with fault types and confidence scores
- Overlay PNG visualizing anomalies with color-coded labels
- Detection metrics including IoU, area, and anomaly scores

## 👤 User Management & Authentication

Comprehensive user authentication and profile management system with secure account handling.

### Authentication System
- **User Registration**: Secure account creation with email validation
- **Email Verification**: OTP-based email verification before account activation
- **Login System**: HTTP Basic Authentication with session management
- **Password Security**: BCrypt password hashing for secure credential storage

### Profile Management
- **User Profiles**: Comprehensive user information management including:
  - Username and email
  - Full name and employee ID
  - Department and phone number
  - Profile photo upload
  - Account creation timestamp
- **Profile Photo Upload**: Direct browser-to-Cloudinary upload with preview
- **Edit Profile**: Update personal information and professional details

### Account Management
- **Settings Panel**: Dedicated user settings page accessible from sidebar
- **Account Information Display**: View all account details in an organized grid layout
- **Account Deletion**: Secure account deletion with password verification

### Security Features
- **Password Verification**: Required for sensitive operations like account deletion
- **Session Management**: Proper logout flow with localStorage clearing
- **Race Condition Prevention**: Triple-layer auth validation to prevent unauthorized requests
- **Public Endpoint Whitelist**: Protected API routes with proper access control

### User Experience
- **Smooth Transitions**: 1-second delay for success messages before redirects
- **Responsive Design**: Mobile-optimized layouts for all user management screens

### Technical Implementation
- **Spring Security Integration**: Constructor injection pattern for secure authentication
- **OTP Management**: Email-based verification with 10-minute expiration
- **Context State Management**: React Context API for global user state

## ⚡ Getting Started

### 🔑 Prerequisites

- [Node.js](https://nodejs.org/) (v18+, for frontend)
- [Java](https://www.oracle.com/java/technologies/downloads/) (for backend)
- [PostgreSQL](https://www.postgresql.org/) (database)
- [Python](https://www.python.org/) (for AI pipeline)
- [Git](https://git-scm.com/) (for cloning)
- [Maven](https://maven.apache.org/) (for backend build)

### 1. Clone the Repository

```bash
git clone https://github.com/thermo-track/transformer-maintenance-system.git
cd transformer-maintenance-system
```

### 2. Environment Variables

**Backend (`.env`)**
```
DB_URL=jdbc:postgresql://localhost:5432/transformerdb1
DB_USERNAME=<postgres_username>
DB_PASSWORD=<postgres_password>
MAIL_USERNAME=<mail_username>
MAIL_PASSWORD=<mail_password>
```

**Frontend (`.env`)**
```env
# Cloudinary configuration
VITE_CLOUDINARY_CLOUD_NAME=<your_cloudinary_cloud_name>
VITE_CLOUDINARY_UPLOAD_PRESET=<your_cloudinary_upload_preset>

# Backend API endpoint
VITE_BACKEND_API_URL=http://localhost:8080/api
```

### 3. Cloudinary Setup

Cloudinary stores and manages all images including transformer thermal images (baseline + inspection) and user profile photos.

**Setup Steps:**
1. Sign up at [cloudinary.com](https://cloudinary.com/)
2. Copy **Cloud Name** from your dashboard
3. Create an upload preset:
   - Go to **Settings → Upload → Upload Presets → Add Upload Preset**
   - Set **Signing Mode** to `Unsigned`
   - Optionally configure folders: `thermal_images/` and `profile_photos/`
   - Save the preset
4. Add credentials to your frontend `.env` file

**Image Organization:**
- Thermal images: Stored in `thermal_images/` folder
- Profile photos: Stored in `profile_photos/` folder
- Automatic URL generation and CDN delivery

### 4. Development

**Backend (Spring Boot)**
```bash
cd tms-backend-application
mvn spring-boot:run
# Runs on http://localhost:8080
```

*Note: Ensure PostgreSQL is running and the database is created before starting the backend.*

**Frontend (React + Vite)**
```bash
cd tms-frontend-application
npm install
npm run dev
# Runs on http://localhost:5173
```

**AI Pipeline (Python)**

1. Install Python dependencies:
```bash
pip install -r phase2_fault_type/requirements.txt
```

2. Ensure YOLO weights file is present:
```bash
# Use the provided model or train your own
phase2_fault_type/weights/best.pt
```

3. Run inference for a baseline/maintenance pair:
```bash
python phase2_fault_type/api/inference_api.py
```

### 5. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080/api

### System Architecture

#### Frontend
- **React Framework**: Responsive, modern React application
- **Interactive UI**: Intuitive interface for all management tasks

#### Backend
- **Spring Boot API**: RESTful API architecture
- **Spring Security**: HTTP Basic Authentication with BCrypt password encoding
- **Comprehensive Endpoints**: Full API coverage for transformers, inspections, images, and user management
- **Email Service**: JavaMail integration for OTP verification emails
- **Scalable Design**: Built for performance and scalability

#### Data Storage
- **PostgreSQL Database**: Robust relational database for all metadata storage
- **Cloudinary Integration**: Efficient cloud-based image storage and retrieval

#### Key Integrations
- **Google Maps API**: Location services and mapping functionality
- **Cloudinary CDN**: Advanced image management and delivery for thermal images and profile photos
- **YOLO (Ultralytics)**: YOLOv11 model for fault type detection and classification
- **OpenCV**: Image processing for anomaly detection pipeline
- **JavaMail**: Email service for OTP verification


## 🛠️ Technology Stack

### Frontend
- **React**: Modern React with hooks and context
- **Vite**: Fast build tool and development server
- **React Router**: Client-side routing
- **Axios**: HTTP client with interceptors
- **Lucide React**: Icon library
- **JavaScript/JSX**: Primary development language

### Backend
- **Spring Boot**: Java application framework
- **Spring Security**: Authentication and authorization
- **Spring Data JPA**: Database ORM
- **PostgreSQL**: Relational database
- **JavaMail**: Email service for OTP verification
- **BCrypt**: Password hashing
- **Maven**: Build and dependency management

### AI/ML
- **Python**: AI pipeline runtime
- **YOLOv11 (Ultralytics)**: Object detection for fault classification
- **OpenCV**: Image processing and computer vision
- **NumPy**: Numerical computations
- **scikit-image**: SSIM and image analysis

### Cloud & Storage
- **Cloudinary**: Cloud-based image storage and CDN
- **PostgreSQL**: Metadata and relational data storage

### Build & Development Tools
- **Maven**: Backend build tool
- **npm/Node.js**: Frontend package management
- **Git**: Version control
- **VS Code/IntelliJ IDEA**: Recommended IDE



### Project Structure

```
transformer-maintenance-system/
├── tms-backend-application/          # Spring Boot backend
│   ├── src/main/java/                # Java source code
│   │   ├── config/                   # Security, CORS, DB configs
│   │   ├── transformer/              # Transformer entities & APIs
│   │   ├── inspection/               # Inspection entities & APIs
│   │   └── user/                     # User management & auth
│   ├── src/main/resources/           # Application properties
│   └── pom.xml                       # Maven dependencies
├── tms-frontend-application/         # React frontend
│   ├── src/
│   │   ├── components/               # Reusable components
│   │   ├── features/                 # Feature modules
│   │   │   ├── auth/                 # Authentication pages
│   │   │   ├── transformers/         # Transformer management
│   │   │   └── maintenance/          # Inspection management
│   │   ├── config/                   # API configuration
│   │   ├── contexts/                 # React contexts
│   │   └── styles/                   # Global styles
│   ├── package.json                  # npm dependencies
│   └── vite.config.js               # Vite configuration
├── phase2_fault_type/                # AI anomaly detection
│   ├── api/                          # Inference API
│   ├── pipeline/                     # Detection pipeline
│   │   ├── detector.py               # YOLO detector
│   │   ├── unsupervised.py           # Image diff analysis
│   │   └── run_pair.py               # Main pipeline
│   ├── weights/                      # YOLO model weights
│   │   └── best.pt                   # Trained model
│   └── requirements.txt              # Python dependencies
└── README.md                         # This file
```

## 🚧 Current Limitations

### Security & Access Control
- **Role-Based Permissions**: No fine-grained role-based access control (RBAC) for different user types
- **Request Size Limits**: No constraints on file upload sizes beyond basic validation

### AI & Detection
- **Model Training**: YOLO model requires retraining for new fault types or improved accuracy

### Data & Validation
- **Data Backup**: No automated backup strategy for database and images
- **Data Export**: No bulk export functionality for reports and historical data

### Infrastructure & Deployment
- **IaC Scripts**: No Terraform or Docker Compose for automated deployment
- **CI/CD Pipeline**: No automated testing and deployment pipeline

### User Experience
- **Mobile Optimization**: Layout not fully optimized for narrow devices or tablets

## � Key Features Summary

### ✅ Completed Features
- ✅ **Full CRUD Operations**: Transformers, inspections, images, and user accounts
- ✅ **User Authentication**: Registration, OTP verification, login, and secure logout
- ✅ **Profile Management**: User profiles with photo upload and account settings
- ✅ **Thermal Image Storage**: Cloudinary integration for baseline and inspection images
- ✅ **Map Integration**: Google Maps for transformer locations and directions
- ✅ **AI Anomaly Detection**: YOLOv11-based fault detection with image comparison
- ✅ **Search & Filtering**: Efficient data retrieval and filtering mechanisms
- ✅ **Responsive UI**: Modern React interface with sliding panel navigation
- ✅ **Email Verification**: OTP-based email verification system
- ✅ **Security Features**: BCrypt hashing, session management, 401 error handling

## 🔐 Security Best Practices

### Implemented Security Measures
- **Password Hashing**: BCrypt with salt for secure password storage
- **Email Verification**: OTP-based account activation
- **Session Management**: HTTP Basic Authentication with secure sessions
- **CORS Configuration**: Properly configured cross-origin resource sharing
- **SQL Injection Prevention**: JPA/Hibernate parameterized queries
- **Input Validation**: Server-side validation for user inputs

## 📄 License

This project is for **academic and demonstration purposes**.

## 👥 Authors

- **210325M** - Kuruppu M.P.
- **210349N** - Madhushan I.D.
- **210371A** - Manatunge J.M.
- **210463H** - Perera L.C.S.

---

*For detailed setup instructions, API documentation, or contribution guidelines, please refer to the respective module directories or contact the development team.*