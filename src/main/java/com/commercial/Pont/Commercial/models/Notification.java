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


    private String titre;

    @Column(columnDefinition = "TEXT")
    private String contenu;

    @Enumerated(EnumType.STRING)
    private NotificationType typeNotification;

    @Enumerated(EnumType.STRING)
    private NotificationStatus statut;

    private String emailDestinataire;

    private String telephoneDestinataire;

    private LocalDateTime dateEnvoi;

    private LocalDateTime dateLecture;

    private Integer tentativesEnvoi = 0;

    private Boolean estLu = false;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "utilisateurId")
    private Utilisateur utilisateur;



}