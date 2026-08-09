package com.commercial.Pont.Commercial.repositories;

import com.commercial.Pont.Commercial.models.DocumentConversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface DocumentConversationRepository extends JpaRepository<DocumentConversation, UUID> {
}
