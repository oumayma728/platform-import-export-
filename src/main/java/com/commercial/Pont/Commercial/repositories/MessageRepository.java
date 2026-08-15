package com.commercial.Pont.Commercial.repositories;

import com.commercial.Pont.Commercial.models.Conversation;
import com.commercial.Pont.Commercial.models.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {

    List<Message> findByConversation_ConversationIdOrderByDateEnvoiAsc(
            UUID conversationId
    );


    List<Message>  findByConversationOrderByDateEnvoiAsc(
            Conversation conversation
    );
}
