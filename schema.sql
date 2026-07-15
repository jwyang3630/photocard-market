CREATE TABLE IF NOT EXISTS listings (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('sell','wanted')),
  group_name TEXT NOT NULL,
  member TEXT NOT NULL,
  era TEXT,
  price INTEGER,
  description TEXT,
  contact TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_listings_group ON listings(group_name);
CREATE INDEX IF NOT EXISTS idx_listings_created ON listings(created_at DESC);
