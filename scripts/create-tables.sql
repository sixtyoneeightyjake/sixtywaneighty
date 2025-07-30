-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user sessions table for tracking logins
CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create video generations table for tracking usage
CREATE TABLE IF NOT EXISTS video_generations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  prompt TEXT NOT NULL,
  negative_prompt TEXT,
  resolution VARCHAR(10),
  aspect_ratio VARCHAR(10),
  task_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  video_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);
