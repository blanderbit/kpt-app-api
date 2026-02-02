-- Migration: add originalTransactionId and lastEventTimestampMs for RevenueCat webhook upsert.
-- Run on existing DBs where synchronize is false. If columns/index already exist, ignore duplicate errors (e.g. mysql -f).

-- MySQL (run each statement; ignore "Duplicate column" / "Duplicate key" if re-running)
ALTER TABLE subscriptions ADD COLUMN originalTransactionId VARCHAR(255) NULL;
ALTER TABLE subscriptions ADD COLUMN lastEventTimestampMs BIGINT NULL;
CREATE UNIQUE INDEX IDX_subscriptions_original_transaction_id ON subscriptions(originalTransactionId);
