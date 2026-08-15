package com.commercial.Pont.Commercial.services.ServiceInterfaces;

import com.commercial.Pont.Commercial.dtos.requestDtos.ConversationRequestDto;
import com.commercial.Pont.Commercial.dtos.requestDtos.CreateConversationRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.ConversationResponseDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.MessageResponseDto;
import com.commercial.Pont.Commercial.enums.ConversationStatus;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.UUID;

public interface ConversationServiceInterface {

    ConversationResponseDto create(
            ConversationRequestDto conversationRequestDto
    );

    ConversationResponseDto update(
            UUID conversationId,
            ConversationRequestDto conversationRequestDto
    );

    ConversationResponseDto getById(
            UUID conversationId
    );

    List<ConversationResponseDto> getAll();

    void delete(
            UUID conversationId
    );


    ConversationResponseDto updateStatus(
            UUID conversationId,
            ConversationStatus status
    );



    ConversationResponseDto createMyConversation(
            CreateConversationRequestDto request,
            Authentication authentication
    );

    List<ConversationResponseDto> getMyConversations(
            Authentication authentication
    );

    List<MessageResponseDto> getMessages(
            UUID conversationId,
            Authentication authentication
    );

    ConversationResponseDto updateStatus(
            UUID conversationId,
            ConversationStatus statut,
            Authentication authentication
  );
}