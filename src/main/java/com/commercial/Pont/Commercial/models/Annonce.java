package com.commercial.Pont.Commercial.models;

import com.commercial.Pont.Commercial.enums.AnnouncementStatus;
import com.commercial.Pont.Commercial.enums.AnnouncementType;
import jakarta.persistence.*;
import jdk.jshell.execution.Util;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Annonce {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID annonceId;

    private String titre;

    private String certification;

    private String description;

    @Enumerated(EnumType.STRING)
    private AnnouncementType type;

    private BigDecimal prix;

    private String devise;

    private Double quantite;
    private String uniteQuantite;

    private LocalDateTime dateLimite;

    @Enumerated(EnumType.STRING)
    private AnnouncementStatus statut;

    private Integer dureeLivraison;

    private String uniteDureeLivraison;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private LocalDateTime publishedAt;


    @OneToMany(mappedBy = "annonce", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Conversation> conversations;

    @OneToMany(mappedBy = "annonce", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DocumentAnnonce> documentAnnonces;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categorieId")
    private Categorie categorie;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "utilisateurId")
    private Utilisateur utilisateur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "locationOrigineId")
    private Location locationOrigine;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "locationDestinationId")
    private Location locationDestination;


    @OneToMany(mappedBy = "annonce")
    private Set<IncotermAnnonce> annonces;

}