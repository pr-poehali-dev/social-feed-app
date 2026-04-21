
CREATE TABLE t_p13865266_social_feed_app.users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  bio TEXT DEFAULT '',
  avatar VARCHAR(4) DEFAULT '',
  password_hash VARCHAR(255) NOT NULL,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE t_p13865266_social_feed_app.sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES t_p13865266_social_feed_app.users(id),
  token VARCHAR(64) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE TABLE t_p13865266_social_feed_app.follows (
  follower_id INTEGER NOT NULL REFERENCES t_p13865266_social_feed_app.users(id),
  following_id INTEGER NOT NULL REFERENCES t_p13865266_social_feed_app.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

CREATE TABLE t_p13865266_social_feed_app.posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES t_p13865266_social_feed_app.users(id),
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE t_p13865266_social_feed_app.likes (
  user_id INTEGER NOT NULL REFERENCES t_p13865266_social_feed_app.users(id),
  post_id INTEGER NOT NULL REFERENCES t_p13865266_social_feed_app.posts(id),
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

CREATE TABLE t_p13865266_social_feed_app.messages (
  id SERIAL PRIMARY KEY,
  from_user_id INTEGER NOT NULL REFERENCES t_p13865266_social_feed_app.users(id),
  to_user_id INTEGER NOT NULL REFERENCES t_p13865266_social_feed_app.users(id),
  text TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
