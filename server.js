const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- Database ----------
const db = new Database(path.join(__dirname, 'inventory.db'));
db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General',
    quantity INTEGER NOT NULL DEFAULT 0,
    price REAL NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

if (db.prepare('SELECT COUNT(*) AS c FROM items').get().c === 0) {
  const seed = db.prepare('INSERT INTO items (name, category, quantity, price) VALUES (?, ?, ?, ?)');
  [
    ['Laptop', 'Electronics', 12, 750],
    ['Wireless Mouse', 'Accessories', 40, 15.5],
    ['Notebook', 'Stationery', 5, 2.25],
    ['USB Flash Drive', 'Accessories', 25, 8],
  ].forEach((r) => seed.run(...r));
}

// ---------- Middleware ----------
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function validate(body) {
  const name = String(body.name || '').trim();
  const category = String(body.category || 'General').trim() || 'General';
  const quantity = Number(body.quantity);
  const price = Number(body.price);
  if (!name) return { error: 'Name is required.' };
  if (!Number.isInteger(quantity) || quantity < 0) return { error: 'Quantity must be a whole number (0 or more).' };
  if (!Number.isFinite(price) || price < 0) return { error: 'Price must be 0 or more.' };
  return { name, category, quantity, price };
}

// ---------- API routes (CRUD) ----------
// READ all (with optional search)
app.get('/api/items', (req, res) => {
  const q = `%${(req.query.q || '').trim()}%`;
  const rows = db
    .prepare('SELECT * FROM items WHERE name LIKE ? OR category LIKE ? ORDER BY id DESC')
    .all(q, q);
  res.json(rows);
});

// READ one
app.get('/api/items/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Item not found.' });
  res.json(row);
});

// CREATE
app.post('/api/items', (req, res) => {
  const v = validate(req.body);
  if (v.error) return res.status(400).json({ error: v.error });
  const info = db
    .prepare('INSERT INTO items (name, category, quantity, price) VALUES (?, ?, ?, ?)')
    .run(v.name, v.category, v.quantity, v.price);
  res.status(201).json(db.prepare('SELECT * FROM items WHERE id = ?').get(info.lastInsertRowid));
});

// UPDATE
app.put('/api/items/:id', (req, res) => {
  const v = validate(req.body);
  if (v.error) return res.status(400).json({ error: v.error });
  const info = db
    .prepare('UPDATE items SET name = ?, category = ?, quantity = ?, price = ? WHERE id = ?')
    .run(v.name, v.category, v.quantity, v.price, req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Item not found.' });
  res.json(db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id));
});

// DELETE
app.delete('/api/items/:id', (req, res) => {
  const info = db.prepare('DELETE FROM items WHERE id = ?').run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Item not found.' });
  res.json({ success: true });
});

// ---------- Dashboard stats ----------
app.get('/api/stats', (req, res) => {
  const s = db
    .prepare(
      `SELECT COUNT(*) AS totalItems,
              COALESCE(SUM(quantity), 0) AS totalQuantity,
              COALESCE(SUM(quantity * price), 0) AS totalValue,
              COALESCE(SUM(CASE WHEN quantity <= 5 THEN 1 ELSE 0 END), 0) AS lowStock
       FROM items`
    )
    .get();
  const byCategory = db
    .prepare('SELECT category, COUNT(*) AS count FROM items GROUP BY category ORDER BY count DESC')
    .all();
  res.json({ ...s, byCategory });
});

app.listen(PORT, () => console.log(`Dashboard running at http://localhost:${PORT}`));
