package com.commercial.Pont.Commercial.repositories;

import com.commercial.Pont.Commercial.models.Conversation;
import com.commercial.Pont.Commercial.models.Message;
import com.commercial.Pont.Commercial.models.Utilisateur;
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


    List<Message> findByConversation_ConversationIdAndEstLuTrueOrderByDateEnvoiAsc(
            UUID conversationId
    );

    List<Message> findByConversation_ConversationIdAndEstLuFalseOrderByDateEnvoiAsc(
            UUID conversationId
    );

    List<Message>  findByConversation_ConversationIdAndEstLuFalseAndUtilisateurNotOrderByDateEnvoiAsc(
            UUID conversationId,
            Utilisateur utilisateur
    );
}
