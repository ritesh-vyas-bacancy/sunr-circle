-- ============================================================
-- MIGRATION: 20240101000008_indexes
-- Performance indexes. Applied after all tables exist.
--
-- Strategy:
--   FK indexes     — cover all foreign-key columns not already
--                    covered by a PRIMARY KEY or UNIQUE constraint.
--   Composite      — match the dominant query patterns identified
--                    in the Phase 1 architecture document.
--   GIN trigram    — enable sub-100ms ILIKE '%term%' on consumer
--                    name, mobile, and raw_complaint_number.
-- ============================================================

-- ============================================================
-- offices
-- ============================================================
CREATE INDEX idx_offices_organization_id ON offices (organization_id);
CREATE INDEX idx_offices_parent_id       ON offices (parent_id);         -- hierarchy traversal
CREATE INDEX idx_offices_type            ON offices (office_type);        -- filter by level

-- ============================================================
-- users
-- ============================================================
CREATE INDEX idx_users_organization_id   ON users (organization_id);
CREATE INDEX idx_users_sub_division_id   ON users (sub_division_id);     -- subdivision staff lookup
CREATE INDEX idx_users_role              ON users (role);                 -- list by role
CREATE INDEX idx_users_is_active         ON users (is_active);           -- active users filter

-- ============================================================
-- complaints
-- ============================================================
CREATE INDEX idx_complaints_organization_id  ON complaints (organization_id);
CREATE INDEX idx_complaints_sub_division_id  ON complaints (sub_division_id);
CREATE INDEX idx_complaints_status           ON complaints (status);          -- open/assigned queue
CREATE INDEX idx_complaints_created_by       ON complaints (created_by);
CREATE INDEX idx_complaints_assigned_to      ON complaints (assigned_to);     -- line man's queue
CREATE INDEX idx_complaints_created_at       ON complaints (created_at DESC); -- date range reporting
CREATE INDEX idx_complaints_closed_at        ON complaints (closed_at DESC);  -- SLA reporting
CREATE INDEX idx_complaints_number           ON complaints (complaint_number); -- exact label lookup

-- Composite: primary dashboard query (sub-division + status + date DESC)
CREATE INDEX idx_complaints_subdivision_status_date
  ON complaints (sub_division_id, status, created_at DESC);

-- GIN trigram indexes for ILIKE consumer search (pg_trgm required)
CREATE INDEX idx_complaints_consumer_name_trgm
  ON complaints USING GIN (consumer_name gin_trgm_ops);
CREATE INDEX idx_complaints_consumer_mobile_trgm
  ON complaints USING GIN (consumer_mobile gin_trgm_ops);
CREATE INDEX idx_complaints_raw_number_trgm
  ON complaints USING GIN (raw_complaint_number gin_trgm_ops);

-- ============================================================
-- complaint_logs
-- ============================================================
-- Covers the most common query: load timeline for one complaint
CREATE INDEX idx_complaint_logs_complaint_id
  ON complaint_logs (complaint_id, logged_at DESC);

-- ============================================================
-- notification_logs
-- ============================================================
CREATE INDEX idx_notification_logs_complaint_id ON notification_logs (complaint_id);
CREATE INDEX idx_notification_logs_status        ON notification_logs (status);    -- retry queue
