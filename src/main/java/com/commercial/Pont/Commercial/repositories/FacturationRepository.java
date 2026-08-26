package com.commercial.Pont.Commercial.repositories;

import com.commercial.Pont.Commercial.enums.FacturationType;
import com.commercial.Pont.Commercial.models.Facturation;
import com.commercial.Pont.Commercial.models.Subscription;
import com.commercial.Pont.Commercial.models.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface FacturationRepository extends JpaRepository<Facturation, UUID> {
    Optional<Facturation> findFirstByUtilisateurOrderByCreatedAtDesc(
            Utilisateur utilisateur
    );

    Optional<Facturation> findBySubscription(Subscription subscription);

    Optional<Facturation> findFirstByUtilisateurUtilisateurIdAndTypeNotOrderByCreatedAtDesc(
            UUID utilisateurId,
            FacturationType type
    );
}
