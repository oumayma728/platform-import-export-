package com.commercial.Pont.Commercial.models;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;
import java.util.UUID;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Location {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID locationId;

    @Column(nullable = false, length = 100)
    private String pays;

    @Column(length = 100)
    private String ville;

    private String codePostal;

    @Column(columnDefinition = "TEXT")
    private String adresse;

    @Column(length = 100)
    private String region;

    @OneToMany(mappedBy = "locationOrigine", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Annonce> annoncesOrigines;

    @OneToMany(mappedBy = "locationDestination", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Annonce> annoncesDestinations;

    @OneToMany(mappedBy = "location", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Entreprise> entreprises;
}