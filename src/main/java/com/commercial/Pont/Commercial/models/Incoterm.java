package com.commercial.Pont.Commercial.models;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Incoterm {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID incotermId;

    private String code;

    private String nom;

    @Column(columnDefinition = "TEXT")
    private String description;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "incoterm")
    private Set<IncotermAnnonce> incoterms;
}