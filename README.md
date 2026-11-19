# DecodeLabs Project 3 — My Contact Book

A small student-level full-stack project built to practise database integration and CRUD operations.

## What it does
- Add a contact (Create)
- View saved contacts (Read)
- Edit a contact (Update)
- Delete a contact (Delete)
- Search contacts by name, email, phone or category
- Show simple contact counts
- Keep records in a local SQLite database file

## Tools used
- HTML, CSS and JavaScript
- Node.js built-in HTTP server
- SQLite using Node.js built-in `node:sqlite`

## Requirements
- Node.js 22.5 or newer (Node.js 25 is suitable)
- npm (comes with Node.js)

No npm packages or separate SQLite installation are needed. The project uses Node.js built-in modules, and the database file is created automatically the first time the server starts.

## Run the project
1. Open this folder in VS Code.
2. Open the VS Code terminal in this folder.
3. Start the server:

   ```bash
   npm start
   ```

4. Open this address in your browser:

   http://localhost:3000

Keep the terminal open while using the website. Do not open `index.html` directly; open the localhost address so the frontend can talk to the backend API.

## Database design
The project uses one table named `contacts`:

| Column | Type | Rule |
|---|---|---|
| id | INTEGER | Primary key, auto increment |
| name | TEXT | Required |
| email | TEXT | Required, unique |
| phone | TEXT | Optional |
| category | TEXT | Personal, University, Work or Other |
| created_at | TEXT | Defaults to current timestamp |

## API routes
| Method | Route | Operation |
|---|---|---|
| GET | `/api/contacts` | Read all contacts |
| POST | `/api/contacts` | Create a contact |
| PUT | `/api/contacts/:id` | Update a contact |
| DELETE | `/api/contacts/:id` | Delete a contact |
| GET | `/api/health` | Check that the API is running |

All SQL statements that use user input are parameterized. Email uniqueness is also enforced by the database.

## Important
The database is stored at `data/contacts.db`. Keep this file if you want to keep your saved contacts. Do not delete it before submitting if you want your test data to remain.
