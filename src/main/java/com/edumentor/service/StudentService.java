package com.edumentor.service;

import com.edumentor.domain.Repos.StudentRepo;
import com.edumentor.domain.Student;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StudentService {
    private final StudentRepo students;
    private final AnalyticsService analytics;

    public StudentService(StudentRepo students, AnalyticsService analytics) {
        this.students = students;
        this.analytics = analytics;
    }

    public Student getProfile(Long id) {
        return findStudent(id);
    }

    public Student createProfile(String name, String email) {
        String normalizedName = name == null ? "" : name.trim();
        if (normalizedName.isEmpty() || normalizedName.length() > 120) {
            throw new InvalidStudentProfileException("Name must be between 1 and 120 characters.");
        }

        String normalizedEmail = email == null || email.isBlank() ? null : email.trim();
        if (normalizedEmail != null && normalizedEmail.length() > 200) {
            throw new InvalidStudentProfileException("Email must be 200 characters or fewer.");
        }
        if (emailExists(normalizedEmail)) throw new DuplicateStudentEmailException();

        Student student = new Student(normalizedName, normalizedEmail);
        try {
            return students.saveAndFlush(student);
        } catch (DataIntegrityViolationException exception) {
            if (emailExists(normalizedEmail)) throw new DuplicateStudentEmailException();
            throw exception;
        }
    }

    @Transactional
    public Student updateProfile(Long id, String name, String email) {
        Student student = findStudent(id);
        String normalizedName = name == null ? "" : name.trim();
        if (normalizedName.isEmpty() || normalizedName.length() > 120) {
            throw new InvalidStudentProfileException("Name must be between 1 and 120 characters.");
        }

        String normalizedEmail = email == null || email.isBlank() ? null : email.trim();
        if (normalizedEmail != null && normalizedEmail.length() > 200) {
            throw new IllegalArgumentException("Email must be 200 characters or fewer.");
        }

        student.updateProfile(normalizedName, normalizedEmail);
        try {
            return students.saveAndFlush(student);
        } catch (DataIntegrityViolationException exception) {
            throw new DuplicateStudentEmailException();
        }
    }

    @Transactional
    public void deleteAccount(Long id) {
        Student student = findStudent(id);
        students.delete(student);
        analytics.invalidate(id);
    }

    private Student findStudent(Long id) {
        if (id == null || id <= 0) {
            throw new IllegalArgumentException("Student not found.");
        }
        return students.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Student not found."));
    }

    private boolean emailExists(String email) {
        return email != null && students.existsByEmail(email);
    }

    public static final class DuplicateStudentEmailException extends RuntimeException {
        public DuplicateStudentEmailException() {
            super("This email already belongs to a student profile. EduMentor cannot restore an existing profile using email alone, and no duplicate profile was created.");
        }
    }

    public static final class InvalidStudentProfileException extends RuntimeException {
        public InvalidStudentProfileException(String message) {
            super(message);
        }
    }
}
