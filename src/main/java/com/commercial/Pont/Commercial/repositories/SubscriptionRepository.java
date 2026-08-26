package com.commercial.Pont.Commercial.repositories;

import com.commercial.Pont.Commercial.models.Paiement;
import com.commercial.Pont.Commercial.models.Subscription;
import com.commercial.Pont.Commercial.models.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, UUID> {
    Optional<Subscription>  findFirstByUtilisateurAndDateFinAfterOrderByDateFinDesc(
            Utilisateur utilisateur,
            LocalDateTime date
    );


    Optional<Subscription> findFirstByUtilisateurOrderByDateFinDesc(
            Utilisateur utilisateur
    );

    Optional<Subscription> findByPaiement(Paiement paiement);

}
