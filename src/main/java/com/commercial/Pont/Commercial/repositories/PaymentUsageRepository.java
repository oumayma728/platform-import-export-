package com.commercial.Pont.Commercial.repositories;

import com.commercial.Pont.Commercial.models.Incoterm;
import com.commercial.Pont.Commercial.models.PaymentUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentUsageRepository extends JpaRepository<PaymentUsage, UUID> {
    List<PaymentUsage> findByUtilisateurUtilisateurId(UUID utilisateurId);
    Optional<PaymentUsage> findByStripePaymentIntentId(String stripePaymentIntentId);
}