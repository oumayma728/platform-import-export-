package com.commercial.Pont.Commercial.dtos.responseDtos;

import com.commercial.Pont.Commercial.enums.NotificationStatus;
import com.commercial.Pont.Commercial.enums.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponseDto {

    private UUID utilisateurId;

    private UUID notificationId;
    private String titre;
    private String contenu;
    private NotificationType typeNotification;
    private NotificationStatus statut;
    private String emailDestinataire;
    private String telephoneDestinataire;
    private LocalDateTime dateEnvoi;
    private LocalDateTime dateLecture;
    private Integer tentativesEnvoi = 0;
    private Boolean estLu = false;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

}