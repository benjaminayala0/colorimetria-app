# Ficha Técnica Digital - Proyecto Colorimetría

Application for managing clients, technical sheets, and appointments for hair salons. Built with React Native (Expo) and Node.js (Express/PostgreSQL).

## Project Structure

- `frontend/`: React Native (Expo) application
- `backend/`: Node.js Express server
- `brain/`: Project documentation and artifacts

## Prerequisites

- Node.js (v18+)
- PostgreSQL (v14+)
- Expo CLI (`npm install -g expo-cli`)

## Getting Started

### 1. Database Setup

Ensure PostgreSQL is running and create a database named `colorimetria_db`.

### 2. Backend Setup

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure Environment Variables:
    - Copy `.env.example` to `.env`:
        ```bash
        cp .env.example .env
        ```
    - Update `.env` with your DB credentials and JWT secrets.

4.  Run Migrations (if applicable):
    ```bash
    npx sequelize-cli db:migrate
    ```

5.  Run Tests:
    ```bash
    npm test
    ```

6.  Start Development Server:
    ```bash
    npm run dev
    ```

### 3. Frontend Setup

1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start Expo:
    ```bash
    npm start
    ```

## Features

- **Authentication:** JWT-based auth with Refresh Tokens.
- **Biometrics:** FaceID/TouchID support for app lock.
- **Rate Limiting:** Protection against brute-force attacks on login.
- **Client Management:** CRUD for clients and technical sheets.

## Security

- Passwords hashed with `bcryptjs`.
- Security headers with `helmet`.
- Rate limiting on API endpoints.
- Secure storage for tokens on mobile device.
