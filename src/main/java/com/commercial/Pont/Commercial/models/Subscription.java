package com.commercial.Pont.Commercial.models;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Subscription {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID subscriptionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "utilisateurId", nullable = false)
    private Utilisateur utilisateur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "abonnementId", nullable = false)
    private Abonnement abonnement;

    private LocalDateTime dateDebut;

    private LocalDateTime dateFin;

    private String stripePaymentIntentId;

    @OneToOne(mappedBy = "subscription", fetch = FetchType.LAZY)
    private Facturation facturation;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paiementId", nullable = false)
    private Paiement paiement;
}