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
public class DocumentConversation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID documentConversationId;


    private String nomFichier;

    private String cheminFichier;

    private String extension;

    private Long taille;

    private Boolean estLu;

    private LocalDateTime dateLecture;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "utilisateurId")
    private Utilisateur expediteur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversationId")
    private Conversation conversation;
}