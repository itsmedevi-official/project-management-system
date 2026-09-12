# Project Management System API Documentation

## Authentication Endpoints

### 1. Register User
- **POST** `/api/auth/register`
- **Request Body**:
  ```json
  {
    "full_name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword123"
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "message": "User registered successfully.",
    "token": "<JWT_TOKEN>",
    "user": {
      "id": 1,
      "full_name": "John Doe",
      "email": "john@example.com"
    }
  }
  ```

### 2. User Login
- **POST** `/api/auth/login`
- **Request Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "securepassword123"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "message": "Login successful.",
    "token": "<JWT_TOKEN>",
    "user": {
      "id": 1,
      "full_name": "John Doe",
      "email": "john@example.com"
    }
  }
  ```

### 3. User Logout
- **POST** `/api/auth/logout`
- **Success Response (200 OK)**:
  ```json
  { "message": "Logout successful." }
  ```

---

## Projects Endpoints (Protected - Header: `Authorization: Bearer <TOKEN>`)

### 1. List Projects
- **GET** `/api/projects`
- **Query Parameters**:
  - `search`: Filter by project name (e.g. `/api/projects?search=Redesign`)
  - `status`: Filter by status (`Not Started`, `In Progress`, `Completed`)

### 2. Get Project Details
- **GET** `/api/projects/:id`

### 3. Create Project
- **POST** `/api/projects`
- **Request Body**:
  ```json
  {
    "project_name": "Website Redesign",
    "description": "Modernize company landing page",
    "status": "In Progress",
    "start_date": "2026-09-01",
    "end_date": "2026-10-01"
  }
  ```

### 4. Edit Project
- **PUT** `/api/projects/:id`

### 5. Delete Project
- **DELETE** `/api/projects/:id`

---

## Tasks Endpoints (Protected - Header: `Authorization: Bearer <TOKEN>`)

### 1. List Tasks
- **GET** `/api/tasks`
- **Query Parameters**:
  - `search`: Filter task name
  - `status`: `Pending` | `In Progress` | `Completed`
  - `priority`: `Low` | `Medium` | `High`
  - `project_id`: ID of target project

### 2. Get Task Details
- **GET** `/api/tasks/:id`

### 3. Create Task
- **POST** `/api/tasks`
- **Request Body**:
  ```json
  {
    "project_id": 1,
    "task_name": "Create wireframe mockups",
    "description": "Figma layout designs for home page",
    "priority": "High",
    "status": "Pending",
    "due_date": "2026-09-15"
  }
  ```

### 4. Edit Task
- **PUT** `/api/tasks/:id`

### 5. Delete Task
- **DELETE** `/api/tasks/:id`

---

## Dashboard Stats Endpoint (Protected)

### 1. Overview Statistics
- **GET** `/api/dashboard/stats`
- **Response Example**:
  ```json
  {
    "totalProjects": 5,
    "projectsInProgress": 2,
    "completedProjects": 2,
    "notStartedProjects": 1,
    "totalTasks": 12,
    "completedTasks": 8,
    "pendingTasks": 3,
    "inProgressTasks": 1
  }
  ```
