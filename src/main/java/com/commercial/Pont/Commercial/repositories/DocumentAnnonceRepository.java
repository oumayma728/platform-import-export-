package com.commercial.Pont.Commercial.repositories;

import com.commercial.Pont.Commercial.models.DocumentAnnonce;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DocumentAnnonceRepository extends JpaRepository<DocumentAnnonce, UUID> {

    List<DocumentAnnonce> findByAnnonce_AnnonceId(UUID annonceId);
}
