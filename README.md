# Inventory Dashboard

A dashboard application with full **CRUD** functionality.

- **Backend:** Express.js
- **Database:** SQLite (via `better-sqlite3`, file `inventory.db` is created automatically)
- **Frontend:** HTML, CSS, vanilla JavaScript

## Features
- Dashboard cards: total items, total quantity, total inventory value, low-stock count
- **Create**, **Read**, **Update**, **Delete** items
- Search by name or category
- Input validation on the server

## Run locally
Requires [Node.js](https://nodejs.org) 18+.

```bash
npm install
npm start
```
Open http://localhost:3000

## API
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/items?q= | List / search items |
| GET | /api/items/:id | Get one item |
| POST | /api/items | Create item |
| PUT | /api/items/:id | Update item |
| DELETE | /api/items/:id | Delete item |
| GET | /api/stats | Dashboard statistics |

## Project structure
```
server.js        Express server, SQLite setup, API routes
public/          Frontend (index.html, style.css, app.js)
```
