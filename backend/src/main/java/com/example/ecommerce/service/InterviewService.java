package com.example.ecommerce.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import com.example.ecommerce.entity.Answer;
import com.example.ecommerce.entity.InterviewSession;
import com.example.ecommerce.entity.Question;
import com.example.ecommerce.repository.AnswerRepository;
import com.example.ecommerce.repository.InterviewSessionRepository;
import com.example.ecommerce.repository.QuestionRepository;

import java.time.Duration;
import java.util.*;

@Service
public class InterviewService {

    private static final Logger logger = LoggerFactory.getLogger(InterviewService.class);

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private AnswerRepository answerRepository;

    @Autowired
    private InterviewSessionRepository interviewSessionRepository;

    private final WebClient webClient;
    private final String PYTHON_SERVICE_URL = "http://localhost:8000";

    public InterviewService() {
        this.webClient = WebClient.builder()
                .baseUrl(PYTHON_SERVICE_URL)
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(10 * 1024 * 1024))
                .build();
    }

    public Map<String, Object> processResumeAndGenerateQuestions(MultipartFile file, String difficulty, int numQuestions) {
        logger.info("Starting resume processing for file: {}, difficulty: {}, questions: {}", 
                   file.getOriginalFilename(), difficulty, numQuestions);
        
        try {
            // Validate file
            if (file.isEmpty()) {
                logger.error("Uploaded file is empty");
                return createErrorResponse("File is empty");
            }
            
            if (file.getSize() > 10 * 1024 * 1024) {
                logger.error("File size too large: {} bytes", file.getSize());
                return createErrorResponse("File size must be less than 10MB");
            }

            logger.info("File validation passed. Size: {} bytes", file.getSize());

            // Test Python service connectivity
            try {
                logger.info("Testing Python service connectivity...");
                Map<String, Object> healthCheck = webClient.get()
                        .uri("/health")
                        .retrieve()
                        .bodyToMono(Map.class)
                        .timeout(Duration.ofSeconds(5))
                        .block();
                logger.info("Python service health check: {}", healthCheck);
            } catch (Exception e) {
                logger.error("Python service is not available: {}", e.getMessage());
                return createErrorResponse("AI service is currently unavailable. Please try again later.");
            }

            // Create multipart form data for Python service
            MultiValueMap<String, Object> formData = new LinkedMultiValueMap<>();
            formData.add("file", new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename();
                }
            });
            formData.add("difficulty", difficulty);
            formData.add("num_questions", numQuestions);

            logger.info("Sending request to Python service...");
            
            // Call Python service
            Map<String, Object> pythonResponse = webClient.post()
                    .uri("/generate-questions")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(BodyInserters.fromMultipartData(formData))
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(Duration.ofSeconds(30))
                    .block();

            logger.info("Python service response received: {}", pythonResponse != null ? "Success" : "Null");

            if (pythonResponse != null && Boolean.TRUE.equals(pythonResponse.get("success"))) {
                logger.info("Python service processed successfully");
                
                // Create interview session
                InterviewSession session = new InterviewSession();
                session.setResumeText(file.getOriginalFilename());
                session.setStatus("ACTIVE");
                session = interviewSessionRepository.save(session);
                
                logger.info("Created interview session with ID: {}", session.getId());

                // Save questions - handle both List<Map> and List<String> formats
                Object questionsObj = pythonResponse.get("questions");
                List<Question> savedQuestions = new ArrayList<>();
                List<Map<String, Object>> questionsList = new ArrayList<>();
                
                if (questionsObj instanceof List) {
                    List<?> rawQuestions = (List<?>) questionsObj;
                    
                    for (int i = 0; i < rawQuestions.size(); i++) {
                        Object item = rawQuestions.get(i);
                        String questionText;
                        
                        if (item instanceof Map) {
                            // Format: {"question": "text"}
                            Map<?, ?> questionMap = (Map<?, ?>) item;
                            questionText = (String) questionMap.get("question");
                        } else if (item instanceof String) {
                            // Format: "question text"
                            questionText = (String) item;
                        } else {
                            logger.warn("Unexpected question format at index {}: {}", i, item);
                            continue;
                        }
                        
                        if (questionText != null && !questionText.trim().isEmpty()) {
                            Question question = new Question();
                            question.setQuestionText(questionText);
                            question.setInterviewSession(session);
                            savedQuestions.add(questionRepository.save(question));
                            
                            // Add to response format
                            Map<String, Object> questionMap = new HashMap<>();
                            questionMap.put("question", questionText);
                            questionsList.add(questionMap);
                        }
                    }
                }
                
                logger.info("Saved {} questions to database", savedQuestions.size());

                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("sessionId", session.getId());
                response.put("questions", questionsList);
                response.put("difficulty", difficulty);
                response.put("totalQuestions", questionsList.size());
                
                logger.info("Resume processing completed successfully");
                return response;
            } else {
                String error = pythonResponse != null ? (String) pythonResponse.get("error") : "Unknown error";
                logger.error("Python service returned error: {}", error);
                return createErrorResponse("Failed to generate questions: " + error);
            }
            
        } catch (WebClientResponseException e) {
            logger.error("Python service HTTP error: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            return createErrorResponse("AI service error: " + e.getMessage());
        } catch (Exception e) {
            logger.error("Unexpected error during resume processing", e);
            return createErrorResponse("An unexpected error occurred: " + e.getMessage());
        }
    }

    public Map<String, Object> submitAnswer(Long sessionId, int questionIndex, String answerText, Long timeSpent, Integer wordCount, Boolean isAutoSave) {
        logger.info("Submitting answer for session: {}, question: {}, autoSave: {}", sessionId, questionIndex, isAutoSave);
        
        try {
            InterviewSession session = interviewSessionRepository.findById(sessionId)
                    .orElseThrow(() -> new RuntimeException("Session not found with ID: " + sessionId));
            
            List<Question> questions = questionRepository.findByInterviewSession(session);
            if (questionIndex >= questions.size()) {
                logger.error("Invalid question index: {} for session with {} questions", questionIndex, questions.size());
                return createErrorResponse("Invalid question index");
            }
            
            Question question = questions.get(questionIndex);
            
            // Check if answer already exists (for updates)
            List<Answer> existingAnswers = answerRepository.findByQuestion(question);
            Answer answer;
            
            if (!existingAnswers.isEmpty()) {
                // Update existing answer
                answer = existingAnswers.get(0);
                answer.setAnswerText(answerText);
            } else {
                // Create new answer
                answer = new Answer();
                answer.setAnswerText(answerText);
                answer.setScore(0);
                answer.setQuestion(question);
            }
            
            answerRepository.save(answer);
            
            logger.info("Answer {} successfully for question index: {}", 
                       existingAnswers.isEmpty() ? "submitted" : "updated", questionIndex);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", isAutoSave ? "Answer auto-saved successfully" : "Answer submitted successfully");
            response.put("questionIndex", questionIndex);
            response.put("isAutoSave", isAutoSave);
            
            if (timeSpent != null) {
                response.put("timeSpent", timeSpent);
            }
            if (wordCount != null) {
                response.put("wordCount", wordCount);
            }
            
            return response;
            
        } catch (Exception e) {
            logger.error("Error submitting answer", e);
            return createErrorResponse("Failed to submit answer: " + e.getMessage());
        }
    }

    public Map<String, Object> getSessionDetails(Long sessionId) {
        logger.info("Getting session details for ID: {}", sessionId);
        
        try {
            InterviewSession session = interviewSessionRepository.findById(sessionId)
                    .orElseThrow(() -> new RuntimeException("Session not found with ID: " + sessionId));
            
            List<Question> questions = questionRepository.findByInterviewSession(session);
            List<Answer> answers = new ArrayList<>();
            
            for (Question q : questions) {
                answers.addAll(answerRepository.findByQuestion(q));
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("sessionId", session.getId());
            response.put("status", session.getStatus());
            response.put("totalQuestions", questions.size());
            response.put("answeredQuestions", answers.size());
            
            logger.info("Session details retrieved successfully");
            return response;
            
        } catch (Exception e) {
            logger.error("Error getting session details", e);
            return createErrorResponse("Failed to get session details: " + e.getMessage());
        }
    }
    
    public Map<String, Object> getSessionQuestionsAndAnswers(Long sessionId) {
        logger.info("Getting questions and answers for session ID: {}", sessionId);
        
        try {
            InterviewSession session = interviewSessionRepository.findById(sessionId)
                    .orElseThrow(() -> new RuntimeException("Session not found with ID: " + sessionId));
            
            List<Question> questions = questionRepository.findByInterviewSession(session);
            List<Map<String, Object>> qaList = new ArrayList<>();
            
            for (int i = 0; i < questions.size(); i++) {
                Question question = questions.get(i);
                List<Answer> answers = answerRepository.findByQuestion(question);
                
                Map<String, Object> qaItem = new HashMap<>();
                qaItem.put("questionIndex", i + 1);
                qaItem.put("questionText", question.getQuestionText());
                qaItem.put("questionId", question.getId());
                
                if (!answers.isEmpty()) {
                    Answer answer = answers.get(0); // Get the latest answer
                    qaItem.put("answerText", answer.getAnswerText());
                    qaItem.put("answerId", answer.getId());
                    qaItem.put("answerScore", answer.getScore());
                    qaItem.put("hasAnswer", true);
                } else {
                    qaItem.put("answerText", null);
                    qaItem.put("answerId", null);
                    qaItem.put("answerScore", null);
                    qaItem.put("hasAnswer", false);
                }
                
                qaList.add(qaItem);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("sessionId", session.getId());
            response.put("resumeText", session.getResumeText());
            response.put("status", session.getStatus());
            response.put("totalQuestions", questions.size());
            response.put("answeredQuestions", qaList.stream().mapToInt(qa -> (Boolean) qa.get("hasAnswer") ? 1 : 0).sum());
            response.put("questionsAndAnswers", qaList);
            response.put("createdAt", session.getCreatedAt());
            
            logger.info("Questions and answers retrieved successfully for session: {}", sessionId);
            return response;
            
        } catch (Exception e) {
            logger.error("Error getting session Q&A", e);
            return createErrorResponse("Failed to get session Q&A: " + e.getMessage());
        }
    }
    
    public Map<String, Object> getAllSessions() {
        logger.info("Getting all interview sessions");
        
        try {
            List<InterviewSession> sessions = interviewSessionRepository.findAll();
            List<Map<String, Object>> sessionList = new ArrayList<>();
            
            for (InterviewSession session : sessions) {
                List<Question> questions = questionRepository.findByInterviewSession(session);
                int totalQuestions = questions.size();
                int answeredQuestions = 0;
                
                for (Question q : questions) {
                    List<Answer> answers = answerRepository.findByQuestion(q);
                    if (!answers.isEmpty()) {
                        answeredQuestions++;
                    }
                }
                
                Map<String, Object> sessionInfo = new HashMap<>();
                sessionInfo.put("sessionId", session.getId());
                sessionInfo.put("resumeText", session.getResumeText());
                sessionInfo.put("status", session.getStatus());
                sessionInfo.put("totalQuestions", totalQuestions);
                sessionInfo.put("answeredQuestions", answeredQuestions);
                sessionInfo.put("completionPercentage", totalQuestions > 0 ? (answeredQuestions * 100 / totalQuestions) : 0);
                sessionInfo.put("createdAt", session.getCreatedAt());
                
                sessionList.add(sessionInfo);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("totalSessions", sessions.size());
            response.put("sessions", sessionList);
            
            logger.info("All sessions retrieved successfully. Total: {}", sessions.size());
            return response;
            
        } catch (Exception e) {
            logger.error("Error getting all sessions", e);
            return createErrorResponse("Failed to get sessions: " + e.getMessage());
        }
    }
    
    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("success", false);
        errorResponse.put("error", message);
        return errorResponse;
    }
}