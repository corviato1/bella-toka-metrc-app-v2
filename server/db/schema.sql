CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS locations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plants (
  id SERIAL PRIMARY KEY,
  metrc_tag VARCHAR(255) UNIQUE NOT NULL,
  current_location VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS movements (
  id SERIAL PRIMARY KEY,
  plant_id INTEGER REFERENCES plants(id) ON DELETE SET NULL,
  plant_metrc_tag VARCHAR(255) NOT NULL,
  from_location VARCHAR(255),
  to_location VARCHAR(255) NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  username VARCHAR(50),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS biowaste_reports (
  id SERIAL PRIMARY KEY,
  photo_path VARCHAR(500),
  location_name VARCHAR(255) NOT NULL,
  weight_value NUMERIC(10,3) NOT NULL,
  weight_unit VARCHAR(10) NOT NULL DEFAULT 'lbs',
  reported_by VARCHAR(50),
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  metrc_response JSONB,
  metrc_submitted BOOLEAN NOT NULL DEFAULT FALSE,
  reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sync_log (
  key VARCHAR(100) PRIMARY KEY,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO locations (name) VALUES
  ('Veg Room A'),
  ('Veg Room B'),
  ('Flower Room A'),
  ('Flower Room B'),
  ('Dry Room'),
  ('Clone Room'),
  ('Mother Room')
ON CONFLICT (name) DO NOTHING;
