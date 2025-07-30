-- Insert sample users (in production, use proper password hashing like bcrypt)
INSERT INTO users (email, password) VALUES 
  ('demo@sixtywaneighty.com', 'demo123'),
  ('test@example.com', 'test123'),
  ('admin@sixtywaneighty.com', 'admin123')
ON CONFLICT (email) DO NOTHING;

-- Insert some sample video generations for demo
INSERT INTO video_generations (user_id, prompt, resolution, aspect_ratio, status, created_at) VALUES 
  (1, 'A kitten running in the moonlight', '1080P', '16:9', 'completed', NOW() - INTERVAL '1 day'),
  (1, 'A futuristic city at sunset', '1080P', '4:3', 'completed', NOW() - INTERVAL '2 hours'),
  (2, 'A peaceful lake with mountains', '480P', '1:1', 'failed', NOW() - INTERVAL '30 minutes')
ON CONFLICT DO NOTHING;
