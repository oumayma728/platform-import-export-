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
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID messageId;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String contenu;

    private Boolean estLu = false;

    private LocalDateTime dateEnvoi;

    private LocalDateTime dateLecture;

    @Column(name = "prix_message")
    private Integer prixMessage;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;



    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "conversationId", nullable = false)
    private Conversation conversation;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "expediteurId", nullable = false)
    private Utilisateur utilisateur;
}