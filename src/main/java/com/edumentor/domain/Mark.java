package com.edumentor.domain;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity @Table(name = "marks")
public class Mark {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "student_id") private Long studentId;
    private String subject;
    private String topic;
    private double score;
    @Column(name = "max_score", columnDefinition = "numeric") private double maxScore;
    @Column(name = "taken_on") private LocalDate takenOn;
    protected Mark() {}
    public Mark(Long studentId, String subject, String topic, double score, double maxScore, LocalDate takenOn) {
        this.studentId = studentId; this.subject = subject; this.topic = topic;
        this.score = score; this.maxScore = maxScore; this.takenOn = takenOn;
    }
    public Long getId() { return id; }
    public Long getStudentId() { return studentId; }
    public String getSubject() { return subject; }
    public String getTopic() { return topic; }
    public double getScore() { return score; }
    public double getMaxScore() { return maxScore; }
    public LocalDate getTakenOn() { return takenOn; }
    public double percent() { return score / maxScore * 100.0; }
}