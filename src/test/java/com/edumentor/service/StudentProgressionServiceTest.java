package com.edumentor.service;

import com.edumentor.domain.Repos.ProgressionEventRepo;
import com.edumentor.domain.Repos.StudentRepo;
import com.edumentor.domain.Student;
import com.edumentor.domain.StudentProgressionEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.lang.reflect.Field;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class StudentProgressionServiceTest {
    private StudentRepo students;
    private ProgressionEventRepo events;
    private List<StudentProgressionEvent> saved;
    private StudentProgressionService service;

    @BeforeEach
    void setUp() {
        students = mock(StudentRepo.class);
        events = mock(ProgressionEventRepo.class);
        saved = new ArrayList<>();
        when(students.lockById(anyLong())).thenReturn(Optional.of(new Student("Student", null)));
        when(students.existsById(anyLong())).thenReturn(true);
        when(events.existsByStudentIdAndEventKey(anyLong(), anyString())).thenAnswer(call -> saved.stream()
                .anyMatch(event -> event.getStudentId().equals(call.getArgument(0))
                        && event.getEventKey().equals(call.getArgument(1))));
        when(events.saveAndFlush(any(StudentProgressionEvent.class))).thenAnswer(call -> {
            StudentProgressionEvent event = call.getArgument(0);
            saved.add(event);
            return event;
        });
        when(events.findByStudentIdOrderByCreatedAtDescIdDesc(anyLong())).thenAnswer(call -> saved.stream()
                .filter(event -> event.getStudentId().equals(call.getArgument(0)))
                .sorted(Comparator.comparing(StudentProgressionEvent::getCreatedAt).reversed())
                .toList());
        service = new StudentProgressionService(students, events);
    }

    @Test
    void lessonAndCourseRewardsAreServerCalculatedAndIdempotent() {
        assertEquals(25, service.completeLesson(7L, "data-structures", "arrays").xpAwarded());
        assertTrue(service.completeLesson(7L, "data-structures", "arrays").duplicate());
        assertEquals(0, service.completeLesson(7L, "data-structures", "arrays").xpAwarded());

        service.completeLesson(7L, "data-structures", "lists");
        service.completeLesson(7L, "data-structures", "stacks-queues");
        var finalLesson = service.completeLesson(7L, "data-structures", "trees");
        assertEquals(175, finalLesson.xpAwarded());
        assertEquals(250, finalLesson.progression().totalXp());
        assertEquals(2, finalLesson.progression().level());
        assertTrue(finalLesson.progression().achievements().contains("Course Complete"));
    }

    @Test
    void quizAnswersAreGradedFromTheServerKeyAndBonusIsOneTime() {
        var perfect = service.completeQuiz(7L, "java-fundamentals", List.of(1, 2, 2, 1, 1));
        assertEquals(125, perfect.xpAwarded());
        assertTrue(perfect.progression().achievements().contains("90 Club"));
        var retry = service.completeQuiz(7L, "java-fundamentals", List.of(1, 2, 2, 1, 1));
        assertTrue(retry.duplicate());
        assertEquals(0, retry.xpAwarded());
        assertThrows(StudentProgressionService.InvalidProgressionEventException.class,
                () -> service.completeQuiz(7L, "unknown-quiz", List.of(0)));
    }

    @Test
    void repeatedOrForeignStudentIdsCannotReuseAnotherStudentsEventLedger() {
        service.completeLesson(7L, "java-programming", "syntax");
        var otherStudent = service.completeLesson(8L, "java-programming", "syntax");
        assertEquals(25, otherStudent.xpAwarded());
        assertEquals(25, otherStudent.progression().totalXp());
        assertThrows(StudentProgressionService.InvalidProgressionEventException.class,
                () -> service.completeLesson(7L, "not-a-course", "syntax"));
    }

    @Test
    void missingStudentCannotEarnProgression() {
        when(students.lockById(404L)).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class,
                () -> service.completeLesson(404L, "java-programming", "syntax"));
    }

    @Test
    void sevenDayStreakAwardsOncePerSevenConsecutiveActiveDays() throws Exception {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        String[] courses = {"operating-systems", "database-management-systems", "computer-networks", "object-oriented-programming",
                "python-programming", "javascript-programming", "typescript-programming", "react-programming",
                "spring-boot", "rest-apis", "microservices", "system-design", "git-github", "software-testing"};

        for (int index = 0; index < 6; index++) {
            addLessonEvent(7L, courses[index], 1, today.minusDays(6L - index).atTime(12, 0));
        }
        var seventhDay = service.completeLesson(7L, courses[6], courses[6] + "-lesson-1");
        assertEquals(125, seventhDay.xpAwarded());
        assertEquals(7, seventhDay.progression().dailyStreak());
        assertTrue(seventhDay.progression().achievements().contains("Seven Day Scholar"));
        var retry = service.completeLesson(7L, courses[6], courses[6] + "-lesson-1");
        assertEquals(0, retry.xpAwarded());

        for (StudentProgressionEvent event : saved) {
            setCreatedAt(event, event.getCreatedAt().minusDays(7));
            if ("STREAK_7".equals(event.getEventType())) {
                setEventKey(event, "STREAK_7:" + today.minusDays(7));
            }
        }
        for (int index = 7; index < 13; index++) {
            addLessonEvent(7L, courses[index], 1, today.minusDays(13L - index).atTime(12, 0));
        }
        var fourteenthDay = service.completeLesson(7L, courses[13], courses[13] + "-lesson-1");
        assertEquals(125, fourteenthDay.xpAwarded());
        assertEquals(14, fourteenthDay.progression().dailyStreak());
        assertEquals(550, fourteenthDay.progression().totalXp());
    }

    private void addLessonEvent(Long studentId, String courseId, int lessonNumber, LocalDateTime createdAt) throws Exception {
        String lessonId = courseId + "-lesson-" + lessonNumber;
        StudentProgressionEvent event = new StudentProgressionEvent(studentId,
                "LESSON:" + courseId + ":" + lessonId, "LESSON", courseId + ":" + lessonId, 25);
        setCreatedAt(event, createdAt);
        saved.add(event);
    }

    private void setCreatedAt(StudentProgressionEvent event, LocalDateTime value) throws Exception {
        Field field = StudentProgressionEvent.class.getDeclaredField("createdAt");
        field.setAccessible(true);
        field.set(event, value);
    }

    private void setEventKey(StudentProgressionEvent event, String value) throws Exception {
        Field field = StudentProgressionEvent.class.getDeclaredField("eventKey");
        field.setAccessible(true);
        field.set(event, value);
    }
}
