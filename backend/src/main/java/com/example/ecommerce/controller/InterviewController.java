package com.example.ecommerce.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.example.ecommerce.service.InterviewService;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173")
public class InterviewController {

    private static final Logger logger = LoggerFactory.getLogger(InterviewController.class);

    @Autowired
    private InterviewService interviewService;

    @PostMapping(value = "/upload-resume", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> uploadResume(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "difficulty", defaultValue = "medium") String difficulty,
            @RequestParam(value = "numQuestions", defaultValue = "10") int numQuestions) {
        
        logger.info("Received resume upload request - File: {}, Size: {} bytes, Difficulty: {}, Questions: {}", 
                   file.getOriginalFilename(), file.getSize(), difficulty, numQuestions);
        
        try {
            Map<String, Object> result = interviewService.processResumeAndGenerateQuestions(file, difficulty, numQuestions);
            
            if (Boolean.TRUE.equals(result.get("success"))) {
                logger.info("Resume processing successful for file: {}", file.getOriginalFilename());
                return ResponseEntity.ok(result);
            } else {
                logger.error("Resume processing failed: {}", result.get("error"));
                return ResponseEntity.badRequest().body(result);
            }
            
        } catch (Exception e) {
            logger.error("Unexpected error in upload endpoint", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "error", "Internal server error: " + e.getMessage()
            ));
        }
    }

    @PostMapping("/submit-answer")
    public ResponseEntity<Map<String, Object>> submitAnswer(@RequestBody Map<String, Object> request) {
        logger.info("Received answer submission: {}", request);
        
        try {
            Long sessionId = Long.valueOf(request.get("sessionId").toString());
            int questionIndex = (Integer) request.get("questionIndex");
            String answerText = (String) request.get("answer");
            
            // Optional fields
            Long timeSpent = request.containsKey("timeSpent") ? 
                Long.valueOf(request.get("timeSpent").toString()) : null;
            Integer wordCount = request.containsKey("wordCount") ? 
                (Integer) request.get("wordCount") : null;
            Boolean isAutoSave = request.containsKey("isAutoSave") ? 
                (Boolean) request.get("isAutoSave") : false;
            
            Map<String, Object> result = interviewService.submitAnswer(
                sessionId, questionIndex, answerText, timeSpent, wordCount, isAutoSave);
            
            if (Boolean.TRUE.equals(result.get("success"))) {
                logger.info("Answer submitted successfully - AutoSave: {}", isAutoSave);
                return ResponseEntity.ok(result);
            } else {
                logger.error("Answer submission failed: {}", result.get("error"));
                return ResponseEntity.badRequest().body(result);
            }
            
        } catch (Exception e) {
            logger.error("Error in submit answer endpoint", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "error", "Failed to submit answer: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/session/{sessionId}")
    public ResponseEntity<Map<String, Object>> getSession(@PathVariable Long sessionId) {
        logger.info("Getting session details for ID: {}", sessionId);
        
        try {
            Map<String, Object> result = interviewService.getSessionDetails(sessionId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("Error getting session details", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "error", "Failed to get session: " + e.getMessage()
            ));
        }
    }
    
    @GetMapping("/session/{sessionId}/qa")
    public ResponseEntity<Map<String, Object>> getSessionQuestionsAndAnswers(@PathVariable Long sessionId) {
        logger.info("Getting questions and answers for session ID: {}", sessionId);
        
        try {
            Map<String, Object> result = interviewService.getSessionQuestionsAndAnswers(sessionId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("Error getting session Q&A", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "error", "Failed to get session Q&A: " + e.getMessage()
            ));
        }
    }
    
    @GetMapping("/sessions/all")
    public ResponseEntity<Map<String, Object>> getAllSessions() {
        logger.info("Getting all interview sessions");
        
        try {
            Map<String, Object> result = interviewService.getAllSessions();
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("Error getting all sessions", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "error", "Failed to get sessions: " + e.getMessage()
            ));
        }
    }
    
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        logger.info("Health check requested");
        return ResponseEntity.ok(Map.of(
            "status", "healthy",
            "service", "Jankoti Backend",
            "timestamp", System.currentTimeMillis()
        ));
    }
    
    @GetMapping("/test-routes")
    public ResponseEntity<Map<String, Object>> testRoutes() {
        logger.info("Testing routes");
        return ResponseEntity.ok(Map.of(
            "message", "Routes are working",
            "availableRoutes", List.of(
                "GET /api/sessions/all",
                "GET /api/session/{id}/qa",
                "GET /api/session/{id}",
                "POST /api/upload-resume",
                "POST /api/submit-answer"
            )
        ));
    }
}