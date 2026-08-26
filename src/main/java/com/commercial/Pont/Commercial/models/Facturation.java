package com.commercial.Pont.Commercial.models;

import com.commercial.Pont.Commercial.enums.FacturationStatus;
import com.commercial.Pont.Commercial.enums.FacturationType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Facturation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID facturationId;

    private String numeroFacture;

    private Integer tva;

    @Enumerated(EnumType.STRING)
    private FacturationStatus statut;

    @Enumerated(EnumType.STRING)
    private FacturationType type;

    private String methodePaiement;

    private BigDecimal prixFacturation;


    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "utilisateurId", nullable = false)
    private Utilisateur utilisateur;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subscriptionId")
    private Subscription subscription;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paymentUsageId", unique = true)
    private PaymentUsage paymentUsage;



}