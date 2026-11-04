package com.edumentor.service;

import com.edumentor.domain.*;
import com.edumentor.domain.Repos.*;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.io.Serializable;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    public record SubjectStats(String subject, double average, double trend,
                               String weakestTopic, Long daysToExam) implements Serializable {}
    public record Analytics(Long studentId, List<SubjectStats> subjects) implements Serializable {}

    private final MarkRepo marks;
    private final ExamRepo exams;

    public AnalyticsService(MarkRepo marks, ExamRepo exams) {
        this.marks = marks; this.exams = exams;
    }

    /** Cached in Valkey; evicted whenever the student's marks or exams change. */
    @Cacheable(value = "analytics", key = "#studentId")
    public Analytics compute(Long studentId) {
        List<Mark> all = marks.findByStudentIdOrderByTakenOnAsc(studentId);
        Map<String, LocalDate> nextExam = new HashMap<>();
        for (Exam e : exams.findByStudentIdOrderByExamDateAsc(studentId)) {
            if (!e.getExamDate().isBefore(LocalDate.now())) nextExam.putIfAbsent(e.getSubject(), e.getExamDate());
        }
        Map<String, List<Mark>> bySubject = all.stream()
            .collect(Collectors.groupingBy(mark -> Objects.requireNonNull(mark).getSubject(),
                TreeMap::new, Collectors.toList()));

        List<SubjectStats> out = new ArrayList<>();
        bySubject.forEach((subject, list) -> {
            double avg = list.stream().mapToDouble(mark -> Objects.requireNonNull(mark).percent()).average().orElse(0);
            out.add(new SubjectStats(subject, round(avg), round(trend(list)), weakestTopic(list),
                    nextExam.containsKey(subject) ? ChronoUnit.DAYS.between(LocalDate.now(), nextExam.get(subject)) : null));
        });
        return new Analytics(studentId, out);
    }

    @CacheEvict(value = "analytics", key = "#studentId")
    public void invalidate(Long studentId) {}

    /** Average of the latest 3 scores minus average of everything before them. */
    private double trend(List<Mark> list) {
        if (list.size() < 4) return 0;
        int split = list.size() - 3;
        double recent = list.subList(split, list.size()).stream()
            .mapToDouble(mark -> Objects.requireNonNull(mark).percent()).average().orElse(0);
        double earlier = list.subList(0, split).stream()
            .mapToDouble(mark -> Objects.requireNonNull(mark).percent()).average().orElse(0);
        return recent - earlier;
    }

    private String weakestTopic(List<Mark> list) {
        return list.stream()
                .collect(Collectors.groupingBy(Mark::getTopic, Collectors.averagingDouble(Mark::percent)))
                .entrySet().stream().min(Map.Entry.comparingByValue())
                .map(entry -> Objects.requireNonNull(entry).getKey()).orElse("n/a");
    }

    private double round(double v) { return Math.round(v * 10.0) / 10.0; }
}
