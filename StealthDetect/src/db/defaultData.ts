export const seedAllTables = `
PRAGMA foreign_keys = ON;
BEGIN;

-- Users
INSERT OR IGNORE INTO UserProfile (user_id, locale, risk_mode, created_at)
VALUES ('user_1', 'en', 'normal', datetime('now'));

-- Auth credentials
INSERT OR IGNORE INTO AuthCredential (credential_id, main_pin_hash, duress_pin_hash, last_auth_at)
VALUES ('cred_1', '4321', '1234', datetime('now'));

-- Scan sessions
INSERT OR IGNORE INTO ScanSession (scan_id, user_id, started_at, ended_at, mode, status, app_version)
VALUES
  ('scan_1', 'user_1', datetime('now', '-1 hour'), datetime('now', '-55 minutes'), 'quick', 'completed', '1.0.0'),
  ('scan_2', 'user_1', datetime('now'), NULL, 'full', 'running', '1.0.0');

-- Reports
INSERT OR IGNORE INTO Report (report_id, scan_id, summary, severity, created_at)
VALUES ('report_1', 'scan_1', 'Baseline scan OK', 'low', datetime('now', '-55 minutes'));

-- IOC matches (findings)
INSERT OR IGNORE INTO IOCMatch (match_id, scan_id, type, value, detected_at, confidence)
VALUES ('match_1', 'scan_1', 'ip', '192.0.2.1', datetime('now', '-54 minutes'), 0.85);

-- Device state snapshots
INSERT OR IGNORE INTO DeviceStateSnapshot (snapshot_id, scan_id, battery_level, network_type, ip_address, raw_json, created_at)
VALUES ('snapshot_1', 'scan_1', 0.78, 'wifi', '192.0.2.10', json('{ "example": true }'), datetime('now', '-56 minutes'));

COMMIT;
`;