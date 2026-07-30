package com.commercial.Pont.Commercial.models;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Entreprise {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID entrepriseId;



    @Column(nullable = false, length = 200)
    private String nom;

    @Column(length = 50)
    private String siret;

    private String numeroTva;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String siteWeb;

    @Column(length = 255)
    private String logo;

    private Integer anneeCreation;

    private Double capitalSocial;

    private Double chiffreAffaires;

    private Integer nombreEmployes;

    private String secteurActivite;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "entreprise")
    private List<Utilisateur> utilisateurs;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "locationId", nullable = false)
    private Location location;
}