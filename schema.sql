CREATE TABLE color_snapshots (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  client_ip TEXT NOT NULL,
  colors TEXT NOT NULL,
  positions TEXT NOT NULL,
  device_type TEXT NOT NULL,
  created_at TEXT NOT NULL,
  user_agent TEXT,
  referer TEXT
);

CREATE INDEX idx_user_id ON color_snapshots(user_id);
CREATE INDEX idx_client_ip ON color_snapshots(client_ip);
CREATE INDEX idx_created_at ON color_snapshots(created_at);
CREATE INDEX idx_client_ip_created_at ON color_snapshots(client_ip, created_at);