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
    private ConversationStatus statut;

    private LocalDateTime dateDernierMessage;

    private Integer nombreMessages;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "conversation", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Message> messages;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "initiateurId")
    private Utilisateur initiateur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "destinataireId")
    private Utilisateur destinataire;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "annonceId")
    private Annonce annonce;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "facturationId")
    private Facturation facturation;

    @OneToMany(mappedBy = "conversation", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DocumentConversation> documentConversations;
}