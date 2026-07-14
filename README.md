# SecureShield Boilerplate

SecureShield is a production-ready **MERN stack (MongoDB, Express, React, Node.js)** boilerplate specifically engineered to provide a rock-solid foundation for applications that require **highly secure file uploading and processing**.

It goes beyond basic validation by implementing a custom **Security Engine** that actively analyzes uploaded files for malicious intent, making it the perfect starting point for document management systems, image hosting platforms, or any SaaS that accepts user files.

## 🚀 Features

### Core MERN Stack
- **React Client**: Premium glassmorphism UI built with Vite, React Router, and Zustand state management.
- **Node/Express API**: Robust backend architecture with custom error handling, Winston logging, and JWT authentication (via Passport.js).
- **MongoDB**: Mongoose models for Users and FileRecords.
- **RBAC**: Role-Based Access Control distinguishing between standard `user` and `admin` roles.

### 🛡️ Security Engine
SecureShield implements a multi-layered defense system:
1. **Size Limits & Rate Limiting**: Enforces strict payload limits (5MB) via Multer and rate limits file upload endpoints (100 per 15 min) to prevent DoS attacks.
2. **MIME Spoofing Detection**: Uses `file-type` to read the exact binary "magic bytes" of a file. If an attacker uploads a `virus.exe` renamed to `image.png`, the engine detects the discrepancy and rejects it.
3. **Deep Archive Inspection**: Securely parses `.zip` headers without extracting them (using `adm-zip`) to look for hidden executables (`.exe`, `.sh`, `.bat`) inside.
4. **Zip Bomb Protection**: Calculates the internal uncompressed size and file count of archives. If an archive expands by 100x its size or contains over 10,000 files, it is instantly rejected to protect your server's RAM and Disk.
5. **Asynchronous Processing**: Uploads are accepted instantly to provide a fast UX, while the security engine crunches the file in the background and updates the status (`PENDING` -> `SAFE` or `REJECTED`).

### DevOps Ready
- **Multi-Stage Docker**: A unified root `Dockerfile` that builds the React frontend and statically serves it from the Node backend, deployed alongside MongoDB in `docker-compose.yml`.
- **CI/CD Pipeline**: Pre-configured GitHub Actions (`.github/workflows/ci.yml`) to automatically run Jest integration tests and linters on every push.

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)
- Docker (optional, for containerized deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/SecureShield.git
   cd SecureShield
   ```

2. **Setup the Backend**
   ```bash
   cd server
   npm install
   # Copy the environment variables
   cp .env.example .env 
   # Start the backend API on port 3000
   npm run dev
   ```

3. **Setup the Frontend**
   ```bash
   cd ../client
   npm install
   # Start the Vite development server on port 5173
   npm run dev
   ```

### 🐳 Docker Deployment

To launch the entire application (Frontend, Backend, and MongoDB) in production mode using Docker:

```bash
docker-compose up --build -d
```
The application will be available at `http://localhost:3000`.

## 🧪 Testing the Security Engine

SecureShield comes with a built-in Malware Test Kit script to demonstrate the engine.
While the backend is running, execute:
```bash
cd server
node scripts/seed.js
```
This script will register an admin user, generate mock malicious files (a spoofed image, a zip bomb, an archive with a hidden executable, and an oversized file), and upload them via the API. Log in to the dashboard to watch the engine flag them!


