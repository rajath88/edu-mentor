package com.edumentor.service;

import com.edumentor.domain.Exam;
import com.edumentor.domain.Mark;
import com.edumentor.domain.Repos.ExamRepo;
import com.edumentor.domain.Repos.MarkRepo;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AnalyticsServiceTest {

    @Test
    void computesOverallAndSubjectAnalyticsFromMarksAndUpcomingExams() {
        MarkRepo marks = mock(MarkRepo.class);
        ExamRepo exams = mock(ExamRepo.class);
        LocalDate today = LocalDate.now();
        List<Mark> records = List.of(
                new Mark(7L, "Math", "Fractions", 5, 10, today.minusDays(4)),
                new Mark(7L, "Math", "Algebra", 6, 10, today.minusDays(3)),
                new Mark(7L, "Math", "Geometry", 8, 10, today.minusDays(2)),
                new Mark(7L, "Math", "Calculus", 10, 10, today.minusDays(1))
        );
        when(marks.findByStudentIdOrderByTakenOnAsc(7L)).thenReturn(records);
        when(exams.findByStudentIdOrderByExamDateAsc(7L)).thenReturn(List.of(
                new Exam(7L, "Math", today.plusDays(5)),
                new Exam(7L, "History", today.minusDays(1))
        ));

        AnalyticsService.Analytics result = new AnalyticsService(marks, exams).compute(7L);

        assertEquals(4, result.marksCount());
        assertEquals(72.5, result.averageScore());
        assertEquals(1, result.subjects().size());
        assertEquals(72.5, result.subjects().getFirst().average());
        assertEquals(30.0, result.subjects().getFirst().trend());
        assertEquals("Fractions", result.subjects().getFirst().weakestTopic());
        assertEquals(5L, result.subjects().getFirst().daysToExam());
        assertEquals(1, result.upcomingExams().size());
        assertEquals("Math", result.upcomingExams().getFirst().subject());
    }
}
