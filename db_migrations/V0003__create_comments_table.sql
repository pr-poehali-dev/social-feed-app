
CREATE TABLE t_p13865266_social_feed_app.comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES t_p13865266_social_feed_app.posts(id),
  user_id INTEGER NOT NULL REFERENCES t_p13865266_social_feed_app.users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
