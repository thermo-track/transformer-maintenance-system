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

## 🟢 Phase 3 Interactive Annotation & Feedback System

A comprehensive annotation system that allows users to interactively correct, validate, and improve AI-generated detections. This creates a feedback loop for continuous model improvement.

### Interactive Annotation Tools

The annotation editor provides intuitive tools for modifying AI detections and adding manual annotations:

#### Canvas-Based Annotation Interface
- **Konva-Powered Canvas**: High-performance canvas rendering with React-Konva for smooth interactions
- **Real-time Visual Feedback**: Live updates during bounding box manipulation
- **Responsive Zoom & Pan**: Navigate thermal images with ease during annotation

#### Bounding Box Manipulation
- **Resize Annotations**: Drag any corner or edge to resize bounding boxes
  - All 8 anchor points active (corners + edges)
  - Precise coordinate calculation during resize
  - Real-time dimension updates
- **Reposition Annotations**: Drag bounding boxes to new locations
  - Smooth dragging
  - Snap-to-grid option for precise placement

#### Add New Annotations
- **Draw Mode**: Enter drawing mode to create new bounding boxes
- **Click & Drag**: Draw rectangular regions around undetected anomalies
- **Classification Dialog**: Select fault type from dropdown after drawing
  - Full wire overload
  - Loose Joint - Faulty
  - Loose Joint - Potential
  - Point Overload - Faulty
  - Normal

#### Delete & Reject Annotations
- **Delete User Annotations**: Remove incorrectly added annotations
- **Reject AI Detections**: Mark AI detections as false positives
  - Requires comment/reason for rejection
  - Soft delete - retained for model training
- **Approve AI Detections**: Accept AI detections as correct
  - Single-click approval with checkmark icon
  - Approved status displayed with green badge

#### Edit Annotations
- **Inline Edit Panel**: Edit fault type classification without redrawing
- **Geometry + Classification**: Modify both bounding box and fault type
- **Version Control**: Superseded annotations marked as inactive, new version created

#### Annotation Metadata
All annotation actions automatically capture:
- **Action Type**: CREATED, EDITED, DELETED, APPROVED, REJECTED, COMMENTED
- **User Information**: Username and user ID
- **Timestamp**: Precise action timestamp
- **Comments**: Optional notes for each action
- **Before/After State**: Complete audit trail of changes
  - Previous bounding box coordinates (x, y, width, height)
  - Previous classification (fault type, confidence, class ID)
  - New bounding box coordinates
  - New classification details

#### Annotation Retrieval
- **Auto-Load on Page Visit**: Previously annotated images load existing annotations
- **Separate Views**: 
  - AI Detections: Original AI-generated anomalies
  - User Annotations: User-created annotations

### Feedback Integration for Model Improvement

Comprehensive feedback logging and export system for model retraining:

#### Feedback Log Maintenance
- **Complete Action History**: Every annotation action logged with full context
- **Enriched Metadata**: Each entry includes:
  - Original AI prediction
  - Final user-modified annotation
  - Transformer ID and location
  - Inspection timestamp
  - User who made the change
  - Action type and reason

#### Annotation History Page
**For All Users**:
- View complete annotation history across all inspections
- Statistics dashboard:
  - Total actions (created, edited, deleted, approved, rejected, commented)
  - Actions by inspection
  - Timeline visualization
- **Advanced Filtering**:
  - Filter by action type
  - Filter by date range (Today, Last 7/30/90 days, Custom range)
  - Filter by transformer ID
  - Filter by username
  - Search by inspection ID
- **Expand/Collapse Views**: Drill down into each inspection's actions
- **Before/After Comparison**: See what changed for each edit action

**For Admins Only**:
- Access to model retraining interface
- Trigger retraining with annotation feedback
- Monitor retraining status and progress

#### Export Functionality

- CSV Export
- Excel Export
- JSON Export

#### Model Training Integration
- **Ground Truth Annotations**: User corrections serve as ground truth
- **False Positive Tracking**: Rejected AI detections identified
- **Missing Detection Tracking**: User-added annotations show gaps in model
- **Continuous Improvement**: Feedback loop enables iterative model refinement


### User Roles & Access Control

#### Regular Users
- ✅ View and annotate their own inspections
- ✅ View annotation history (read-only)
- ✅ Export annotation data
- ❌ Cannot trigger model retraining

#### Admin Users
- ✅ All regular user capabilities
- ✅ Trigger model retraining with feedback data
- ✅ View retraining status and progress
- ✅ View all users' annotations
- ✅ Admin user approvals

## 🔵 Phase 4: Automated Maintenance Record Generation & Cloud Deployment

