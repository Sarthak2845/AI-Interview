package com.example.ecommerce.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.ecommerce.entity.InterviewSession;


@Repository
public interface InterviewSessionRepository extends JpaRepository<InterviewSession, Long> {
}