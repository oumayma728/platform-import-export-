package com.commercial.Pont.Commercial.mappers;

import com.commercial.Pont.Commercial.dtos.requestDtos.DocumentConversationRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.DocumentConversationResponseDto;
import com.commercial.Pont.Commercial.mappers.ImplementationMappers.DocumentConversationMapperImpl;
import com.commercial.Pont.Commercial.models.Conversation;
import com.commercial.Pont.Commercial.models.DocumentConversation;
import com.commercial.Pont.Commercial.models.Utilisateur;
import com.commercial.Pont.Commercial.repositories.ConversationRepository;
import com.commercial.Pont.Commercial.repositories.UtilisateurRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DocumentConversationMapperImplTest {

    @Mock private UtilisateurRepository utilisateurRepository;
    @Mock private ConversationRepository conversationRepository;

    @InjectMocks
    private DocumentConversationMapperImpl mapper;

    @Test
    void nullInputs_ShouldReturnNull() {
        assertNull(mapper.requestToEntity(null));
        assertNull(mapper.entityToRequest(null));
        assertNull(mapper.entityToResponse(null));
        assertNull(mapper.responseToEntity(null));
    }

    @Test
    void requestToEntity_ShouldResolveRelations() {
        UUID utilisateurId = UUID.randomUUID();
        UUID conversationId = UUID.randomUUID();

        Utilisateur utilisateur = mock(Utilisateur.class);
        Conversation conversation = mock(Conversation.class);
        DocumentConversationRequestDto dto = mock(DocumentConversationRequestDto.class);

        when(dto.getUtilisateurId()).thenReturn(utilisateurId);
        when(dto.getConversationId()).thenReturn(conversationId);
        when(utilisateurRepository.findById(utilisateurId)).thenReturn(Optional.of(utilisateur));
        when(conversationRepository.findById(conversationId)).thenReturn(Optional.of(conversation));

        DocumentConversation result = mapper.requestToEntity(dto);

        assertSame(utilisateur, result.getExpediteur());
        assertSame(conversation, result.getConversation());
    }

    @Test
    void entityToDtos_ShouldExtractRelationIds() {
        UUID utilisateurId = UUID.randomUUID();
        UUID conversationId = UUID.randomUUID();

        Utilisateur utilisateur = mock(Utilisateur.class);
        Conversation conversation = mock(Conversation.class);
        when(utilisateur.getUtilisateurId()).thenReturn(utilisateurId);
        when(conversation.getConversationId()).thenReturn(conversationId);

        DocumentConversation document = mock(DocumentConversation.class);
        when(document.getExpediteur()).thenReturn(utilisateur);
        when(document.getConversation()).thenReturn(conversation);

        DocumentConversationRequestDto request = mapper.entityToRequest(document);
        DocumentConversationResponseDto response = mapper.entityToResponse(document);

        assertEquals(utilisateurId, request.getUtilisateurId());
        assertEquals(conversationId, request.getConversationId());
        assertEquals(utilisateurId, response.getUtilisateurId());
        assertEquals(conversationId, response.getConversationId());
    }

    @Test
    void entityToDtos_WithoutRelations_ShouldReturnNullIds() {
        DocumentConversation document = mock(DocumentConversation.class);

        DocumentConversationRequestDto request = mapper.entityToRequest(document);
        DocumentConversationResponseDto response = mapper.entityToResponse(document);

        assertNull(request.getUtilisateurId());
        assertNull(request.getConversationId());
        assertNull(response.getUtilisateurId());
        assertNull(response.getConversationId());
    }

    @Test
    void responseToEntity_ShouldResolveRelations() {
        UUID utilisateurId = UUID.randomUUID();
        UUID conversationId = UUID.randomUUID();

        Utilisateur utilisateur = mock(Utilisateur.class);
        Conversation conversation = mock(Conversation.class);
        DocumentConversationResponseDto dto = mock(DocumentConversationResponseDto.class);

        when(dto.getUtilisateurId()).thenReturn(utilisateurId);
        when(dto.getConversationId()).thenReturn(conversationId);
        when(utilisateurRepository.findById(utilisateurId)).thenReturn(Optional.of(utilisateur));
        when(conversationRepository.findById(conversationId)).thenReturn(Optional.of(conversation));

        DocumentConversation result = mapper.responseToEntity(dto);

        assertSame(utilisateur, result.getExpediteur());
        assertSame(conversation, result.getConversation());
    }
}
