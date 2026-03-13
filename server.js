const express = require('express');
const path    = require('path');
const { v4: uuidv4 } = require('uuid');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Supabase client setup ─────────────────────────────────────────────────────
// DATABASE_URL is set as an environment variable in the Render dashboard
// Format: postgresql://postgres:[password]@[host]:5432/postgres
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },  // required for Supabase
});

// Create table if it doesn't exist (runs on every startup, safe to repeat)
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS appointments (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      purpose     TEXT,
      comments    TEXT,
      mobile      TEXT,
      city        TEXT,
      dob         TEXT,
      tob         TEXT,
      birthplace  TEXT,
      date        TEXT NOT NULL,
      date_label  TEXT,
      time        TEXT NOT NULL,
      is_backdated BOOLEAN DEFAULT FALSE,
      booked_at   TEXT
    )
  `);
  console.log('Database ready');
}

// ── Row → JS object ───────────────────────────────────────────────────────────
function rowToAppt(r) {
  return {
    id:          r.id,
    name:        r.name,
    purpose:     r.purpose     || '',
    comments:    r.comments    || '',
    mobile:      r.mobile      || '',
    city:        r.city        || '',
    dob:         r.dob         || '',
    tob:         r.tob         || '',
    birthplace:  r.birthplace  || '',
    date:        r.date,
    dateLabel:   r.date_label  || r.date,
    time:        r.time,
    isBackdated: r.is_backdated || false,
    bookedAt:    r.booked_at   || '',
  };
}

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ── GET /api/appointments ─────────────────────────────────────────────────────
app.get('/api/appointments', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM appointments ORDER BY date ASC, time ASC'
    );
    res.json(rows.map(rowToAppt));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Database error' });
  }
});

// ── POST /api/appointments ────────────────────────────────────────────────────
app.post('/api/appointments', async (req, res) => {
  const b = req.body;
  if (!b.name || !b.date || !b.time)
    return res.status(400).json({ error: 'name, date, and time are required' });

  // Check for double-booking
  const conflict = await pool.query(
    'SELECT id FROM appointments WHERE date=$1 AND time=$2',
    [b.date, b.time]
  );
  if (conflict.rows.length)
    return res.status(409).json({ error: 'That slot is already booked' });

  const appt = {
    id:          uuidv4(),
    name:        b.name,
    purpose:     b.purpose     || '',
    comments:    b.comments    || '',
    mobile:      b.mobile      || '',
    city:        b.city        || '',
    dob:         b.dob         || '',
    tob:         b.tob         || '',
    birthplace:  b.birthplace  || '',
    date:        b.date,
    dateLabel:   b.dateLabel   || b.date,
    time:        b.time,
    isBackdated: !!b.isBackdated,
    bookedAt:    new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
  };

  await pool.query(
    `INSERT INTO appointments
      (id, name, purpose, comments, mobile, city, dob, tob, birthplace,
       date, date_label, time, is_backdated, booked_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
    [appt.id, appt.name, appt.purpose, appt.comments, appt.mobile, appt.city,
     appt.dob, appt.tob, appt.birthplace, appt.date, appt.dateLabel,
     appt.time, appt.isBackdated, appt.bookedAt]
  );

  res.status(201).json(appt);
});

// ── PATCH /api/appointments/:id ───────────────────────────────────────────────
app.patch('/api/appointments/:id', async (req, res) => {
  const allowed = ['name','purpose','comments','mobile','city','dob','tob','birthplace'];
  const fields  = [];
  const values  = [];
  allowed.forEach(k => {
    if (req.body[k] !== undefined) {
      fields.push(`${k === 'birthplace' ? 'birthplace' : k}=$${fields.length + 1}`);
      values.push(req.body[k]);
    }
  });
  if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });

  values.push(req.params.id);
  const { rows } = await pool.query(
    `UPDATE appointments SET ${fields.join(',')} WHERE id=$${values.length} RETURNING *`,
    values
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(rowToAppt(rows[0]));
});

// ── DELETE /api/appointments/:id ──────────────────────────────────────────────
app.delete('/api/appointments/:id', async (req, res) => {
  const { rowCount } = await pool.query(
    'DELETE FROM appointments WHERE id=$1', [req.params.id]
  );
  if (!rowCount) return res.status(404).json({ error: 'Not found' });
  res.status(204).send();
});

// ── Fallback ──────────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ── Start ─────────────────────────────────────────────────────────────────────
initDB().then(() => {
  app.listen(PORT, () => console.log(`Appointment Scheduler on port ${PORT}`));
}).catch(e => {
  console.error('Failed to init database:', e.message);
  process.exit(1);
});
