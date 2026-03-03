# SWM PRO v2.0 - Solid Waste Management System

A full-stack spatial workforce management system with geofencing, GPS tracking, QR code scanning, and admin controls. Built with Next.js 14, PostGIS, Prisma, Twilio OTP, and Leaflet.js.

## 🎯 Features

### Core Functionality
- **Auto-Ward Engine**: Admin selects a village polygon and PostGIS ST_Subdivide automatically splits it into 10 equal spatial wards
- **Module 3 (Drainage)**: ST_Buffer (5m) around drainage line with 90% spatial overlap detection for auto-completion
- **Module 4 (Depot)**: 50m geofence with 5-minute dwell time detection to increment TripCount
- **Twilio OTP Authentication**: 4-digit PIN login for workers and admins
- **QR Code Scanner**: GPS-locked QR scanning with mock location detection
- **GPS Tracking**: Real-time GPS trail tracking with accuracy validation
- **Glassmorphism UI**: Pure white background, 20px rounded cards, backdrop-blur-md, bold blue icons
- **Leaflet.js Maps**: OpenStreetMap integration (no Google Maps API required)

### Security
- Mock location detection (blocks scan if mocked or accuracy >100m)
- Session protection middleware
- Role-based access control (ADMIN, WORKER)
- GPS accuracy validation
- Rate limiting

## 🛠️ Tech Stack

- **Frontend**: React 19, Tailwind CSS 4, Lucide React icons
- **Backend**: Express.js, tRPC 11
- **Database**: PostgreSQL with PostGIS extension (Neon.tech)
- **ORM**: Prisma 6
- **Maps**: Leaflet.js with OpenStreetMap
- **QR Scanning**: html5-qrcode
- **SMS**: Twilio API
- **Authentication**: Manus OAuth + OTP

## 📋 Prerequisites

1. **PostgreSQL Database** (Neon.tech with PostGIS enabled)
   - Create a new project on Neon.tech
   - Enable PostGIS extension
   - Copy connection string

2. **Twilio Account**
   - Account SID
   - Auth Token
   - Phone number for SMS

3. **Node.js** (v18+)
4. **pnpm** package manager

## 🚀 Installation & Setup

### 1. Clone and Install Dependencies

```bash
cd swm-pro-v2
pnpm install
```

### 2. Configure Environment Variables

Create a `.env.local` file with:

```env
# Database (from Neon.tech)
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# Twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Manus OAuth (auto-injected)
VITE_APP_ID=your_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://login.manus.im
JWT_SECRET=your_jwt_secret
```

### 3. Setup Database

```bash
# Generate Prisma client
pnpm exec prisma generate

# Push schema to database (creates tables)
pnpm exec prisma db push

# (Optional) Seed database
pnpm exec prisma db seed
```

### 4. Run Development Server

```bash
pnpm dev
```

Server runs on `http://localhost:3000`

## 📁 Project Structure

```
swm-pro-v2/
├── client/                    # React frontend
│   ├── src/
│   │   ├── pages/            # Page components
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── WorkerDashboard.tsx
│   │   │   ├── WorkerLogin.tsx
│   │   │   └── QRScanner.tsx
│   │   ├── components/       # Reusable components
│   │   │   └── LeafletMap.tsx
│   │   └── lib/
│   │       └── trpc.ts       # tRPC client
│   └── public/               # Static assets
├── server/                   # Backend
│   ├── api/                  # API routes
│   │   ├── auth/
│   │   │   └── otp.ts
│   │   ├── wards.ts
│   │   ├── worklogs.ts
│   │   ├── geofence.ts
│   │   └── config.ts
│   ├── middleware/           # Express middleware
│   │   └── auth.ts
│   ├── otp.ts               # Twilio OTP service
│   └── routers.ts           # tRPC router
├── lib/                      # Shared utilities
│   ├── postgis-utils.ts     # PostGIS spatial functions
│   └── security-utils.ts    # GPS validation & security
├── prisma/
│   └── schema.prisma        # Database schema
└── package.json
```

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE "User" (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255),
  mobile VARCHAR(20) UNIQUE,
  role VARCHAR(50) DEFAULT 'WORKER', -- ADMIN, WORKER
  pin VARCHAR(4),
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

