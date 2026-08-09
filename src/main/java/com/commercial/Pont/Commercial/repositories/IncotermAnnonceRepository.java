package com.commercial.Pont.Commercial.repositories;

import com.commercial.Pont.Commercial.models.IncotermAnnonce;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface IncotermAnnonceRepository extends JpaRepository<IncotermAnnonce, UUID> {
}
