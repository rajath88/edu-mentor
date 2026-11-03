package com.edumentor.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity @Table(name = "mentor_messages")
public class MentorMessage {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "student_id") private Long studentId;
    private String role;
    private String content;
    @Column(name = "created_at") private LocalDateTime createdAt = LocalDateTime.now();
    protected MentorMessage() {}
    public MentorMessage(Long studentId, String role, String content) {
        this.studentId = studentId; this.role = role; this.content = content;
    }
    public Long getId() { return id; }
    public String getRole() { return role; }
    public String getContent() { return content; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
