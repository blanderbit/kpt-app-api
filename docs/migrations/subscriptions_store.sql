-- Add `store` column to subscriptions table to track source store (APP_STORE, PLAY_STORE, PADDLE, etc.)
ALTER TABLE subscriptions
  ADD COLUMN store varchar(32) NULL;

