package com.commercial.Pont.Commercial.dtos.requestDtos;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DocumentConversationAssignRequestDto {

    private UUID documentConversationId;

    private UUID conversationId;

    private UUID utilisateurId;
}
