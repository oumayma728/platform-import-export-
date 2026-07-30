package com.commercial.Pont.Commercial.models;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentAnnonce {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID documentAnnonceId;


    private String nomFichier;

    private String cheminFichier;

    private String extension;

    private Long taille;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;


    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "annonceId", nullable = false)
    private Annonce  annonce;
}