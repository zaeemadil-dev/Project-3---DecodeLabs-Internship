const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const db = require('./database');

const PORT = process.env.PORT || 3000;
const publicFolder = path.join(__dirname, '..', 'public');
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const categories = ['Personal', 'University', 'Work', 'Other'];
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 100000) {
        reject(new Error('Request is too large.'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try { resolve(JSON.parse(body)); }
      catch { reject(new Error('Please send valid JSON data.')); }
    });
    req.on('error', reject);
  });
}

function cleanContact(body = {}) {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const category = typeof body.category === 'string' ? body.category : 'Personal';
  if (!name) return { error: 'Please enter a name.' };
  if (!emailPattern.test(email)) return { error: 'Please enter a valid email address.' };
  if (!categories.includes(category)) return { error: 'Please choose a valid category.' };
  return { values: { name, email, phone, category } };
}

function serveStatic(pathname, res) {
  const requested = pathname === '/' ? 'index.html' : decodeURIComponent(pathname.slice(1));
  const filePath = path.resolve(publicFolder, requested);
  if (!filePath.startsWith(publicFolder + path.sep)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  fs.readFile(filePath, (error, content) => {
    if (error) { res.writeHead(404); res.end('Page not found'); return; }
    res.writeHead(200, { 'Content-Type': contentTypes[path.extname(filePath)] || 'application/octet-stream' });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  if (req.method === 'GET' && pathname === '/api/health') {
    return sendJson(res, 200, { success: true, message: 'Contact Book API is working.' });
  }

  if (req.method === 'GET' && pathname === '/api/contacts') {
    const contacts = db.prepare('SELECT * FROM contacts ORDER BY id DESC').all();
    return sendJson(res, 200, { success: true, data: contacts });
  }

  if (req.method === 'POST' && pathname === '/api/contacts') {
    try {
      const checked = cleanContact(await readBody(req));
      if (checked.error) return sendJson(res, 400, { success: false, message: checked.error });
      const { name, email, phone, category } = checked.values;
      const result = db.prepare('INSERT INTO contacts (name, email, phone, category) VALUES (?, ?, ?, ?)').run(name, email, phone, category);
      const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(Number(result.lastInsertRowid));
      return sendJson(res, 201, { success: true, message: 'Contact saved successfully.', data: contact });
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || /UNIQUE constraint failed/i.test(error.message || '')) return sendJson(res, 409, { success: false, message: 'This email is already saved.' });
      return sendJson(res, 400, { success: false, message: error.message || 'Could not save the contact.' });
    }
  }

  const contactRoute = pathname.match(/^\/api\/contacts\/(\d+)$/);
  if (contactRoute && req.method === 'PUT') {
    const id = Number(contactRoute[1]);
    try {
      const checked = cleanContact(await readBody(req));
      if (checked.error) return sendJson(res, 400, { success: false, message: checked.error });
      const { name, email, phone, category } = checked.values;
      const result = db.prepare('UPDATE contacts SET name = ?, email = ?, phone = ?, category = ? WHERE id = ?').run(name, email, phone, category, id);
      if (!result.changes) return sendJson(res, 404, { success: false, message: 'Contact not found.' });
      const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(id);
      return sendJson(res, 200, { success: true, message: 'Contact updated successfully.', data: contact });
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || /UNIQUE constraint failed/i.test(error.message || '')) return sendJson(res, 409, { success: false, message: 'Another contact already uses this email.' });
      return sendJson(res, 400, { success: false, message: error.message || 'Could not update the contact.' });
    }
  }

  if (contactRoute && req.method === 'DELETE') {
    const result = db.prepare('DELETE FROM contacts WHERE id = ?').run(Number(contactRoute[1]));
    if (!result.changes) return sendJson(res, 404, { success: false, message: 'Contact not found.' });
    return sendJson(res, 200, { success: true, message: 'Contact deleted successfully.' });
  }

  if (pathname.startsWith('/api/')) return sendJson(res, 404, { success: false, message: 'API route not found.' });
  if (req.method === 'GET') return serveStatic(pathname, res);
  res.writeHead(405); res.end('Method not allowed');
});

server.listen(PORT, () => {
  console.log('----------------------------------------');
  console.log(' Student Contact Book is running');
  console.log(` Open: http://localhost:${PORT}`);
  console.log(' Database: data/contacts.db');
  console.log('----------------------------------------');
});

function shutDown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}
process.on('SIGINT', shutDown);
process.on('SIGTERM', shutDown);