### Wards Table
```sql
CREATE TABLE "Ward" (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ward_no INT UNIQUE,
  boundary GEOMETRY(Polygon, 4326),
  qr_data VARCHAR(255) UNIQUE,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

### WorkLogs Table
```sql
CREATE TABLE "WorkLog" (
  id INT PRIMARY KEY AUTO_INCREMENT,
  worker_id INT,
  module VARCHAR(50), -- DOOR_TO_DOOR, SWEEPING, DRAINAGE, DEPOT
  trail GEOMETRY(LineString, 4326),
  photo_url VARCHAR(255),
  status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, COMPLETED, AUTO_COMPLETED
  tripCount INT DEFAULT 0,
  timestamp TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (worker_id) REFERENCES "User"(id)
);
```

## 🔑 API Endpoints

### Authentication
- `POST /api/trpc/auth.otp.sendOtp` - Send OTP to phone
- `POST /api/trpc/auth.otp.verifyOtp` - Verify OTP and login

### Wards
- `POST /api/trpc/wards.createWardsFromPolygon` - Create 10 wards from polygon
- `GET /api/trpc/wards.getWards` - Get all wards
- `GET /api/trpc/wards.getWard` - Get specific ward

### Work Logs
- `POST /api/trpc/worklogs.createWorklog` - Create new worklog
- `POST /api/trpc/worklogs.updateWorklogStatus` - Update worklog status
- `POST /api/trpc/worklogs.checkDrainageCompletion` - Check drainage overlap
- `GET /api/trpc/worklogs.getWorkerWorklogs` - Get worker's logs
- `GET /api/trpc/worklogs.getAllWorklogs` - Get all logs (admin)

### Geofence
- `POST /api/trpc/geofence.logLocation` - Log worker location
- `GET /api/trpc/geofence.checkGeofence` - Check if in geofence
- `GET /api/trpc/geofence.getWorkersInGeofence` - Get workers in geofence

### Config
- `GET /api/trpc/config.getConfig` - Get configuration
- `POST /api/trpc/config.updateConfig` - Update configuration

## 🗺️ Spatial Operations

### Ward Subdivision
```typescript
// Admin creates 10 equal wards from polygon
const wards = await subdivideIntoWards(polygonWKT);
```

### Drainage Overlap Detection
```typescript
// Check if worker's trail overlaps >90% with drainage buffer
const hasOverlap = await checkDrainageOverlap(trailWKT, bufferWKT);
```

### Geofence Check
```typescript
// Check if worker is within 50m of depot
const inGeofence = await isPointInGeofence(pointWKT, centerWKT, 50);
```

## 🔒 Security Features

### Mock Location Detection
```typescript
// Blocks QR scan if:
// - GPS accuracy > 100m
// - Mock location detected
// - Coordinates invalid
```

### Session Protection
```typescript
// Middleware validates:
// - User authentication
// - Role-based access
// - GPS accuracy
// - Rate limiting
```

## 📱 Worker Flow

1. **Login**: Enter phone number → Receive OTP → Verify PIN
2. **QR Scan**: GPS lock → Scan ward QR code → Verify location
3. **Module Selection**: Choose work module (Door-to-Door, Sweeping, Drainage, Depot)
4. **GPS Tracking**: Real-time GPS trail recording
5. **Photo Capture**: Optional photo upload
6. **Completion**: Mark task as complete → Auto-complete if criteria met

## 👨‍💼 Admin Flow

1. **Login**: Manus OAuth authentication
2. **Ward Management**: Upload polygon → Auto-subdivide into 10 wards
3. **Worker Monitoring**: Real-time GPS tracking on map
4. **Work Log Review**: View completed tasks, photos, spatial validation
5. **Configuration**: Set photo requirements, geofence parameters

## 🧪 Testing

### Run All Tests
```bash
pnpm test
```

### Run Specific Test
```bash
pnpm test server/otp.test.ts
pnpm test server/security-utils.test.ts
pnpm test server/postgis-utils.test.ts
```

## 📦 Building for Production

### Build
```bash
pnpm build
```

### Start Production Server
```bash
pnpm start
```

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Environment Variables (Vercel)
Add in Vercel dashboard:
- `DATABASE_URL`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `JWT_SECRET`

### Neon.tech Database
1. Create project on Neon.tech
2. Enable PostGIS extension
3. Copy connection string to `DATABASE_URL`

## 📊 Performance Optimization

- **Database**: PostGIS spatial indexes on geometry columns
- **Frontend**: React lazy loading, code splitting
- **Maps**: Leaflet tile caching, marker clustering
- **API**: Request caching, rate limiting

## 🐛 Troubleshooting

### GPS Not Working
- Check device location permissions
- Ensure GPS accuracy < 100m
- Disable mock location (Android)

### QR Scanner Issues
- Grant camera permissions
- Ensure good lighting
- Keep QR code in frame

### Database Connection Error
- Verify `DATABASE_URL` format
- Check Neon.tech connection settings
- Ensure SSL mode enabled

### Twilio SMS Not Sending
- Verify Account SID and Auth Token
- Check phone number format (+1234567890)
- Ensure account has credits

## 📝 License

MIT

## 🤝 Support

For issues or questions, contact the development team.

---

**Version**: 2.0.0  
**Last Updated**: March 2026  
**Status**: Production Ready ✅
