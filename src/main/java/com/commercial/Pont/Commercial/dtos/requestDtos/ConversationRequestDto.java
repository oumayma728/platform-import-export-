package com.commercial.Pont.Commercial.dtos.requestDtos;

import com.commercial.Pont.Commercial.enums.ConversationStatus;
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

    private UUID vendeurId;
    private UUID acheteurId;
    private UUID annonceId;
    private UUID facturationId;

    private ConversationStatus statut;
    private LocalDateTime dateDernierMessage;
    private Integer nombreMessages;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private List<UUID> messagesIds;
    private List<UUID> documentConversationsIds;

}