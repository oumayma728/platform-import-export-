package com.commercial.Pont.Commercial.repositories;

import com.commercial.Pont.Commercial.models.Annonce;
import com.commercial.Pont.Commercial.models.Conversation;
import com.commercial.Pont.Commercial.models.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, UUID> {
    Optional<Conversation>  findByInitiateurAndDestinataireAndAnnonce(
            Utilisateur initateur,
            Utilisateur destinataire,
            Annonce annonce
    );


    List<Conversation> findByInitiateurOrDestinataire(
            Utilisateur initiateur,
            Utilisateur destinataire
    );
}
