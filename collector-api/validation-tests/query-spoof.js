import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('./sentinelweb.db');
db.get("SELECT event_data FROM raw_events WHERE session_id = 'spoof_test' ORDER BY timestamp DESC LIMIT 1", (err, row) => {
    if (err) {
        console.error('Error querying DB:', err);
    } else if (row) {
        console.log('\n✅ DB SECURE IDENTITY RESULT:');
        const eventData = JSON.parse(row.event_data);
        console.log('Intercepted Event IP:', eventData.ip_address);
        console.log('Full Captured Payload:', eventData);
    } else {
        console.log('No rows found for spoof_test');
    }
});
