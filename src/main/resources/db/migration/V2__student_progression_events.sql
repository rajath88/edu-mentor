CREATE TABLE student_progression_events (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  event_key VARCHAR(160) NOT NULL,
  event_type VARCHAR(40) NOT NULL,
  resource_id VARCHAR(120) NOT NULL,
  xp_awarded INTEGER NOT NULL CHECK (xp_awarded >= 0),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_progression_student_event UNIQUE (student_id, event_key)
);

CREATE INDEX idx_progression_student_created
  ON student_progression_events(student_id, created_at DESC, id DESC);
