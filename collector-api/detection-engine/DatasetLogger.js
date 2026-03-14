import fs from 'fs';

export class DatasetLogger {
  constructor(filePath) {
    this.filePath = filePath;
    this.writeStream = fs.createWriteStream(filePath, { flags: 'w' });
    this.writeHeaders();
  }

  writeHeaders() {
    const headers = [
      'failed_login_count',
      'failed_login_velocity',
      'success_failure_ratio',
      'request_count',
      'rate_violation_count',
      'interaction_rate',
      'rule_hit_count',
      'high_severity_flag',
      'session_duration',
      'unique_endpoint_count',
      'payload_match_count',
      'special_character_ratio',
      'is_attack'
    ];
    this.writeStream.write(headers.join(',') + '\n');
  }

  logFeatures(features, isAttack = 0) {
    if (!Array.isArray(features) || features.length !== 12) {
      throw new Error('Invalid features array length. Expected 12.');
    }
    const row = [...features, isAttack];
    this.writeStream.write(row.join(',') + '\n');
  }

  close() {
    return new Promise((resolve) => {
      this.writeStream.end(resolve);
    });
  }
}
