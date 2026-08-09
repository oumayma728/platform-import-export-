package com.commercial.Pont.Commercial.models;

import com.commercial.Pont.Commercial.enums.AuthProvider;
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


    @Column(unique = true)
    private String email;

    private String passwordHash;

    private String nom;

    private String prenom;

    private String telephone;

    private String fonction;

    @Enumerated(EnumType.STRING)
    private ValidationStatus validationStatus;

    private Integer nombreChatsUtilises ;

    private Integer maxMessagesPossible;

    private String photoProfile;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @Column(unique = true)
    private String googleId;

    @Enumerated(EnumType.STRING)
    private AuthProvider authProvider;



    @OneToMany(mappedBy = "utilisateur")
    private List<Subscription> subscriptions;

    @OneToMany(mappedBy = "utilisateur")
    private List<Message> messages;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entrepriseId")
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
    private Set<RoleUtilisateur> roles;

}