# Full Stack Project Management System

This full-stack web application designed for organizing projects, managing tasks, tracking progress, and visualizing key performance metrics via an interactive dashboard.

---

## Technical Stack
- **Frontend**: React (Vite), React Router DOM, Lucide Icons, Modern Glassmorphism CSS Design Tokens.
- **Backend**: Node.js, Express.js (REST API Architecture).
- **Database**: MySQL (using `mysql2` connection pool & prepared statements with fallback to SQLite).
- **Security**: JWT Authentication, bcrypt password hashing, input validation, IP rate limiting (`express-rate-limit`), CORS security.

---

## Database Setup & MySQL Configuration

### 1. Database Credentials (`server/.env`)
```env
PORT=5000
JWT_SECRET=xxxxx
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=xxxxx
DB_NAME=project_management
NODE_ENV=development
```

### 2. Importing MySQL Schema


To import the schema into your MySQL server:
```bash
# In MySQL Workbench or CLI:
mysql -u root -proot < schema.sql
```

---

## Getting Started & Local Setup

### Prerequisites
- Node.js (v18+)
- MySQL Server (v8.0+ or MySQL Workbench running on port 3306)

### 1. Start Express Server
```bash
cd server
npm install
npm start
```
The backend API server will run on `http://localhost:5000` connected to MySQL `project_management` database.

### 2. Start React Application
```bash
cd client
npm install
npm run dev
```
The React frontend application will launch on `http://localhost:3000`.

```


## API Documentation
See detailed REST API specifications in API_DOCUMENTATION.md

---

## Security Features
1. **Password Hashing**: Passwords stored exclusively as `bcrypt` hashes (salt rounds = 10). Plain-text passwords are never stored.
2. **Authorization Scoping**: All database operations query against `WHERE user_id = req.user.id`, guaranteeing zero cross-tenant data access.
3. **SQL Injection Protection**: Prepared statements and parameterized queries via `mysql2` prevent raw user input injection.
4. **Rate Limiting**: Rate limits `/api/auth/*` endpoints to max 20 requests per 15 minutes per IP address.
