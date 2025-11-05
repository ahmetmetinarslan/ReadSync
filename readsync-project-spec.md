# 📚 ReadSync – Full-Stack Reading Tracker Application

> **Instruction for Codex / AI Developer:**  
> Build this project from scratch according to the detailed technical requirements below.  
> The project name is **ReadSync** — a professional, full-stack reading tracker web application where users can create accounts, log in, and manage their personal reading lists with start and end dates.

---

## 1. Project Overview

**ReadSync** is a dynamic, full-stack web application that helps users track their reading progress.  
Each user can:

- Create an account and securely log in.  
- Add books with metadata (title, author, total pages, etc.).  
- Mark reading status (`Reading`, `Finished`, or `Planned`).  
- Record **start** and **end** dates for each book.  
- View, edit, or delete books in their private library.  

All user data should be securely stored in a database and accessible only after login.

---

## 2. Technology Stack

| Layer | Technology | Description |
|-------|-------------|-------------|
| **Frontend** | HTML5, CSS3, JavaScript (Vanilla) | Simple, responsive interface; communicates with backend via REST API |
| **Backend** | Node.js + Express.js | REST API handling authentication and book management |
| **Database** | SQLite (development) / PostgreSQL (production) | Stores user and book data |
| **Authentication** | JSON Web Tokens (JWT) + bcrypt | Secure login and route protection |
| **API** | RESTful API endpoints under `/api` namespace | |
| **Environment** | Local development and easy deployment to Render / Railway / Vercel | |

---

## 3. Core Features

### 3.1 User Authentication

- **Sign Up**
  - Endpoint: `POST /api/auth/register`
  - Required fields: `email`, `password`, `name`
  - Passwords are hashed with bcrypt before saving.
  - Duplicate email check required.

- **Login**
  - Endpoint: `POST /api/auth/login`
  - Validates credentials.
  - Returns a signed JWT token valid for 24 hours.
  - Response includes `token` and `user` object.

- **Protected Routes**
  - All `/api/books` routes require a valid JWT.
  - Token is passed in `Authorization: Bearer <token>` header.

---

### 3.2 Book Management

Each book belongs to a specific user (linked via `user_id`).

#### Endpoints

| Action | Method | Route | Description |
|--------|--------|--------|-------------|
| Get all books | GET | `/api/books` | Returns all books for logged-in user |
| Get one book | GET | `/api/books/:id` | Returns book by ID (if belongs to user) |
| Add new book | POST | `/api/books` | Adds a book with title, author, etc. |
| Update a book | PUT | `/api/books/:id` | Updates book fields like status or dates |
| Delete a book | DELETE | `/api/books/:id` | Removes book from user’s list |

#### Book Object Fields

| Field | Type | Description |
|--------|------|-------------|
| `id` | integer | Primary key |
| `user_id` | integer | Owner of the book |
| `title` | string | Book title |
| `author` | string | Book author |
| `pages` | integer | Optional page count |
| `status` | string | `"reading"`, `"finished"`, or `"planned"` |
| `start_date` | date | When the user started reading |
| `end_date` | date | When the user finished |
| `created_at` | timestamp | Record creation date |
| `updated_at` | timestamp | Last update time |

---

## 4. Database Schema

**users**  
| id | name | email | password_hash | created_at |

**books**  
| id | user_id | title | author | pages | status | start_date | end_date | created_at | updated_at |

### Relationships
- `books.user_id` → foreign key referencing `users.id`
- One user can have many books.

---

## 5. API Security

- Passwords must never be stored in plain text.
- Use bcrypt with at least 10 salt rounds.
- JWT secret should be stored in `.env` file (`JWT_SECRET`).
- Use middleware to verify tokens and attach user info to `req.user`.
- Protected routes must reject unauthorized requests with HTTP 401.

---

## 6. Frontend Requirements

The frontend should be a **clean, modern single-page interface** that interacts with the backend API via `fetch()`.

### Pages

1. **Home Page (`index.html`)**
   - Welcome message
   - Links to **Login** and **Sign Up**

2. **Login Page**
   - Form: email, password
   - Sends `POST /api/auth/login`
   - On success, saves token in `localStorage` and redirects to dashboard.

3. **Sign Up Page**
   - Form: name, email, password
   - Sends `POST /api/auth/register`
   - On success, redirects to login page.

4. **Dashboard (Main App)**
   - Displays user’s book list fetched from `/api/books`.
   - Add-book form with fields:
     - Title (required)
     - Author (required)
     - Pages (optional)
     - Start Date
     - End Date
     - Status (`select` with options: Planned / Reading / Finished)
   - Each book displayed in a card with:
     - Title + Author
     - Status label
     - Dates
     - Edit / Delete buttons
   - Filtering and sorting (optional).

5. **Logout**
   - Clears token and redirects to home page.

---

## 7. Frontend File Structure

```
/frontend
│
├── index.html
├── login.html
├── register.html
├── dashboard.html
├── css/
│   └── style.css
└── js/
    ├── auth.js
    ├── books.js
    ├── api.js
    └── utils.js
```

---

## 8. Backend File Structure

```
/backend
│
├── server.js
├── package.json
├── .env
├── db/
│   ├── database.sqlite
│   └── migrations.sql
├── routes/
│   ├── auth.js
│   └── books.js
├── controllers/
│   ├── authController.js
│   └── bookController.js
├── middleware/
│   └── authMiddleware.js
└── models/
    ├── User.js
    └── Book.js
```

---

## 9. Example API Flow

1. User registers → `POST /api/auth/register`
2. User logs in → `POST /api/auth/login`
   - Receives token
3. Frontend stores token in `localStorage`
4. User opens dashboard:
   - Fetches `/api/books` with token
5. User adds new book → `POST /api/books`
6. User updates or deletes as needed

---

## 10. Visual and UX Guidelines

- Minimalist design (white background, card layout).
- Responsive for desktop and mobile.
- Use consistent button colors:
  - Blue for primary actions
  - Gray for secondary
  - Red for delete
- Use subtle shadows and rounded corners (8–12px).
- Use clear typography, e.g. `system-ui` or `"Segoe UI"`.

---

## 11. Environment Variables (`.env`)

Example:

```
PORT=5000
JWT_SECRET=your_super_secret_key
DATABASE_URL=./db/database.sqlite
```

---

## 12. Future Enhancements (Optional)

- Password reset via email
- Book cover uploads (using Cloudinary or Supabase storage)
- Reading statistics / charts
- Social features (share progress, follow users)
- Switch database to PostgreSQL for production

---

## 13. Direct Instruction for Codex

> **Codex, please generate the entire ReadSync project:**

1. **Backend (Node.js + Express):**
   - Full REST API with authentication (register/login) and CRUD for books.
   - Use SQLite via `better-sqlite3` or `sequelize`.
   - Implement token-based auth middleware.

2. **Frontend:**
   - Static HTML/CSS/JS pages that consume the API.
   - Handle login/register flows, token storage, and API requests.
   - Dynamic dashboard for managing books.

3. **Integration:**
   - Ensure CORS is enabled for local testing.
   - Provide `npm start` script to run both backend and frontend.
   - Include clear comments for setup steps.

---

**Goal:**  
Produce a working full-stack web application named **ReadSync**, allowing user registration, authentication, and personalized book tracking with reading dates, all stored in a secure backend.
