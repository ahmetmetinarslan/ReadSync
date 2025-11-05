# ReadSync

ReadSync is a full-stack reading tracker application that lets readers manage personal libraries with start and finish dates, status tracking, and secure authentication.

## Tech Stack

- **Backend:** Node.js, Express, better-sqlite3, JWT, bcrypt
- **Frontend:** HTML5, CSS, vanilla JavaScript
- **Database:** SQLite (file-based)

## Getting Started

1. Navigate to the backend folder and install dependencies:
   `ash
   cd backend
   npm install
   `
   > The environment used to generate this project did not have external network access, so dependencies are declared in package.json but not installed. Run 
pm install locally before starting the server.

2. Copy the environment file and adjust as needed:
   `ash
   cp .env.example .env
   `

3. Start the API server:
   `ash
   npm start
   `

4. Open http://localhost:5000 in your browser to use the frontend. The Express server serves the static files from the rontend/ directory.

## Project Structure

`
backend/
  controllers/
  db/
  middleware/
  models/
  routes/
frontend/
  css/
  js/
`

- ackend/server.js boots Express, wires routes, enables CORS, and serves the frontend.
- Authentication endpoints live under /api/auth; book CRUD endpoints use /api/books and require a valid JWT.
- The frontend stores the JWT in localStorage and redirects users appropriately based on session state.

## Scripts

- 
pm start – runs the API server.
- 
pm run dev – runs the API with 
odemon (requires 
odemon installed).

## Database

SQLite migrations run automatically when the server starts. The database file path defaults to db/database.sqlite, configurable through the DATABASE_URL environment variable.

## Testing & Further Work

- Add automated tests around controllers and models (e.g., using Jest + Supertest).
- Build status filters and sorting in the dashboard.
- Introduce password reset flows or third-party auth.

Enjoy tracking your reading journey with ReadSync!
