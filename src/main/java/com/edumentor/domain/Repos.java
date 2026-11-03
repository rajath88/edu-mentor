package com.edumentor.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public final class Repos {
    private Repos() {}
    public interface StudentRepo extends JpaRepository<Student, Long> {}
    public interface MarkRepo extends JpaRepository<Mark, Long> {
        List<Mark> findByStudentIdOrderByTakenOnAsc(Long studentId);
    }
    public interface ExamRepo extends JpaRepository<Exam, Long> {
        List<Exam> findByStudentIdOrderByExamDateAsc(Long studentId);
    }
    public interface MessageRepo extends JpaRepository<MentorMessage, Long> {
        List<MentorMessage> findTop10ByStudentIdOrderByCreatedAtDesc(Long studentId);
    }
}
