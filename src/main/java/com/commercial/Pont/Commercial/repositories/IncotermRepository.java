package com.commercial.Pont.Commercial.repositories;

import com.commercial.Pont.Commercial.models.Incoterm;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface IncotermRepository extends JpaRepository<Incoterm, UUID> {
    Optional<Incoterm> findByCode(String code);
}
