
package com.edumentor.web;

import com.edumentor.agent.MentorAgent;
import com.edumentor.agent.MentorRequestException;
import com.edumentor.domain.*;
import com.edumentor.domain.Repos.MessageRepo;
import com.edumentor.service.AnalyticsService;
import com.edumentor.service.MarkService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;


@RestController
@RequestMapping("/api")
public class ApiController {

    private static final Logger log = LoggerFactory.getLogger(ApiController.class);

    public record StudentReq(@NotBlank String name, String email) {}
    public record MarkReq(@NotBlank String subject, @NotBlank String topic,
                          @PositiveOrZero double score, @Positive double maxScore, LocalDate takenOn) {}
    public record ExamReq(@NotBlank String subject, @NotNull LocalDate examDate) {}
    public record AskReq(@NotBlank String question) {}

    private final MarkService marks;
    private final AnalyticsService analytics;
    private final MentorAgent agent;
    private final MessageRepo messages;

    public ApiController(MarkService marks, AnalyticsService analytics,
                         MentorAgent agent, MessageRepo messages) {
        this.marks = marks;
        this.analytics = analytics;
        this.agent = agent;
        this.messages = messages;
    }

    @PostMapping("/students")
    @ResponseStatus(HttpStatus.CREATED)
    public Student createStudent(@RequestBody @Valid StudentReq r) {
        return marks.createStudent(r.name(), r.email());
    }

    @PostMapping("/students/{id}/marks")
    @ResponseStatus(HttpStatus.CREATED)
    public Mark addMark(@PathVariable Long id, @RequestBody @Valid MarkReq r) {
        return marks.addMark(id, r.subject(), r.topic(), r.score(), r.maxScore(), r.takenOn());
    }

    @GetMapping("/students/{id}/marks")
    public List<Mark> marks(@PathVariable Long id) {
        return marks.listMarks(id);
    }

    @PostMapping("/students/{id}/exams")
    @ResponseStatus(HttpStatus.CREATED)
    public Exam addExam(@PathVariable Long id, @RequestBody @Valid ExamReq r) {
        return marks.addExam(id, r.subject(), r.examDate());
    }

    @GetMapping("/students/{id}/exams")
    public List<Exam> exams(@PathVariable Long id) {
        return marks.listExams(id);
    }

    @DeleteMapping("/students/{id}/exams/{examId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteExam(@PathVariable Long id, @PathVariable Long examId) {
        marks.deleteExam(id, examId);
    }

    @GetMapping("/students/{id}/analytics")
    public AnalyticsService.Analytics analytics(@PathVariable Long id) {
        return analytics.compute(id);
    }

    @PostMapping("/mentor/{id}/ask")
    public ResponseEntity<Map<String, String>> ask(@PathVariable String id,
                                                    @RequestBody @Valid AskReq r) {

        if (id == null || id.equalsIgnoreCase("null") || id.isBlank()) {
            return ResponseEntity.ok(Map.of("answer", "Please enter your name first to use Mentor."));
        }

        Long studentId;

        try {
            studentId = Long.valueOf(id);
        } catch (NumberFormatException e) {
            return ResponseEntity.ok(Map.of("answer", "Please enter your name first to use Mentor."));
        }

        final String answer;
        try {
            answer = agent.run(studentId, r.question());
        } catch (MentorRequestException e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            log.error("AI Mentor request failed for student {}", studentId, e);
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("error", "AI Mentor is temporarily unavailable. Please try again."));
        }

        messages.save(new MentorMessage(studentId, "student", r.question()));
        messages.save(new MentorMessage(studentId, "mentor", answer));

        return ResponseEntity.ok(Map.of("answer", answer));
    }

    @GetMapping("/mentor/{id}/history")
    public List<MentorMessage> history(@PathVariable Long id) {
        return messages.findTop10ByStudentIdOrderByCreatedAtDesc(id);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public Map<String, String> notFound(IllegalArgumentException e) {
        String message = e.getMessage();
        return Map.of("error", message == null || message.isBlank() ? "Resource not found." : message);
    }
}
