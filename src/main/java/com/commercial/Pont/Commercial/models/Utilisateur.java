package com.commercial.Pont.Commercial.models;

import com.commercial.Pont.Commercial.enums.ValidationStatus;
import jakarta.persistence.*;
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
public class Utilisateur {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID utilisateurId;


    @Column(nullable = false, unique = true, length = 255)
    private String email;

    private String passwordHash;

    private String nom;

    @Column(nullable = false, length = 100)
    private String prenom;

    @Column(length = 20)
    private String telephone;

    @Column(length = 100)
    private String fonction;

    @Enumerated(EnumType.STRING)
    private ValidationStatus validationStatus;

    private Integer nombreChatsUtilises = 0;

    private Integer maxMessagesPossible;

    private String photoProfile;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;



    @OneToMany(mappedBy = "utilisateur")
    private List<Subscription> subscriptions;

    @OneToMany(mappedBy = "utilisateur")
    private List<Message> messages;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "entrepriseId", nullable = false)
    private Entreprise entreprise;

    @OneToMany(mappedBy = "vendeur")
    private List<Conversation> conversationsCommeVendeur;

    @OneToMany(mappedBy = "acheteur")
    private List<Conversation> conversationsCommeAcheteur;


    @OneToMany(mappedBy = "utilisateur")
    private List<Annonce> annonces;


    @OneToMany(mappedBy = "expediteur")
    private List<DocumentConversation> documentConversations;

    @OneToMany(mappedBy = "utilisateur")
    private List<Notification> notifications;

    @OneToMany(mappedBy = "utilisateur")
    private Set<RoleUtilisateur> utilisateurs;

}