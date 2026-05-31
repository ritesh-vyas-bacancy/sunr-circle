-- ============================================================
-- MIGRATION: 20240101000005_complaint_logs
-- Immutable append-only audit trail for complaint status changes.
--
-- Populated exclusively by the log_complaint_status_change() trigger.
-- RULE statements prevent any UPDATE or DELETE on this table,
-- even by service-role direct SQL.
--
-- The trigger fires AFTER UPDATE OF status ON complaints,
-- captures OLD.status, NEW.status, auth.uid(), and a JSONB
-- snapshot of assigned_to and attend_remarks.
-- ============================================================

CREATE TABLE complaint_logs (
  id            UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id  UUID             NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  old_status    complaint_status,               -- NULL on the first transition (open -> assigned)
  new_status    complaint_status NOT NULL,
  remarks       TEXT,
  changed_by    UUID             NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  metadata      JSONB,                          -- snapshot: assigned_to, attend_remarks
  logged_at     TIMESTAMPTZ      NOT NULL DEFAULT now()
  -- No updated_at: append-only table
);

COMMENT ON TABLE  complaint_logs             IS 'Immutable audit trail. Populated only by trigger. UPDATE and DELETE are blocked by RULE.';
COMMENT ON COLUMN complaint_logs.old_status  IS 'Previous status. NULL when complaint is first created (no prior state).';
COMMENT ON COLUMN complaint_logs.metadata    IS 'JSONB snapshot of assigned_to and attend_remarks at time of transition.';

-- Block mutations: these rules silently swallow any UPDATE or DELETE attempt
CREATE RULE complaint_logs_no_update AS ON UPDATE TO complaint_logs DO INSTEAD NOTHING;
CREATE RULE complaint_logs_no_delete AS ON DELETE TO complaint_logs DO INSTEAD NOTHING;

-- ============================================================
-- TRIGGER FUNCTION: log_complaint_status_change
-- Fires AFTER UPDATE OF status ON complaints.
-- Uses SECURITY DEFINER to insert into complaint_logs as a
-- trusted system actor, bypassing RLS on complaint_logs.
-- auth.uid() is still captured at the moment of the triggering
-- user's transaction.
-- ============================================================
CREATE OR REPLACE FUNCTION log_complaint_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO complaint_logs (
      complaint_id,
      old_status,
      new_status,
      changed_by,
      metadata
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      auth.uid(),
      jsonb_build_object(
        'assigned_to',    NEW.assigned_to,
        'attend_remarks', NEW.attend_remarks
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION log_complaint_status_change() IS
  'Trigger function. Inserts one row into complaint_logs for every status change on complaints. '
  'SECURITY DEFINER ensures the insert succeeds regardless of the calling user''s RLS context.';

CREATE TRIGGER trg_complaint_audit
  AFTER UPDATE OF status ON complaints
  FOR EACH ROW EXECUTE FUNCTION log_complaint_status_change();
