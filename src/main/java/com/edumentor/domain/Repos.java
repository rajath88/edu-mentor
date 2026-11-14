package com.edumentor.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;

public final class Repos {
    private Repos() {}
    public interface StudentRepo extends JpaRepository<Student, Long> {
        boolean existsByEmail(String email);
        @Lock(LockModeType.PESSIMISTIC_WRITE)
        @Query("select s from Student s where s.id = :id")
        Optional<Student> lockById(@Param("id") Long id);
    }
    public interface MarkRepo extends JpaRepository<Mark, Long> {
        List<Mark> findByStudentIdOrderByTakenOnAsc(Long studentId);
    }
    public interface ExamRepo extends JpaRepository<Exam, Long> {
        List<Exam> findByStudentIdOrderByExamDateAsc(Long studentId);
    }
    public interface MessageRepo extends JpaRepository<MentorMessage, Long> {
        List<MentorMessage> findTop10ByStudentIdOrderByCreatedAtDesc(Long studentId);
        List<MentorMessage> findTop10ByStudentIdOrderByCreatedAtDescIdDesc(Long studentId);
    }
    public interface ProgressionEventRepo extends JpaRepository<StudentProgressionEvent, Long> {
        boolean existsByStudentIdAndEventKey(Long studentId, String eventKey);
        List<StudentProgressionEvent> findByStudentIdOrderByCreatedAtDescIdDesc(Long studentId);
    }
}
