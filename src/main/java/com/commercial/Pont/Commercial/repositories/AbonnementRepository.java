package com.commercial.Pont.Commercial.repositories;

import com.commercial.Pont.Commercial.enums.AbonnementStatus;
import com.commercial.Pont.Commercial.models.Abonnement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AbonnementRepository extends JpaRepository<Abonnement, UUID> {
    List<Abonnement> findByStatut(AbonnementStatus statut);

}



