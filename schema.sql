CREATE TABLE color_snapshots (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  client_ip TEXT NOT NULL,
  colors TEXT NOT NULL CHECK(length(colors) <= 2000),
  positions TEXT NOT NULL CHECK(length(positions) <= 5000),
  device_type TEXT NOT NULL CHECK(device_type IN ('mobile', 'tablet', 'desktop')),
  created_at TEXT NOT NULL,
  user_agent TEXT CHECK(length(user_agent) <= 50),
  referer TEXT CHECK(length(referer) <= 500)
);

CREATE INDEX idx_user_id ON color_snapshots(user_id);
CREATE INDEX idx_client_ip_created_at ON color_snapshots(client_ip, created_at);
CREATE INDEX idx_client_ip_ua_created_at ON color_snapshots(client_ip, user_agent, created_at);
CREATE INDEX idx_created_at ON color_snapshots(created_at);