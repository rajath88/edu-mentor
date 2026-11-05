
package com.edumentor.web;

import com.edumentor.agent.MentorAgent;
import com.edumentor.domain.*;
import com.edumentor.domain.Repos.MessageRepo;
import com.edumentor.service.AnalyticsService;
import com.edumentor.service.MarkService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = {
    "http://localhost:5173",
    "https://edu-mentor-two.vercel.app",
    "https://edu-mentor-tzscc169y-rajath88.vercel.app",
    "https://edu-mentor-12vwx0fbs-rajath88.vercel.app"
})

@RestController
@RequestMapping("/api")
public class ApiController {

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

    @GetMapping("/students/{id}/analytics")
    public AnalyticsService.Analytics analytics(@PathVariable Long id) {
        return analytics.compute(id);
    }

    @PostMapping("/mentor/{id}/ask")
    public Map<String, String> ask(@PathVariable String id,
                                   @RequestBody @Valid AskReq r) {

        if (id == null || id.equalsIgnoreCase("null") || id.isBlank()) {
            return Map.of("answer", "Please enter your name first to use Mentor.");
        }

        Long studentId;

        try {
            studentId = Long.valueOf(id);
        } catch (NumberFormatException e) {
            return Map.of("answer", "Please enter your name first to use Mentor.");
        }

        String answer = agent.run(studentId, r.question());

        messages.save(new MentorMessage(studentId, "student", r.question()));
        messages.save(new MentorMessage(studentId, "mentor", answer));

        return Map.of("answer", answer);
    }

    @GetMapping("/mentor/{id}/history")
    public List<MentorMessage> history(@PathVariable Long id) {
        return messages.findTop10ByStudentIdOrderByCreatedAtDesc(id);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public Map<String, String> notFound(IllegalArgumentException e) {
        return Map.of("error", e.getMessage());
    }
}
