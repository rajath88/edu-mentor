package com.edumentor.service;

import com.edumentor.domain.Repos.StudentRepo;
import com.edumentor.domain.Student;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class StudentServiceTest {
    private final StudentRepo students = mock(StudentRepo.class);
    private final AnalyticsService analytics = mock(AnalyticsService.class);
    private final StudentService service = new StudentService(students, analytics);

    @Test
    void createsNewProfileWithNormalizedNameAndEmail() {
        Student saved = new Student("New Student", "new@example.com");
        when(students.saveAndFlush(any(Student.class))).thenReturn(saved);

        Student created = service.createProfile("  New Student ", " new@example.com ");

        assertSame(saved, created);
        verify(students).existsByEmail("new@example.com");
        verify(students).saveAndFlush(argThat(student ->
                "New Student".equals(student.getName()) && "new@example.com".equals(student.getEmail())
        ));
    }

    @Test
    void duplicateRegistrationEmailReturnsSafeConflictInsteadOfCreatingAnotherProfile() {
        when(students.existsByEmail("taken@example.com")).thenReturn(true);

        StudentService.DuplicateStudentEmailException error = assertThrows(
                StudentService.DuplicateStudentEmailException.class,
                () -> service.createProfile("Student", "taken@example.com")
        );

        assertTrue(error.getMessage().contains("cannot restore an existing profile using email alone"));
        verify(students, never()).saveAndFlush(any());
    }

    @Test
    void concurrentDuplicateRegistrationIsTranslatedWithoutLeakingDatabaseDetails() {
        when(students.existsByEmail("taken@example.com")).thenReturn(false, true);
        when(students.saveAndFlush(any(Student.class)))
                .thenThrow(new DataIntegrityViolationException("database detail"));

        StudentService.DuplicateStudentEmailException error = assertThrows(
                StudentService.DuplicateStudentEmailException.class,
                () -> service.createProfile("Student", "taken@example.com")
        );

        assertFalse(error.getMessage().contains("database detail"));
    }

    @Test
    void updatesProfileAfterTrimmingNameAndNormalizingBlankEmail() {
        Student student = new Student("Old Name", "old@example.com");
        when(students.findById(4L)).thenReturn(Optional.of(student));
        when(students.saveAndFlush(student)).thenReturn(student);

        Student updated = service.updateProfile(4L, "  New Name  ", "  ");

        assertSame(student, updated);
        assertEquals("New Name", updated.getName());
        assertNull(updated.getEmail());
        verify(students).saveAndFlush(student);
    }

    @Test
    void reportsDuplicateEmailWithoutExposingDatabaseDetails() {
        Student student = new Student("Name", "old@example.com");
        when(students.findById(4L)).thenReturn(Optional.of(student));
        when(students.saveAndFlush(student)).thenThrow(new DataIntegrityViolationException("database detail"));

        StudentService.DuplicateStudentEmailException error = assertThrows(
                StudentService.DuplicateStudentEmailException.class,
                () -> service.updateProfile(4L, "Name", "taken@example.com")
        );

        assertFalse(error.getMessage().contains("database detail"));
    }

    @Test
    void rejectsBlankNamesAsProfileValidationErrors() {
        when(students.findById(4L)).thenReturn(Optional.of(new Student("Name", null)));

        StudentService.InvalidStudentProfileException error = assertThrows(
                StudentService.InvalidStudentProfileException.class,
                () -> service.updateProfile(4L, "   ", null)
        );

        assertEquals("Name must be between 1 and 120 characters.", error.getMessage());
        verify(students, never()).saveAndFlush(any());
    }

    @Test
    void accountDeletionTargetsOnlyTheRequestedStudentAndInvalidatesAnalytics() {
        Student student = new Student("Name", null);
        when(students.findById(4L)).thenReturn(Optional.of(student));

        service.deleteAccount(4L);

        verify(students).findById(4L);
        verify(students).delete(student);
        verify(analytics).invalidate(4L);
        verifyNoMoreInteractions(students, analytics);
    }

    @Test
    void missingStudentCannotBeUpdatedOrDeleted() {
        when(students.findById(99L)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> service.updateProfile(99L, "Name", null));
        assertThrows(IllegalArgumentException.class, () -> service.deleteAccount(99L));
        verify(students, never()).delete(any());
        verify(students, never()).saveAndFlush(any());
    }
}
