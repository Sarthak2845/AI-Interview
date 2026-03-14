package com.example.ecommerce.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.ecommerce.service.InterviewService;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/debug")
@CrossOrigin(origins = "http://localhost:5173")
public class DebugController {

    private static final Logger logger = LoggerFactory.getLogger(DebugController.class);

    @Autowired
    private InterviewService interviewService;

    @GetMapping("/sessions")
    public ResponseEntity<Map<String, Object>> getAllSessionsDebug() {
        logger.info("DEBUG: Getting all interview sessions");
        
        try {
            Map<String, Object> result = interviewService.getAllSessions();
            logger.info("DEBUG: Result: {}", result);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("DEBUG: Error getting all sessions", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "error", "Failed to get sessions: " + e.getMessage(),
                "stackTrace", e.getStackTrace()
            ));
        }
    }

    @GetMapping("/session/{sessionId}")
    public ResponseEntity<Map<String, Object>> getSessionQADebug(@PathVariable Long sessionId) {
        logger.info("DEBUG: Getting questions and answers for session ID: {}", sessionId);
        
        try {
            Map<String, Object> result = interviewService.getSessionQuestionsAndAnswers(sessionId);
            logger.info("DEBUG: Result: {}", result);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("DEBUG: Error getting session Q&A", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "error", "Failed to get session Q&A: " + e.getMessage(),
                "stackTrace", e.getStackTrace()
            ));
        }
    }

    @GetMapping("/test")
    public ResponseEntity<Map<String, Object>> test() {
        logger.info("DEBUG: Test endpoint called");
        return ResponseEntity.ok(Map.of(
            "message", "Debug controller is working",
            "timestamp", System.currentTimeMillis()
        ));
    }
}