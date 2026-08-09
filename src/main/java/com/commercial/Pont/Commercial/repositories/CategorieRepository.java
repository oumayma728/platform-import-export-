package com.commercial.Pont.Commercial.repositories;

import com.commercial.Pont.Commercial.models.Categorie;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CategorieRepository extends JpaRepository<Categorie, UUID> {
}

