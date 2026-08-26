package com.commercial.Pont.Commercial.services.ServiceInterfaces;

import com.commercial.Pont.Commercial.dtos.requestDtos.CreateMessageRequestDto;
import com.commercial.Pont.Commercial.dtos.requestDtos.MessageRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.MessageResponseDto;
import com.commercial.Pont.Commercial.models.Utilisateur;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.UUID;

public interface MessageServiceInterface {

    MessageResponseDto create(
            MessageRequestDto messageRequestDto
    );


    MessageResponseDto createMyMessage(
            CreateMessageRequestDto messageRequestDto,
            Authentication authentication
    );


    MessageResponseDto markAsRead(
            UUID messageId,
            Authentication authentication
    );


    List<MessageResponseDto> getReadMessages(
            UUID conversationId,
            Authentication authentication
    );


    List<MessageResponseDto> getUnreadMessages(
            UUID conversationId,
            Authentication authentication
    );

    MessageResponseDto update(
            UUID messageId,
            MessageRequestDto messageRequestDto
    );

    MessageResponseDto getById(
            UUID messageId
    );

    List<MessageResponseDto> getAll();

    void delete(
            UUID messageId
    );


    List<MessageResponseDto> getByConversationId(
            UUID conversationId
    );



    public boolean estUtilisateurAbonne(Utilisateur utilisateur);

    public void verifierLimiteMessages(Utilisateur utilisateur);

    public void incrementerNombreChats(Utilisateur utilisateur, boolean abonne);
}