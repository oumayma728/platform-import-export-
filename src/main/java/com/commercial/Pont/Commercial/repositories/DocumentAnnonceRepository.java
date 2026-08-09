package com.commercial.Pont.Commercial.repositories;

import com.commercial.Pont.Commercial.models.DocumentAnnonce;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface DocumentAnnonceRepository extends JpaRepository<DocumentAnnonce, UUID> {
}
