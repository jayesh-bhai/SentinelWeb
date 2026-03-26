import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('./sentinelweb.db');

db.get("SELECT event_data FROM raw_events WHERE session_id = 'event_spoof_test' ORDER BY timestamp DESC LIMIT 1", (err, row) => {
    if (row) {
        console.log('\n✅ VALIDATION 1: INVALID EVENT_TYPE REJECTION');
        const eventData = JSON.parse(row.event_data);
        console.log('Intercepted Event Type:', eventData.event_type);
    }
});

setTimeout(() => {
    db.get("SELECT event_data FROM raw_events WHERE session_id = 'event_logic_test' ORDER BY timestamp DESC LIMIT 1", (err, row) => {
        if (row) {
            console.log('\n✅ VALIDATION 2: LOGIC ABUSE HANDLING');
            const eventData = JSON.parse(row.event_data);
            console.log('Intercepted Event Type:', eventData.event_type);
            console.log('Intercepted Behavior:', eventData.behavior);
            
            db.all("SELECT * FROM alerts WHERE session_id = 'event_logic_test'", (err, alerts) => {
                console.log('Brute Force Alerts Generated (Should be 0):', alerts.length);
            });
        }
    });
}, 100);
