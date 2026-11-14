package com.edumentor.service;

import com.edumentor.domain.Repos.ProgressionEventRepo;
import com.edumentor.domain.Repos.StudentRepo;
import com.edumentor.domain.StudentProgressionEvent;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.IntStream;

@Service
public class StudentProgressionService {
    private static final int XP_PER_LEVEL = 250;
    private static final Map<String, List<String>> COURSE_LESSONS = createCourseLessons();
    private static final Map<String, List<Integer>> QUIZ_ANSWER_KEYS = Map.ofEntries(
            Map.entry("java-fundamentals", List.of(1, 2, 2, 1, 1)),
            Map.entry("data-structures", List.of(1, 2, 2, 0, 1)),
            Map.entry("cloud-computing-fundamentals", List.of(0, 1, 1, 1, 0, 0, 1, 1, 0, 0)),
            Map.entry("cloud-architecture-security", List.of(1, 1, 0, 1, 1, 1, 1, 0, 1, 1)),
            Map.entry("database-management-systems", List.of(0, 0, 0, 0, 0, 0, 0, 0, 0, 0)),
            Map.entry("operating-systems", List.of(0, 0, 0, 0, 0, 0, 0, 0, 0, 0)),
            Map.entry("computer-networks", List.of(0, 0, 0, 0, 0, 0, 0, 0, 0, 0)),
            Map.entry("docker-containerization", List.of(0, 0, 0, 0, 0, 0, 0, 0, 0, 0))
    );

    private final StudentRepo students;
    private final ProgressionEventRepo events;

    public StudentProgressionService(StudentRepo students, ProgressionEventRepo events) {
        this.students = students;
        this.events = events;
    }

    private static Map<String, List<String>> createCourseLessons() {
        Map<String, List<String>> courses = new LinkedHashMap<>();
        courses.put("data-structures", List.of("arrays", "lists", "stacks-queues", "trees"));
        courses.put("java-programming", List.of("syntax", "classes", "inheritance", "collections"));
        courses.put("machine-learning", List.of("workflow", "regression", "classification", "validation"));
        courses.put("cyber-security", List.of("security-basics", "cryptography", "web-security", "network-security"));
        courses.put("cloud-computing", List.of("cloud-intro", "cloud-service-models", "cloud-deployment-models",
                "cloud-virtualization", "cloud-network-storage", "cloud-providers", "cloud-security",
                "cloud-serverless", "cloud-reliability", "cloud-deployment"));
        List.of(
                "operating-systems", "database-management-systems", "computer-networks", "object-oriented-programming",
                "python-programming", "javascript-programming", "typescript-programming", "react-programming",
                "spring-boot", "rest-apis", "microservices", "system-design", "git-github", "software-testing",
                "artificial-intelligence-fundamentals", "deep-learning", "generative-ai", "large-language-models",
                "prompt-engineering", "retrieval-augmented-generation", "ai-agents", "docker", "kubernetes", "cicd",
                "linux", "aws-fundamentals", "network-security", "ethical-hacking-fundamentals", "cryptography",
                "web-application-security", "owasp-top-10", "coding-interview-preparation", "aptitude-logical-reasoning",
                "sql-interview-questions", "technical-interview-questions"
        ).forEach(courseId -> courses.put(courseId, IntStream.rangeClosed(1, 4)
                .mapToObj(index -> courseId + "-lesson-" + index).toList()));
        return Map.copyOf(courses);
    }

    @Transactional(readOnly = true)
    public Progression getProgression(Long studentId) {
        requireStudent(studentId, false);
        return calculate(studentId, events.findByStudentIdOrderByCreatedAtDescIdDesc(studentId));
    }

