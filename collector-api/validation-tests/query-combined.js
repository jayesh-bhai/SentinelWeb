import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('./sentinelweb.db');

// Wait for the memory queue to flush to disk
setTimeout(() => {
    db.get("SELECT event_data FROM raw_events WHERE session_id LIKE 'combined_attack_%' ORDER BY timestamp DESC LIMIT 1", (err, row) => {
        if (err) {
            console.error('Error querying DB:', err);
        } else if (row) {
            console.log('\n✅ COMBINED ATTACK DB RESULT:');
            const eventData = JSON.parse(row.event_data);
            console.log('Intercepted Event IP (should not be 123.x.x.x):', eventData.ip_address);
            console.log('Intercepted Event Type (should be GENERIC_EVENT):', eventData.event_type);
        } else {
            console.log('No rows found for combined attack');
        }
    });

    db.get("SELECT COUNT(*) as count FROM raw_events WHERE session_id LIKE 'combined_attack_%'", (err, row) => {
        if (row) console.log(`Total events successfully logged to DB: ${row.count} / 15000 (Queue Drops Expected under burst)`);
    });
}, 2000);
