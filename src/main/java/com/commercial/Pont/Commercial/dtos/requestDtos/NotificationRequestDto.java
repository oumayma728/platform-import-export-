package com.commercial.Pont.Commercial.dtos.requestDtos;

import com.commercial.Pont.Commercial.enums.NotificationStatus;
import com.commercial.Pont.Commercial.enums.NotificationType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationRequestDto {

    private UUID utilisateurId;

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