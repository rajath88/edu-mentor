package com.edumentor.domain;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity @Table(name = "exams")
public class Exam {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "student_id") private Long studentId;
    private String subject;
    @Column(name = "exam_date") private LocalDate examDate;
    protected Exam() {}
    public Exam(Long studentId, String subject, LocalDate examDate) {
        this.studentId = studentId; this.subject = subject; this.examDate = examDate;
    }
    public Long getId() { return id; }
    public Long getStudentId() { return studentId; }
    public String getSubject() { return subject; }
    public LocalDate getExamDate() { return examDate; }
}
