package com.commercial.Pont.Commercial.models;

import com.commercial.Pont.Commercial.enums.ConversationStatus;
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
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID conversationId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ConversationStatus statut;

    private LocalDateTime dateDernierMessage;

    private Integer nombreMessages;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "conversation", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Message> messages;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vendeurId", nullable = false)
    private Utilisateur vendeur;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "acheteurId", nullable = false)
    private Utilisateur acheteur;


    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "annonceId", nullable = true)
    private Annonce annonce;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "facturationId", nullable = true, unique = true)
    private Facturation facturation;

    @OneToMany(mappedBy = "conversation", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DocumentConversation> documentConversations;
}