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
public class IncotermAnnonce {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID incotermAnnonceId;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "incotermId")
    private Incoterm incoterm;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "annonceId")
    private Annonce annonce;
}