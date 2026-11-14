package com.edumentor.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Entity
@Table(name = "student_progression_events", uniqueConstraints = @UniqueConstraint(
        name = "uq_progression_student_event", columnNames = {"student_id", "event_key"}
))
public class StudentProgressionEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "event_key", nullable = false, length = 160)
    private String eventKey;

    @Column(name = "event_type", nullable = false, length = 40)
    private String eventType;

    @Column(name = "resource_id", nullable = false, length = 120)
    private String resourceId;

    @Column(name = "xp_awarded", nullable = false)
    private int xpAwarded;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now(ZoneOffset.UTC);

    protected StudentProgressionEvent() {}

    public StudentProgressionEvent(Long studentId, String eventKey, String eventType, String resourceId, int xpAwarded) {
        this.studentId = studentId;
        this.eventKey = eventKey;
        this.eventType = eventType;
        this.resourceId = resourceId;
        this.xpAwarded = xpAwarded;
    }

    public Long getId() { return id; }
    public Long getStudentId() { return studentId; }
    public String getEventKey() { return eventKey; }
    public String getEventType() { return eventType; }
    public String getResourceId() { return resourceId; }
    public int getXpAwarded() { return xpAwarded; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
