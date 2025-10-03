CREATE TABLE color_snapshots (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  colors TEXT NOT NULL,
  positions TEXT NOT NULL,
  device_type TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_user_id ON color_snapshots(user_id);
CREATE INDEX idx_created_at ON color_snapshots(created_at);

