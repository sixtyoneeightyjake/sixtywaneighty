-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user sessions table for tracking logins
CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address INET,
  user_agent TEXT
);

-- Create video generations table for tracking usage
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_video_generations_user_id ON video_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_video_generations_status ON video_generations(status);
CREATE INDEX IF NOT EXISTS idx_video_generations_created_at ON video_generations(created_at);

-- Create a view for user statistics
CREATE OR REPLACE VIEW user_stats AS
SELECT 
  u.id,
  u.email,
  u.created_at as user_created,
  COUNT(vg.id) as total_videos,
  COUNT(CASE WHEN vg.status = 'completed' THEN 1 END) as successful_videos,
  COUNT(CASE WHEN vg.status = 'failed' THEN 1 END) as failed_videos,
  MAX(vg.created_at) as last_generation,
  COUNT(us.id) as total_logins,
  MAX(us.login_time) as last_login
FROM users u
LEFT JOIN video_generations vg ON u.id = vg.user_id
LEFT JOIN user_sessions us ON u.id = us.user_id
GROUP BY u.id, u.email, u.created_at;
