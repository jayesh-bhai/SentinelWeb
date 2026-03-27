/**
 * Persistence Module
 * Purpose: Handle database storage for raw events and alerts
 * Responsibilities:
 * - raw_events storage
 * - alerts storage
 */

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class Persistence {
  constructor() {
    this.db = null;
    this.eventQueue = [];
    this.alertQueue = [];
    this.flushInterval = null;
    this.MAX_QUEUE_SIZE = 10000;
    this.isFlushing = false;
  }

  /**
   * Initializes the database connection and creates required tables
   */
  async initialize() {
    // Open SQLite database
    this.db = await open({
      filename: path.join(__dirname, '..', 'sentinelweb.db'),
      driver: sqlite3.Database
    });

    // Create required tables
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS raw_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT,
        server_id TEXT,
        event_type TEXT,
        event_data TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT,
        server_id TEXT,
        threat_type TEXT,
        severity TEXT,
        confidence TEXT,
        explanation TEXT,
        rule_hits TEXT,
        detection_logic TEXT,
        offending_payload TEXT,
        matched_location TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp);
      CREATE INDEX IF NOT EXISTS idx_alerts_session ON alerts(session_id);
      CREATE INDEX IF NOT EXISTS idx_events_session ON raw_events(session_id);
    `);

    console.log('💾 Detection Engine database tables created');
    
    // Start asynchronous database flushing every 500ms
    this.flushInterval = setInterval(() => this.flushQueues(), 500);
  }

  /**
   * Stores a raw event in the database
   * @param {Object} rawEvent - Raw event to store
   */
  async storeRawEvent(rawEvent) {
    // Instantly push the raw event into memory RAM queue preventing NodeJS block
    if (this.eventQueue.length < this.MAX_QUEUE_SIZE) {
      this.eventQueue.push(rawEvent);
    } else {
      console.warn("⚠️ Event Queue overflow, dropping incoming event to prevent Memory Exhaustion");
    }
  }

  /**
   * Stores an alert in the database
   * @param {Object} alertData - Alert data to store
   */
  async storeAlert(alertData) {
    // Instantly push the alert into memory RAM queue
    if (this.alertQueue.length < this.MAX_QUEUE_SIZE) {
      this.alertQueue.push(alertData);
    } else {
      console.warn("⚠️ Alert Queue overflow, dropping incoming alert to prevent Memory Exhaustion");
    }

    // Log to console for demo purposes
    console.log(`🚨 THREAT DETECTED [${alertData.severity}]`);
    console.log(`   Type: ${alertData.threat_type}`);
    console.log(`   Confidence: ${alertData.confidence}`);
    console.log(`   Explanation: ${alertData.explanation}`);
    console.log(`   Session: ${alertData.session_id}`);
    console.log(`   Matched Location: ${alertData.matched_location}`);
    console.log(`   Rules Triggered: ${JSON.parse(alertData.rule_hits).length}`);
  }

  /**
   * Background process to dump Memory Queues safely to Disc
   */
  async flushQueues() {
    if (!this.db || this.isFlushing) return;
    
    this.isFlushing = true;
    try {
      // 1. Snapshot Event Queue
      const eventsToProcess = [...this.eventQueue];
      this.eventQueue = [];
      
      if (eventsToProcess.length > 0) {
      try {
        await this.db.run('BEGIN TRANSACTION');
        const stmt = await this.db.prepare(
          `INSERT INTO raw_events (session_id, server_id, event_type, event_data) 
           VALUES (?, ?, ?, ?)`
        );
        for (const rawEvent of eventsToProcess) {
          await stmt.run([
            rawEvent.sessionId || rawEvent.session_id || 'unknown',
            rawEvent.serverId || rawEvent.server_id || 'unknown',
            rawEvent.event_type || 'unknown',
            JSON.stringify(rawEvent)
          ]);
        }
        await stmt.finalize();
        await this.db.run('COMMIT');
      } catch (err) {
        try { await this.db.run('ROLLBACK'); } catch(e) {}
        console.error('❌ Error batch inserting raw events:', err);
        console.warn('⚠️ Dropping event batch to prevent Infinite Retries tracking OOM memory leaks.');
      }
    }
    
    // 2. Snapshot Alert Queue
    const alertsToProcess = [...this.alertQueue];
    this.alertQueue = [];
    
    if (alertsToProcess.length > 0) {
      try {
        await this.db.run('BEGIN TRANSACTION');
        const stmt = await this.db.prepare(
          `INSERT INTO alerts (session_id, server_id, threat_type, severity, confidence, explanation, rule_hits, detection_logic, offending_payload, matched_location) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        );
        for (const alertData of alertsToProcess) {
          await stmt.run([
            alertData.session_id,
            alertData.server_id,
            alertData.threat_type,
            alertData.severity,
            alertData.confidence,
            alertData.explanation,
            alertData.rule_hits,
            JSON.stringify(alertData.detection_logic),
            alertData.offending_payload.substring(0, 100),
            alertData.matched_location
          ]);
        }
        await stmt.finalize();
        await this.db.run('COMMIT');
      } catch (err) {
        try { await this.db.run('ROLLBACK'); } catch(e) {}
        console.error('❌ Error batch inserting alerts:', err);
        console.warn('⚠️ Dropping alert batch to prevent Infinite Retries tracking OOM memory leaks.');
      }
    }
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * Retrieves recent alerts from the database
   * @param {Number} limit - Number of alerts to retrieve (default: 50)
   * @returns {Array} Array of alert objects
   */
  async getAlerts(limit = 50) {
    // Retrieve recent alerts from database
    const alerts = await this.db.all(
      `SELECT * FROM alerts ORDER BY timestamp DESC LIMIT ?`,
      [limit]
    );
    return alerts;
  }

  /**
   * Retrieves recent raw events from the database
   * @param {Number} limit - Number of events to retrieve (default: 50)
   * @returns {Array} Array of raw event objects
   */
  async getRawEvents(limit = 50) {
    // Retrieve recent raw events from database
    const events = await this.db.all(
      `SELECT * FROM raw_events ORDER BY timestamp DESC LIMIT ?`,
      [limit]
    );
    return events;
  }

  /**
   * Closes the database connection
   */
  async close() {
    if (this.flushInterval) clearInterval(this.flushInterval);
    await this.flushQueues();
    if (this.db) {
      await this.db.close();
    }
  }
}

export default Persistence;