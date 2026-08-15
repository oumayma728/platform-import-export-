package com.commercial.Pont.Commercial.repositories;

import com.commercial.Pont.Commercial.models.Entreprise;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface EntrepriseRepository extends JpaRepository<Entreprise, UUID> {
    Optional<Entreprise> findByNom(String nom);
}