Phase 4 introduces automated maintenance record generation capabilities and full system containerization with cloud deployment.

### Automated Maintenance Record Form Generation

#### Digital Record Creation
- **Auto-Generated Forms**: Automatically generate maintenance record forms based on inspection data
- **Pre-Populated Fields**: Form fields auto-filled with transformer and inspection metadata
- **AI Detection Integration**: Detected anomalies and fault classifications automatically included in records

#### Editable Engineer Input Fields
- **Flexible Data Entry**: Engineers can edit and customize all form fields
- **Manual Observations**: Add custom notes, observations, and recommendations
- **Action Items**: Document corrective actions and follow-up requirements
- **Timestamp Tracking**: Automatic recording of form creation and modification times

#### Record Management
- **Save and Retrieve**: Complete CRUD operations for maintenance records
- **Historical Records**: Access and review all past maintenance documentation
- **Search and Filter**: Efficiently locate specific records by date, transformer, or inspector
- **Export Capabilities**: Generate PDF reports for offline storage and sharing

### Cloud Deployment & Containerization

#### Docker Containerization
- **Multi-Service Architecture**: Fully containerized application stack
  - Frontend (React/Vite)
  - Backend (Spring Boot)
  - PostgreSQL Database
  - AI Inference Service (FastAPI)
  - Model Fine-Tuning Service (FastAPI)
- **Docker Compose Orchestration**: Simplified multi-container deployment
- **Environment Configuration**: Container-specific environment variables
- **Volume Management**: Persistent data storage for database and model weights

#### Oracle Cloud Infrastructure Deployment
- **Production Instance**: Deployed on Oracle Cloud minimal instance
- **Public Access**: Available at **141.148.71.2**
- **Resource Optimization**: Configured for minimal instance specifications
- **Network Configuration**: Proper security group and firewall rules
- **Reverse Proxy**: Nginx configuration for efficient request routing

#### Deployment Features
- **Automated Scripts**: Build and push scripts for streamlined deployment
  - `build_and_push.py`: Automated Docker image building
  - `tag_and_push.py`: Image versioning and registry management
- **Health Monitoring**: Service health checks and uptime monitoring
- **Log Management**: Centralized logging for debugging and monitoring

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


### 4. Email OTP Verification Implementation

Complete implementation of email-based OTP (One-Time Password) verification for user registration.

Create Gmail App Password (see EMAIL_SETUP.md for detailed steps):
1. Enable 2-Step Verification in your Google Account
2. Go to App Passwords: https://myaccount.google.com/apppasswords
3. Generate password for "Mail" app
4. Copy the 16-character password

Edit tms-backend-application\.env file:
```
MAIL_USERNAME = "your-email@gmail.com"
MAIL_PASSWORD = "your-16-char-app-password"
```


### 5. Development

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

1. Install Python dependencies after activating virtual environment:
```bash
pip install -r tms-fault-detection-model/requirements.txt
```

2. Ensure YOLO weights file is present:
```bash
# Use the provided model or train your own
tms-fault-detection-model/weights/best.pt
```

3. Run inference for a baseline/maintenance pair # Runs on http://localhost:8001:
```bash
python tms-fault-detection-model/api/inference_api.py
```

**Model Fine-Tuning Pipeline (Python)**

1. Install Python dependencies after activating virtual environment:
```bash
pip install -r tms-model-finetune/requirements.txt
```

