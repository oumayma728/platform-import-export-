package com.commercial.Pont.Commercial.services.ServiceInterfaces;

import com.commercial.Pont.Commercial.dtos.requestDtos.CreateMessageRequestDto;
import com.commercial.Pont.Commercial.dtos.requestDtos.MessageRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.MessageResponseDto;
import com.commercial.Pont.Commercial.models.Utilisateur;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.UUID;

public interface MessageServiceInterface {

    @PreAuthorize("hasRole('ADMIN')")
    MessageResponseDto create(
            MessageRequestDto messageRequestDto
    );

    @PreAuthorize("hasAnyRole('IMPORTATEUR', 'EXPORTATEUR')")
    MessageResponseDto createMyMessage(
            CreateMessageRequestDto messageRequestDto,
            Authentication authentication
    );

    @PreAuthorize("hasAnyRole('IMPORTATEUR', 'EXPORTATEUR')")
    MessageResponseDto markAsRead(
            UUID messageId,
            Authentication authentication
    );

    @PreAuthorize("hasAnyRole('IMPORTATEUR', 'EXPORTATEUR')")
    List<MessageResponseDto> getReadMessages(
            UUID conversationId,
            Authentication authentication
    );

    @PreAuthorize("hasAnyRole('IMPORTATEUR', 'EXPORTATEUR')")
    List<MessageResponseDto> getUnreadMessages(
            UUID conversationId,
            Authentication authentication
    );

    @PreAuthorize("hasRole('ADMIN')")
    MessageResponseDto update(
            UUID messageId,
            MessageRequestDto messageRequestDto
    );

    @PreAuthorize("hasAnyRole('ADMIN', 'IMPORTATEUR', 'EXPORTATEUR')")
    MessageResponseDto getById(
            UUID messageId
    );

    @PreAuthorize("hasRole('ADMIN')")
    List<MessageResponseDto> getAll();

    @PreAuthorize("hasAnyRole('ADMIN', 'IMPORTATEUR', 'EXPORTATEUR')")
    void delete(
            UUID messageId
    );


    @PreAuthorize("hasAnyRole('ADMIN', 'IMPORTATEUR', 'EXPORTATEUR')")
    List<MessageResponseDto> getByConversationId(
            UUID conversationId
    );



    public boolean estUtilisateurAbonne(Utilisateur utilisateur);

    public void verifierLimiteMessages(Utilisateur utilisateur);

    public void incrementerNombreChats(Utilisateur utilisateur, boolean abonne);
}