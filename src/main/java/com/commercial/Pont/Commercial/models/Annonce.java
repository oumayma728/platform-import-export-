package com.commercial.Pont.Commercial.models;

import com.commercial.Pont.Commercial.enums.AnnouncementStatus;
import com.commercial.Pont.Commercial.enums.AnnouncementType;
import jakarta.persistence.*;
import jdk.jshell.execution.Util;
import lombok.*;

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

    @Column(nullable = false)
    private String titre;

    @Column(length = 255)
    private String certification;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AnnouncementType type;

    private Double prix;

    @Column(length = 5)
    private String devise;

    private Double quantite;

    @Column(length = 20)
    private String uniteQuantite;

    private LocalDateTime dateLimite;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
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

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "categorieId", nullable = false)
    private Categorie categorie;


    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "utilisateurId", nullable = false)
    private Utilisateur utilisateur;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "locationOrigineId", nullable = false)
    private Location locationOrigine;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "locationDestinationId", nullable = false)
    private Location locationDestination;


    @OneToMany(mappedBy = "annonce")
    private Set<IncotermAnnonce> annonces;



}