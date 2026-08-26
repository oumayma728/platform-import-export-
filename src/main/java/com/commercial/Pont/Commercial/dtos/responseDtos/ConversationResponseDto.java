package com.commercial.Pont.Commercial.dtos.responseDtos;

import com.commercial.Pont.Commercial.enums.ConversationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationResponseDto {

    private UUID initiateurId;
    private UUID destinataireId;
    private UUID annonceId;

    private UUID conversationId;
    private ConversationStatus statut;
    private LocalDateTime dateDernierMessage;
    private Integer nombreMessages;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;


    private List<UUID> messagesIds;
    private List<UUID> documentConversationsIds;

}