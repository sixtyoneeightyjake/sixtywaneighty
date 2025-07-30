-- Insert sample users (in production, use proper password hashing)
INSERT INTO users (email, password) VALUES 
  ('demo@sixtywaneighty.com', 'demo123'),
  ('test@example.com', 'test123')
ON CONFLICT (email) DO NOTHING;
