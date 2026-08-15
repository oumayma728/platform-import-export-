package com.commercial.Pont.Commercial.dtos.requestDtos;

import com.commercial.Pont.Commercial.enums.ValidationStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UtilisateurRequestDto {

    private UUID entrepriseId;

    private String email;
    private String password;
    private String nom;
    private String prenom;
    private String telephone;
    private String fonction;
    private String photoProfile;


    private List<UUID> subscriptionsIds;
    private List<UUID> messageIds;
    private List<UUID> conversationsCommeInitiateurIds;
    private List<UUID> conversationsCommeDestinataireIds;
    private List<UUID> annoncesIds;
    private List<UUID> documentConversationsIds;
    private List<UUID> notificationsIds;
    private Set<UUID> utilisateurRoleIds;

}