-- Update users table for social authentication
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  avatar_url TEXT,
  provider VARCHAR(50), -- 'google', 'github', etc.
  provider_id VARCHAR(255), -- Provider's user ID
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

-- Update user sessions table
DROP TABLE IF EXISTS user_sessions CASCADE;

CREATE TABLE user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  provider VARCHAR(50), -- Which provider was used for this login
  ip_address INET,
  user_agent TEXT
);

-- Keep video generations table the same
CREATE TABLE IF NOT EXISTS video_generations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  negative_prompt TEXT,
  resolution VARCHAR(10),
  aspect_ratio VARCHAR(10),
  task_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  video_url TEXT,
  file_size BIGINT,
  duration INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  error_message TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider, provider_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_video_generations_user_id ON video_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_video_generations_status ON video_generations(status);

-- Updated user stats view
CREATE OR REPLACE VIEW user_stats AS
SELECT 
  u.id,
  u.email,
  u.name,
  u.avatar_url,
  u.provider,
  u.created_at as user_created,
  u.last_login,
  COUNT(vg.id) as total_videos,
  COUNT(CASE WHEN vg.status = 'completed' THEN 1 END) as successful_videos,
  COUNT(CASE WHEN vg.status = 'failed' THEN 1 END) as failed_videos,
  MAX(vg.created_at) as last_generation,
  COUNT(us.id) as total_logins
FROM users u
LEFT JOIN video_generations vg ON u.id = vg.user_id
LEFT JOIN user_sessions us ON u.id = us.user_id
GROUP BY u.id, u.email, u.name, u.avatar_url, u.provider, u.created_at, u.last_login;
