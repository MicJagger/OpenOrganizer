import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';

// test.db located in ..\AppData\Roaming\Electron
const dbPath = path.join(app.getPath('userData'), 'test.db');
const db = new Database(dbPath);

// Create example table
db.exec(`
  CREATE TABLE IF NOT EXISTS example (
    id VARCHAR(32),
    value VARCHAR(32)
  )
`);

// Read entry from example table
export function read(key: string) {
  const query = db.prepare('SELECT value FROM example WHERE id = ?');
  const row = query.get(key) as { value: string } | undefined;

  if (!row) return 'Not found';
  return row.value;
}

// Create entry in example table
export function create(key: string, value: string) {
  db.prepare('INSERT INTO example (id, value) VALUES (?, ?)').run(key, value);
}

// Update entry in example table
export function update(key: string, value: string) {
  db.prepare('UPDATE example SET value = ? WHERE id = ?').run(value, key);
}

// Delete entry from example table
export function deleteEntry(key: string) {
  db.prepare('DELETE FROM example WHERE id = ?').run(key);
}
