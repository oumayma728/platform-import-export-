package com.commercial.Pont.Commercial.models;

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
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID notificationId;


    @Column(nullable = false, length = 255)
    private String titre;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String contenu;

    @Enumerated(EnumType.STRING)
    private NotificationType typeNotification;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationStatus statut;

    private String emailDestinataire;

    private String telephoneDestinataire;

    private LocalDateTime dateEnvoi;

    private LocalDateTime dateLecture;

    private Integer tentativesEnvoi = 0;

    private Boolean estLu = false;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "utilisateurId", nullable = false)
    private Utilisateur utilisateur;



}