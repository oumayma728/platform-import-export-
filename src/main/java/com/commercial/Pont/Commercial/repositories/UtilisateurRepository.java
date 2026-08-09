package com.commercial.Pont.Commercial.repositories;

import com.commercial.Pont.Commercial.models.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UtilisateurRepository extends JpaRepository<Utilisateur, UUID> {

    Optional<Utilisateur> findByEmail(String email);

    boolean existsByEmail(String email);

    Optional<Utilisateur> findByGoogleId(String googleId);
}
