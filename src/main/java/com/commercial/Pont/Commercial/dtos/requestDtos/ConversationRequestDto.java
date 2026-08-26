package com.commercial.Pont.Commercial.dtos.requestDtos;

import com.commercial.Pont.Commercial.enums.ConversationStatus;
import com.commercial.Pont.Commercial.models.Facturation;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationRequestDto {

    private UUID initiateurId;
    private UUID destinataireId;
    private UUID annonceId;


    private ConversationStatus statut;
    private LocalDateTime dateDernierMessage;

    private List<UUID> messagesIds;
    private List<UUID> documentConversationsIds;

}