-- ============================================================
-- MIGRATION: 20240101000006_notification_logs
-- Records every notification dispatch attempt.
-- In Phase 1 all rows are status='skipped' (providers stubbed).
-- In Phase 2, real provider integrations update status to
-- 'sent' or 'failed' and populate provider_message_id.
-- ============================================================

CREATE TABLE notification_logs (
  id                  UUID                 PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id        UUID                 REFERENCES complaints(id) ON DELETE SET NULL,
  channel             notification_channel NOT NULL,
  recipient           TEXT                 NOT NULL,   -- Phone number or email address
  message_body        TEXT,
  status              notification_status  NOT NULL DEFAULT 'pending',
  provider_message_id TEXT,                            -- External provider reference ID (Phase 2)
  error_message       TEXT,
  triggered_by        UUID                 REFERENCES users(id) ON DELETE SET NULL,
  sent_at             TIMESTAMPTZ,
  created_at          TIMESTAMPTZ          NOT NULL DEFAULT now()
  -- No updated_at: once sent or failed the record is not modified
);

COMMENT ON TABLE  notification_logs                  IS 'Notification dispatch log. Phase 1: all entries are skipped. Phase 2: real provider results.';
COMMENT ON COLUMN notification_logs.channel          IS 'Delivery channel: sms, whatsapp, email, push.';
COMMENT ON COLUMN notification_logs.provider_message_id IS 'External provider reference, e.g. MSG91 message ID. Null in Phase 1.';
COMMENT ON COLUMN notification_logs.recipient        IS 'E.164 phone number or RFC 5321 email address of the notification recipient.';
