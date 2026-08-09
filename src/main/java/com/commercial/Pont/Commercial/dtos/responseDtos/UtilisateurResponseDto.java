package com.commercial.Pont.Commercial.dtos.responseDtos;

import com.commercial.Pont.Commercial.enums.AuthProvider;
import com.commercial.Pont.Commercial.enums.ValidationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UtilisateurResponseDto {

    private UUID entrepriseId;

    private UUID utilisateurId;
    private String email;
    private String nom;
    private String prenom;
    private String telephone;
    private String fonction;
    private ValidationStatus validationStatus;
    private Integer nombreChatsUtilises;
    private Integer maxMessagesPossible;
    private String photoProfile;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private List<UUID> subscriptionsIds;
    private List<UUID> messageIds;
    private List<UUID> conversationsCommeVendeurIds;
    private List<UUID> conversationsCommeAcheteurIds;
    private List<UUID> annoncesIds;
    private List<UUID> documentConversationsIds;
    private List<UUID> notificationsIds;
    private Set<UUID> utilisateurRoleIds;

    private AuthProvider authProvider;

    private Set<UUID> roleIds;
    private Set<String> roleNames;


}