    @Transactional
    public EventResult completeLesson(Long studentId, String courseId, String lessonId) {
        requireStudent(studentId, true);
        List<String> lessons = COURSE_LESSONS.get(courseId);
        if (lessons == null || !lessons.contains(lessonId)) {
            throw new InvalidProgressionEventException("That course lesson is not part of the learning catalog.");
        }

        String key = "LESSON:" + courseId + ":" + lessonId;
        boolean duplicate = events.existsByStudentIdAndEventKey(studentId, key);
        int awarded = award(studentId, key, "LESSON", courseId + ":" + lessonId, 25);
        if (lessons.stream().allMatch(id -> events.existsByStudentIdAndEventKey(studentId, "LESSON:" + courseId + ":" + id))) {
            awarded += award(studentId, "COURSE:" + courseId, "COURSE", courseId, 150);
        }
        awarded += awardStreakMilestone(studentId);
        return result(studentId, awarded, duplicate);
    }

    @Transactional
    public EventResult completeQuiz(Long studentId, String quizId, List<Integer> answers) {
        requireStudent(studentId, true);
        List<Integer> answerKey = QUIZ_ANSWER_KEYS.get(quizId);
        if (answerKey == null || answers == null || answers.size() != answerKey.size()
                || answers.stream().anyMatch(answer -> answer == null || answer < 0 || answer > 3)) {
            throw new InvalidProgressionEventException("The quiz submission is incomplete or is not in the learning catalog.");
        }

        int score = 0;
        for (int index = 0; index < answerKey.size(); index++) {
            if (answerKey.get(index).equals(answers.get(index))) score++;
        }
        String completionKey = "QUIZ:" + quizId + ":COMPLETED";
        boolean duplicate = events.existsByStudentIdAndEventKey(studentId, completionKey);
        int awarded = award(studentId, completionKey, "QUIZ", quizId, 50);
        if (score * 100 >= answerKey.size() * 90) {
            awarded += award(studentId, "QUIZ:" + quizId + ":90_PLUS", "QUIZ_90", quizId, 75);
        }
        awarded += awardStreakMilestone(studentId);
        return result(studentId, awarded, duplicate);
    }

    @Transactional
    public EventResult completeDailyMission(Long studentId) {
        requireStudent(studentId, true);
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        boolean studiedToday = events.findByStudentIdOrderByCreatedAtDescIdDesc(studentId).stream()
                .filter(event -> "LESSON".equals(event.getEventType()) || "QUIZ".equals(event.getEventType()))
                .anyMatch(event -> event.getCreatedAt().toLocalDate().equals(today));
        if (!studiedToday) {
            throw new InvalidProgressionEventException("Complete a lesson or quiz today before claiming this mission.");
        }
        String missionKey = "MISSION:" + today;
        boolean duplicate = events.existsByStudentIdAndEventKey(studentId, missionKey);
        int awarded = award(studentId, missionKey, "MISSION", today.toString(), 30);
        return result(studentId, awarded, duplicate);
    }

    private void requireStudent(Long studentId, boolean lock) {
        if (studentId == null || studentId <= 0) throw new InvalidProgressionEventException("A valid student ID is required.");
        boolean exists = lock ? students.lockById(studentId).isPresent() : students.existsById(studentId);
        if (!exists) throw new IllegalArgumentException("Student not found.");
    }

    private int awardStreakMilestone(Long studentId) {
        List<StudentProgressionEvent> activity = events.findByStudentIdOrderByCreatedAtDescIdDesc(studentId).stream()
                .filter(event -> "LESSON".equals(event.getEventType()) || "QUIZ".equals(event.getEventType()))
                .toList();
        int streak = currentStreak(activity);
        if (streak < 7 || streak % 7 != 0) return 0;
        LocalDate latest = activity.stream().map(event -> event.getCreatedAt().toLocalDate()).max(Comparator.naturalOrder()).orElseThrow();
        return award(studentId, "STREAK_7:" + latest, "STREAK_7", latest.toString(), 100);
    }

    private int award(Long studentId, String key, String type, String resourceId, int points) {
        if (events.existsByStudentIdAndEventKey(studentId, key)) return 0;
        events.saveAndFlush(new StudentProgressionEvent(studentId, key, type, resourceId, points));
        return points;
    }

