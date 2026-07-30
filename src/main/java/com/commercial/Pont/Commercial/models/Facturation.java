package com.commercial.Pont.Commercial.models;

import com.commercial.Pont.Commercial.enums.FacturationStatus;
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

    @Column(length = 50)
    private String numeroFacture;

    private Integer tva;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FacturationStatus statut;

    @Column(length = 50)
    private String methodePaiement;

    private Double prixFacturation;


    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;


    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "subscriptionId", nullable = true, unique = true)
    private Subscription subscription;


    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "conversationId", nullable = true, unique = true)
    private Conversation conversation;

    @OneToMany(mappedBy = "facturation")
    private List<Paiement> paiements;

}