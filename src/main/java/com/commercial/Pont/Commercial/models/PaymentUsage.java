package com.commercial.Pont.Commercial.models;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID paymentUsageId;

    @Column(unique = true)
    private String stripePaymentIntentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "utilisateurId", nullable = false)
    private Utilisateur utilisateur;

    @Column(nullable = false)
    private Integer nombreMessagesAchetes;

    @Column(nullable = false)
    private BigDecimal montant;

    private String devise;

    private LocalDateTime dateAchat;

    private LocalDateTime dateExpiration;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @OneToOne(mappedBy = "paymentUsage", fetch = FetchType.LAZY)
    private Facturation facturation;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paiementId")
    private Paiement paiement;
}
