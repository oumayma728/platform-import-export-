package com.commercial.Pont.Commercial.models;

import com.commercial.Pont.Commercial.enums.NotificationCanal;
import com.commercial.Pont.Commercial.enums.NotificationStatus;
import com.commercial.Pont.Commercial.enums.NotificationType;
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
@Table(name = "notification")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID notificationId;


    // ==========================================
    // CONTENU
    // ==========================================

    private String titre;

    @Column(columnDefinition = "TEXT")
    private String contenu;


    // ==========================================
    // TYPE EVENEMENT
    // ==========================================

    @Enumerated(EnumType.STRING)
    private NotificationType typeNotification;


    // ==========================================
    // CANAL
    // ==========================================

    @Enumerated(EnumType.STRING)
    private NotificationCanal canal;


    // ==========================================
    // STATUT
    // ==========================================

    @Enumerated(EnumType.STRING)
    private NotificationStatus statut;


    // ==========================================
    // DESTINATAIRE
    // ==========================================

    private String emailDestinataire;

    private String telephoneDestinataire;


    // ==========================================
    // ENVOI
    // ==========================================

    private LocalDateTime dateEnvoi;

    private LocalDateTime dateLecture;

    @Builder.Default
    private Integer tentativesEnvoi = 0;

    @Builder.Default
    private Boolean estLu = false;


    // ==========================================
    // ERREUR
    // ==========================================

    @Column(columnDefinition = "TEXT")
    private String messageErreur;


    // ==========================================
    // DATES
    // ==========================================

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;


    // ==========================================
    // UTILISATEUR
    // ==========================================

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "utilisateurId")
    private Utilisateur utilisateur;
}