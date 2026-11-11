package com.edumentor.service;

import com.edumentor.domain.Exam;
import com.edumentor.domain.Repos.ExamRepo;
import com.edumentor.domain.Repos.MarkRepo;
import com.edumentor.domain.Repos.StudentRepo;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class MarkServiceTest {

    @Test
    void rejectsDeletingAnExamOwnedByAnotherStudent() {
        MarkRepo marks = mock(MarkRepo.class);
        ExamRepo exams = mock(ExamRepo.class);
        StudentRepo students = mock(StudentRepo.class);
        AnalyticsService analytics = mock(AnalyticsService.class);
        when(students.existsById(7L)).thenReturn(true);
        Exam exam = new Exam(8L, "Physics", LocalDate.now().plusDays(1));
        when(exams.findById(15L)).thenReturn(Optional.of(exam));

        MarkService service = new MarkService(marks, exams, students, analytics);

        assertThrows(IllegalArgumentException.class, () -> service.deleteExam(7L, 15L));
        verify(exams, never()).delete(exam);
        verify(analytics, never()).invalidate(7L);
    }

    @Test
    void deletesOwnedExamAndInvalidatesStudentAnalytics() {
        MarkRepo marks = mock(MarkRepo.class);
        ExamRepo exams = mock(ExamRepo.class);
        StudentRepo students = mock(StudentRepo.class);
        AnalyticsService analytics = mock(AnalyticsService.class);
        when(students.existsById(7L)).thenReturn(true);
        Exam exam = new Exam(7L, "Physics", LocalDate.now().plusDays(1));
        when(exams.findById(15L)).thenReturn(Optional.of(exam));

        MarkService service = new MarkService(marks, exams, students, analytics);

        service.deleteExam(7L, 15L);

        verify(exams).delete(exam);
        verify(analytics).invalidate(7L);
    }
}