    private EventResult result(Long studentId, int awarded, boolean duplicate) {
        List<StudentProgressionEvent> current = events.findByStudentIdOrderByCreatedAtDescIdDesc(studentId);
        return new EventResult(awarded, duplicate, calculate(studentId, current));
    }

    private Progression calculate(Long studentId, List<StudentProgressionEvent> studentEvents) {
        long totalXp = studentEvents.stream().mapToLong(StudentProgressionEvent::getXpAwarded).sum();
        int level = (int) Math.min(Integer.MAX_VALUE, totalXp / XP_PER_LEVEL + 1);
        int rankLevel = Math.max(1, level);
        String rank = rankLevel <= 5 ? "Initiate"
                : rankLevel <= 10 ? "Knowledge Explorer"
                : rankLevel <= 20 ? "Academic Strategist"
                : rankLevel <= 35 ? "Intelligence Architect"
                : rankLevel <= 50 ? "Master Scholar" : "Academic Elite";
        int intoLevel = (int) (totalXp % XP_PER_LEVEL);
        int xpToNext = XP_PER_LEVEL - intoLevel;
        int streak = currentStreak(studentEvents.stream()
                .filter(event -> "LESSON".equals(event.getEventType()) || "QUIZ".equals(event.getEventType()))
                .toList());
        Set<String> badges = new LinkedHashSet<>();
        if (has(studentEvents, "LESSON")) badges.add("First Steps");
        if (has(studentEvents, "QUIZ")) badges.add("Quiz Finisher");
        if (has(studentEvents, "COURSE")) badges.add("Course Complete");
        if (has(studentEvents, "QUIZ_90")) badges.add("90 Club");
        if (has(studentEvents, "STREAK_7")) badges.add("Seven Day Scholar");
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        boolean missionComplete = events.existsByStudentIdAndEventKey(studentId, "MISSION:" + today);
        boolean missionAvailable = studentEvents.stream()
                .filter(event -> "LESSON".equals(event.getEventType()) || "QUIZ".equals(event.getEventType()))
                .anyMatch(event -> event.getCreatedAt().toLocalDate().equals(today));
        List<Achievement> recent = studentEvents.stream()
                .filter(event -> event.getXpAwarded() > 0)
                .limit(5)
                .map(event -> new Achievement(event.getEventType(), event.getResourceId(), event.getXpAwarded(), event.getCreatedAt()))
                .toList();
        return new Progression(totalXp, level, rank, intoLevel, XP_PER_LEVEL, xpToNext,
                streak, new ArrayList<>(badges), recent, missionComplete, missionAvailable);
    }

    private boolean has(List<StudentProgressionEvent> values, String type) {
        return values.stream().anyMatch(event -> type.equals(event.getEventType()));
    }

    private int currentStreak(List<StudentProgressionEvent> activity) {
        Set<LocalDate> dates = new LinkedHashSet<>();
        activity.stream().map(event -> event.getCreatedAt().toLocalDate())
                .sorted(Comparator.reverseOrder()).forEach(dates::add);
        if (dates.isEmpty()) return 0;
        LocalDate latest = dates.iterator().next();
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        if (latest.isBefore(today.minusDays(1))) return 0;
        int streak = 0;
        LocalDate expected = latest;
        for (LocalDate date : dates) {
            if (!date.equals(expected)) break;
            streak++;
            expected = expected.minusDays(1);
        }
        return streak;
    }

    public record Progression(long totalXp, int level, String rank, int xpInLevel,
                              int xpRequiredForLevel, int xpToNextLevel, int dailyStreak,
                              List<String> achievements, List<Achievement> recentEvents,
                              boolean dailyMissionCompleted, boolean dailyMissionAvailable) {}
    public record Achievement(String type, String resourceId, int xp, LocalDateTime createdAt) {}
    public record EventResult(int xpAwarded, boolean duplicate, Progression progression) {}

    public static final class InvalidProgressionEventException extends RuntimeException {
        public InvalidProgressionEventException(String message) { super(message); }
    }
}
