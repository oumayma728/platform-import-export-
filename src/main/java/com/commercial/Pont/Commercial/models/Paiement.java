package com.commercial.Pont.Commercial.models;

import com.commercial.Pont.Commercial.enums.PaiementStatus;
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
public class Paiement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID paiementId;

    private Double montant;

    private String devise;

    private String stripePaymentIntentId;

    private String stripeChargeId;

    @Enumerated(EnumType.STRING)
    private PaiementStatus statutPaiement;

    private LocalDateTime datePaiement;

    private String messageErreur;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "facturationId")
    private Facturation facturation;

}