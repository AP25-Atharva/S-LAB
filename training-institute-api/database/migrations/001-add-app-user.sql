-- Adds login accounts to an existing BatchWise database (already included in schema.sql for new setups).
-- Safe to run more than once.
USE training_institute;

CREATE TABLE IF NOT EXISTS app_user (
  user_id              BIGINT       NOT NULL AUTO_INCREMENT,
  username             VARCHAR(50)  NOT NULL,
  full_name            VARCHAR(100) NOT NULL,
  password_hash        VARCHAR(100) NOT NULL,
  role                 ENUM('ADMIN','STAFF') NOT NULL DEFAULT 'STAFF',
  active               TINYINT(1)   NOT NULL DEFAULT 1,
  password_changed_at  DATETIME     NOT NULL,
  last_login_at        DATETIME     NULL,
  created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY username (username)
) ENGINE=InnoDB;
