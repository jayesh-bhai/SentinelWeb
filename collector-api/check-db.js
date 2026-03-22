import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./sentinelweb.db', sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error(err.message);
  }
});

db.all('SELECT * FROM alerts ORDER BY timestamp DESC LIMIT 10;', [], (err, rows) => {
  if (err) {
    throw err;
  }
  console.log("=== RECENT ALERTS ===");
  rows.forEach((row) => {
    console.log(`[${row.severity}] ${row.threat_type} | Session: ${row.session_id}`);
    console.log(`Explanation: ${row.explanation}`);
    console.log(`ML Note: ${row.explanation.includes('ML') ? 'YES' : 'NO'}`);
    console.log('---');
  });
});

db.close();
