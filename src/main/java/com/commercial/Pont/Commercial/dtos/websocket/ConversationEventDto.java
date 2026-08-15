package com.commercial.Pont.Commercial.dtos.websocket;

import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConversationEventDto {

    private String type;

    private UUID conversationId;

    private Object data;
}