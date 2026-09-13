package com.commercial.Pont.Commercial.mappers;

import com.commercial.Pont.Commercial.dtos.requestDtos.MessageRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.MessageResponseDto;
import com.commercial.Pont.Commercial.mappers.ImplementationMappers.MessageMapperImpl;
import com.commercial.Pont.Commercial.models.Conversation;
import com.commercial.Pont.Commercial.models.Message;
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
class MessageMapperImplTest {

    @Mock
    private ConversationRepository conversationRepository;

    @Mock
    private UtilisateurRepository utilisateurRepository;

    @InjectMocks
    private MessageMapperImpl mapper;

    @Test
    void nullInputs_ShouldReturnNull() {
        assertNull(mapper.requestToEntity(null));
        assertNull(mapper.entityToRequest(null));
        assertNull(mapper.entityToResponse(null));
        assertNull(mapper.responseToEntity(null));
    }

    @Test
    void requestToEntity_ShouldResolveRelations() {
        UUID conversationId = UUID.randomUUID();
        UUID expediteurId = UUID.randomUUID();

        Conversation conversation = mock(Conversation.class);
        Utilisateur utilisateur = mock(Utilisateur.class);
        MessageRequestDto dto = mock(MessageRequestDto.class);

        when(dto.getConversationId()).thenReturn(conversationId);
        when(dto.getExpediteurId()).thenReturn(expediteurId);

        when(conversationRepository.findById(conversationId))
                .thenReturn(Optional.of(conversation));

        when(utilisateurRepository.findById(expediteurId))
                .thenReturn(Optional.of(utilisateur));

        Message result = mapper.requestToEntity(dto);

        assertNotNull(result);
        assertSame(conversation, result.getConversation());
        assertSame(utilisateur, result.getUtilisateur());
    }

    @Test
    void requestToEntity_WithoutRelations_ShouldLeaveRelationsNull() {
        MessageRequestDto dto = mock(MessageRequestDto.class);

        Message result = mapper.requestToEntity(dto);

        assertNotNull(result);
        assertNull(result.getConversation());
        assertNull(result.getUtilisateur());

        verifyNoInteractions(conversationRepository, utilisateurRepository);
    }

    @Test
    void entityToDtos_ShouldExtractRelationIds() {
        UUID conversationId = UUID.randomUUID();
        UUID utilisateurId = UUID.randomUUID();

        Conversation conversation = mock(Conversation.class);
        Utilisateur utilisateur = mock(Utilisateur.class);

        when(conversation.getConversationId()).thenReturn(conversationId);
        when(utilisateur.getUtilisateurId()).thenReturn(utilisateurId);

        Message message = mock(Message.class);

        when(message.getConversation()).thenReturn(conversation);
        when(message.getUtilisateur()).thenReturn(utilisateur);

        MessageRequestDto request = mapper.entityToRequest(message);
        MessageResponseDto response = mapper.entityToResponse(message);

        assertEquals(conversationId, request.getConversationId());
        assertEquals(utilisateurId, request.getExpediteurId());

        assertEquals(conversationId, response.getConversationId());
        assertEquals(utilisateurId, response.getExpediteurId());
    }

    @Test
    void entityToDtos_WithoutRelations_ShouldReturnNullIds() {
        Message message = mock(Message.class);

        MessageRequestDto request = mapper.entityToRequest(message);
        MessageResponseDto response = mapper.entityToResponse(message);

        assertNull(request.getConversationId());
        assertNull(request.getExpediteurId());

        assertNull(response.getConversationId());
        assertNull(response.getExpediteurId());
    }

    @Test
    void responseToEntity_ShouldResolveRelations() {
        UUID conversationId = UUID.randomUUID();
        UUID expediteurId = UUID.randomUUID();

        Conversation conversation = mock(Conversation.class);
        Utilisateur utilisateur = mock(Utilisateur.class);
        MessageResponseDto dto = mock(MessageResponseDto.class);

        when(dto.getConversationId()).thenReturn(conversationId);
        when(dto.getExpediteurId()).thenReturn(expediteurId);

        when(conversationRepository.findById(conversationId))
                .thenReturn(Optional.of(conversation));

        when(utilisateurRepository.findById(expediteurId))
                .thenReturn(Optional.of(utilisateur));

        Message result = mapper.responseToEntity(dto);

        assertNotNull(result);
        assertSame(conversation, result.getConversation());
        assertSame(utilisateur, result.getUtilisateur());
    }
}
