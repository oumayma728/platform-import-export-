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

    @Column(columnDefinition = "TEXT")
    private String contenu;

    private Boolean estLu = false;

    private LocalDateTime dateEnvoi;

    private LocalDateTime dateLecture;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;



    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversationId")
    private Conversation conversation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expediteurId")
    private Utilisateur utilisateur;
}