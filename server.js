const express = require('express');
const fs      = require('fs');
const path    = require('path');
const { v4: uuidv4 } = require('uuid');

const app  = express();
const PORT = process.env.PORT || 3000;

// Data file location
const DATA_DIR  = fs.existsSync('/data') ? '/data' : path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'appointments.json');

if (!fs.existsSync(DATA_DIR))  fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf8');

function readAll() {
  try   { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return []; }
}
function writeAll(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// GET all appointments
app.get('/api/appointments', (req, res) => {
  res.json(readAll());
});

// POST create appointment
app.post('/api/appointments', (req, res) => {
  const body = req.body;
  if (!body.name || !body.date || !body.time)
    return res.status(400).json({ error: 'name, date, and time are required' });

  const all = readAll();
  if (all.find(a => a.date === body.date && a.time === body.time))
    return res.status(409).json({ error: 'That slot is already booked' });

  const appt = {
    id:         uuidv4(),
    name:       body.name,
    purpose:    body.purpose    || '',
    comments:   body.comments   || '',
    mobile:     body.mobile     || '',
    city:       body.city       || '',
    dob:        body.dob        || '',
    tob:        body.tob        || '',
    birthplace: body.birthplace || '',
    date:       body.date,
    dateLabel:  body.dateLabel  || body.date,
    time:       body.time,
    isBackdated: !!body.isBackdated,
    bookedAt:   new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
  };
  all.push(appt);
  writeAll(all);
  res.status(201).json(appt);
});

// PATCH edit appointment
app.patch('/api/appointments/:id', (req, res) => {
  const all = readAll();
  const idx = all.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });

  const allowed = ['name','purpose','comments','mobile','city','dob','tob','birthplace'];
  const updates = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

  all[idx] = { ...all[idx], ...updates };
  writeAll(all);
  res.json(all[idx]);
});

// DELETE appointment
app.delete('/api/appointments/:id', (req, res) => {
  const all     = readAll();
  const updated = all.filter(a => a.id !== req.params.id);
  if (updated.length === all.length)
    return res.status(404).json({ error: 'Not found' });
  writeAll(updated);
  res.status(204).send();
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Appointment Scheduler running on port ${PORT}`);
  console.log(`Data: ${DATA_FILE}`);
});
