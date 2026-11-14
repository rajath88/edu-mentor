
package com.edumentor.web;

import com.edumentor.agent.MentorAgent;
import com.edumentor.agent.MentorRequestException;
import com.edumentor.domain.*;
import com.edumentor.domain.Repos.MessageRepo;
import com.edumentor.service.AnalyticsService;
import com.edumentor.service.MarkService;
import com.edumentor.service.StudentService;
import com.edumentor.service.StudentService.DuplicateStudentEmailException;
import com.edumentor.service.StudentService.InvalidStudentProfileException;
import com.edumentor.service.StudentProgressionService;
import com.edumentor.service.StudentProgressionService.InvalidProgressionEventException;
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

    public record StudentProfileReq(
            @NotBlank @Size(max = 120) String name,
            @Email @Size(max = 200) String email
    ) {}

    public record MarkReq(
            @NotBlank String subject,
            @NotBlank String topic,
            @PositiveOrZero double score,
            @Positive double maxScore,
            LocalDate takenOn
    ) {}

    public record ExamReq(
            @NotBlank String subject,
            @NotNull LocalDate examDate
    ) {}

    public record AskReq(@NotBlank String question) {}

    public record LessonCompletionReq(@NotBlank String courseId, @NotBlank String lessonId) {}

    public record QuizCompletionReq(
            @NotBlank String quizId,
            @NotEmpty List<@NotNull @Min(0) @Max(3) Integer> answers
    ) {}

    private final MarkService marks;
    private final AnalyticsService analytics;
    private final MentorAgent agent;
    private final MessageRepo messages;
    private final StudentService students;
    private final StudentProgressionService progression;

    public ApiController(
            MarkService marks,
            AnalyticsService analytics,
            MentorAgent agent,
            MessageRepo messages,
            StudentService students,
            StudentProgressionService progression
    ) {
        this.marks = marks;
        this.analytics = analytics;
        this.agent = agent;
        this.messages = messages;
        this.students = students;
        this.progression = progression;
    }

    @PostMapping("/students")
    @ResponseStatus(HttpStatus.CREATED)
    public Student createStudent(@RequestBody @Valid StudentReq r) {
        return students.createProfile(r.name(), r.email());
    }

    @GetMapping("/students/{id}")
    public Student studentProfile(@PathVariable Long id) {
        return students.getProfile(id);
    }

    @PutMapping("/students/{id}")
    public Student updateStudentProfile(
            @PathVariable Long id,
            @RequestBody @Valid StudentProfileReq request
    ) {
        return students.updateProfile(id, request.name(), request.email());
    }

    @DeleteMapping("/students/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteStudent(@PathVariable Long id) {
        students.deleteAccount(id);
    }

    @PostMapping("/students/{id}/marks")
    @ResponseStatus(HttpStatus.CREATED)
    public Mark addMark(@PathVariable Long id, @RequestBody @Valid MarkReq r) {
        return marks.addMark(
                id, r.subject(), r.topic(), r.score(), r.maxScore(), r.takenOn()
        );
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

    @GetMapping("/students/{id}/progression")
    public StudentProgressionService.Progression progression(@PathVariable Long id) {
        return progression.getProgression(id);
    }

    @PostMapping("/students/{id}/progression/lessons")
    public StudentProgressionService.EventResult completeLesson(
            @PathVariable Long id, @RequestBody @Valid LessonCompletionReq request
    ) {
        return progression.completeLesson(id, request.courseId(), request.lessonId());
    }

    @PostMapping("/students/{id}/progression/quizzes")
    public StudentProgressionService.EventResult completeQuiz(
            @PathVariable Long id, @RequestBody @Valid QuizCompletionReq request
    ) {
        return progression.completeQuiz(id, request.quizId(), request.answers());
    }

    @PostMapping("/students/{id}/progression/daily-mission")
    public StudentProgressionService.EventResult completeDailyMission(@PathVariable Long id) {
        return progression.completeDailyMission(id);
    }

    @PostMapping("/mentor/{id}/ask")
    public ResponseEntity<Map<String, String>> ask(
            @PathVariable String id,
            @RequestBody @Valid AskReq r
    ) {
        if (id == null || id.equalsIgnoreCase("null") || id.isBlank()) {
            return ResponseEntity.ok(Map.of(
                    "answer", "Please enter your name first to use Mentor."
            ));
        }

        Long studentId;

        try {
            studentId = Long.valueOf(id);
        } catch (NumberFormatException e) {
            return ResponseEntity.ok(Map.of(
                    "answer", "Please enter your name first to use Mentor."
            ));
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
                    .body(Map.of(
                            "error", "AI Mentor is temporarily unavailable. Please try again."
                    ));
        }

        messages.save(new MentorMessage(studentId, "student", r.question()));
        messages.save(new MentorMessage(studentId, "mentor", answer));

        return ResponseEntity.ok(Map.of("answer", answer));
    }

    @GetMapping("/mentor/{id}/history")
    public List<MentorMessage> history(@PathVariable Long id) {
        return messages.findTop10ByStudentIdOrderByCreatedAtDescIdDesc(id);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public Map<String, String> notFound(IllegalArgumentException e) {
        String message = e.getMessage();

        return Map.of(
                "error",
                message == null || message.isBlank()
                        ? "Resource not found."
                        : message
        );
    }

    @ExceptionHandler(DuplicateStudentEmailException.class)
    public ResponseEntity<Map<String, String>> duplicateStudentEmail(DuplicateStudentEmailException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
    }

    @ExceptionHandler(InvalidStudentProfileException.class)
    public ResponseEntity<Map<String, String>> invalidStudentProfile(InvalidStudentProfileException e) {
        return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }

    @ExceptionHandler(InvalidProgressionEventException.class)
    public ResponseEntity<Map<String, String>> invalidProgressionEvent(InvalidProgressionEventException e) {
        return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }
}