2. Run API server for fine-tuning (runs on http://localhost:8002):
```bash
python api/app.py
```

**Note:** The fine-tuning service requires the base YOLO weights at `tms-fault-detection-model/weights/best.pt`. Updated weights are saved to `tms-model-finetune/finetune_weight/best_finetune.pt`.

### 6. Docker Deployment

**Build and Run with Docker Compose**
```bash
# Build all services
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

**Individual Service Builds**
```bash
# Backend
cd tms-backend-application
docker build -t tms-backend .

# Frontend
cd tms-frontend-application
docker build -t tms-frontend .

# AI Inference Service
cd tms-fault-detection-model
docker build -t tms-inference .

# Fine-Tuning Service
cd tms-model-finetune
docker build -t tms-finetune .
```

**Automated Build Scripts**
```bash
# Build and push all images
python build_and_push.py

# Tag and push specific version
python tag_and_push.py
```

### 7. Access the Application

**Local Development:**
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080/api
- **AI Inference API**: http://localhost:8001
- **Fine-Tuning API**: http://localhost:8002

**Production (Oracle Cloud):**
- **Public IP**: http://141.148.71.2

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
- **React-Konva**: Canvas library for interactive annotations
- **Konva**: HTML5 2D canvas library for high-performance rendering
- **Material-UI (MUI)**: Component library for dialogs, forms, and UI elements
- **XLSX**: Excel file generation for data export
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
- **FastAPI**: RESTful API framework for Python services
- **OpenCV**: Image processing and computer vision
- **NumPy**: Numerical computations
- **scikit-image**: SSIM and image analysis
- **PyTorch**: Deep learning framework for model training

### Cloud & Storage
- **Cloudinary**: Cloud-based image storage and CDN
- **PostgreSQL**: Relational database for metadata storage
- **Oracle Cloud Infrastructure**: Cloud hosting platform

### DevOps & Deployment
- **Docker**: Container platform for application packaging
- **Docker Compose**: Multi-container orchestration
- **Nginx**: Reverse proxy and web server
- **Python Scripts**: Automated build and deployment workflows

### Build & Development Tools
- **Maven**: Backend build tool
- **npm/Node.js**: Frontend package management
- **Git**: Version control
- **VS Code/IntelliJ IDEA**: Recommended IDE



## 🚧 Current Limitations

### Security Control
- **Request Size Limits**: No constraints on file upload sizes beyond basic validation

### Annotation System
- ⚠️ **Concurrent Editing**: No locking mechanism - last edit wins if multiple users edit simultaneously
- ⚠️ **Undo/Redo**: Not yet implemented (manual reversal of actions required)

### Data & Analytics
- **Data Backup**: No automated backup strategy for database and images
- **Advanced Analytics**: Data visualization dashboard for inspection trends not yet available
- **Notification System**: Real-time alerts for critical anomalies not implemented

### Infrastructure & Deployment
- **IaC Scripts**: No Terraform or automated infrastructure provisioning
- **CI/CD Pipeline**: No automated testing and deployment pipeline
- **High Availability**: No load balancing or redundancy setup
- **SSL/TLS**: HTTPS not yet configured for production deployment

### User Experience
- **Mobile Optimization**: Layout not fully optimized for narrow devices or tablets
- **PDF Report Templates**: Limited customization options for maintenance record exports

## � Key Features Summary

### ✅ Completed Features

**Phase 1: Foundation**
- ✅ **Full CRUD Operations**: Transformers, inspections, images, and user accounts
- ✅ **Thermal Image Storage**: Cloudinary integration for baseline and inspection images
- ✅ **Map Integration**: Google Maps for transformer locations and directions
- ✅ **Search & Filtering**: Efficient data retrieval and filtering mechanisms
- ✅ **Responsive UI**: Modern React interface with sliding panel navigation

**Phase 2: AI Detection**
- ✅ **AI Anomaly Detection**: YOLOv11-based fault detection with image comparison
- ✅ **Multi-Class Fault Classification**: 5 fault types with confidence scores
- ✅ **Detection Fusion**: IoU-based matching of unsupervised and YOLO detections
- ✅ **Visual Overlays**: Color-coded bounding boxes with fault labels

**Phase 3: Interactive Annotations**
- ✅ **Interactive Canvas**: Konva-powered annotation editor with real-time feedback
- ✅ **Bounding Box Tools**: Resize, reposition, add, delete annotations
- ✅ **Annotation Actions**: Create, Edit, Delete, Approve, Reject, Comment
- ✅ **Automatic Persistence**: No manual save - all actions auto-logged
- ✅ **Complete Audit Trail**: Full before/after tracking with metadata
- ✅ **Annotation History**: Timeline view with filtering and search
- ✅ **Multi-Format Export**: CSV, Excel (multi-sheet), and JSON exports
- ✅ **Advanced Filtering**: Filter by action type, date range, user, transformer, inspection
- ✅ **Approved Status Tracking**: Visual indicators for approved AI detections
- ✅ **Role-Based Access**: Separate views for admins and regular users

**Phase 4: Maintenance Records & Deployment**
- ✅ **Auto-Generated Forms**: Digital maintenance record form generation from inspection data
- ✅ **Editable Engineer Fields**: Flexible input fields for engineer observations and notes
- ✅ **Record Persistence**: Save and retrieve completed maintenance records
- ✅ **Docker Containerization**: Full multi-service Docker deployment
- ✅ **Cloud Deployment**: Production deployment on Oracle Cloud Infrastructure
- ✅ **Public Access**: Live system accessible at 141.148.71.2
- ✅ **Automated Build Scripts**: Streamlined Docker image building and versioning

**User Management**
- ✅ **User Authentication**: Registration, OTP verification, login, and secure logout
- ✅ **Profile Management**: User profiles with photo upload and account settings
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
