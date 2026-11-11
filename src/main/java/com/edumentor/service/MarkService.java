package com.edumentor.service;

import com.edumentor.domain.*;
import com.edumentor.domain.Repos.*;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class MarkService {
    private final MarkRepo marks;
    private final ExamRepo exams;
    private final StudentRepo students;
    private final AnalyticsService analytics;

    public MarkService(MarkRepo marks, ExamRepo exams, StudentRepo students, AnalyticsService analytics) {
        this.marks = marks; this.exams = exams; this.students = students; this.analytics = analytics;
    }

    public Student createStudent(String name, String email) { return students.save(new Student(name, email)); }

    public Mark addMark(Long studentId, String subject, String topic, double score, double max, LocalDate date) {
        requireStudent(studentId);
        Mark m = marks.save(new Mark(studentId, subject, topic, score, max, date == null ? LocalDate.now() : date));
        analytics.invalidate(studentId);
        return m;
    }

    public Exam addExam(Long studentId, String subject, LocalDate date) {
        requireStudent(studentId);
        Exam e = exams.save(new Exam(studentId, subject, date));
        analytics.invalidate(studentId);
        return e;
    }

    public List<Exam> listExams(Long studentId) {
        requireStudent(studentId);
        return exams.findByStudentIdOrderByExamDateAsc(studentId);
    }

    public void deleteExam(Long studentId, Long examId) {
        requireStudent(studentId);
        Exam exam = exams.findById(examId)
                .filter(existing -> studentId.equals(existing.getStudentId()))
                .orElseThrow(() -> new IllegalArgumentException("Exam " + examId + " not found"));
        exams.delete(exam);
        analytics.invalidate(studentId);
    }

    public List<Mark> listMarks(Long studentId) { return marks.findByStudentIdOrderByTakenOnAsc(studentId); }

    private void requireStudent(Long id) {
        if (!students.existsById(id)) throw new IllegalArgumentException("Student " + id + " not found");
    }
}
