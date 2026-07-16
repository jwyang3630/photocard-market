CREATE TABLE IF NOT EXISTS listings (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('sell','wanted')),
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  size TEXT,
  condition TEXT,
  price INTEGER,
  description TEXT,
  contact TEXT,
  image_url TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_listings_brand ON listings(brand);
CREATE INDEX IF NOT EXISTS idx_listings_created ON listings(created_at DESC);
