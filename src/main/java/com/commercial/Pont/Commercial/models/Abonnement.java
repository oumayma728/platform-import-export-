package com.commercial.Pont.Commercial.models;


import com.commercial.Pont.Commercial.enums.AbonnementStatus;
import com.commercial.Pont.Commercial.enums.AbonnementType;
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
public class Abonnement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID abonnementId;

    private String nom;

    @Enumerated(EnumType.STRING)
    private AbonnementType typeAbonnement;

    private Integer dureeEnMois;

    private BigDecimal montant;

    @Column(nullable = false)
    private String devise;

    @Enumerated(EnumType.STRING)
    private AbonnementStatus statut;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "abonnement")
    private List<Subscription> subscriptions;
}