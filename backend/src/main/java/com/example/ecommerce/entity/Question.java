package com.example.ecommerce.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "QUESTIONS")
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "question_seq")
    @SequenceGenerator(name = "question_seq", sequenceName = "QUESTION_SEQ", allocationSize = 1)
    private Long id;

    private String questionText;

    @ManyToOne
    @JoinColumn(name = "session_id")
    private InterviewSession interviewSession;

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public String getQuestionText() {
        return questionText;
    }

    public void setQuestionText(String questionText) {
        this.questionText = questionText;
    }

    public InterviewSession getInterviewSession() {
        return interviewSession;
    }

    public void setInterviewSession(InterviewSession interviewSession) {
        this.interviewSession = interviewSession;
    }
}