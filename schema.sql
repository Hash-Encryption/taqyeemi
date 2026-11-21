CREATE TABLE IF NOT EXISTS businesses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  google_maps_url TEXT NOT NULL,
  public_slug TEXT UNIQUE NOT NULL,
  secret_token TEXT UNIQUE NOT NULL,
  owner_email TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  rating INTEGER NOT NULL,
  comment TEXT,
  customer_contact TEXT,
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS auth_codes (
  email TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(public_slug);
CREATE INDEX IF NOT EXISTS idx_businesses_token ON businesses(secret_token);
CREATE INDEX IF NOT EXISTS idx_businesses_email ON businesses(owner_email);
CREATE INDEX IF NOT EXISTS idx_feedback_business ON feedback(business_id);
