package com.commercial.Pont.Commercial.mappers;

import com.commercial.Pont.Commercial.dtos.requestDtos.ConversationRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.ConversationResponseDto;
import com.commercial.Pont.Commercial.mappers.ImplementationMappers.ConversationMapperImpl;
import com.commercial.Pont.Commercial.models.*;
import com.commercial.Pont.Commercial.repositories.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ConversationMapperImplTest {

    @Mock private UtilisateurRepository utilisateurRepository;
    @Mock private AnnonceRepository annonceRepository;
    @Mock private FacturationRepository facturationRepository;
    @Mock private MessageRepository messageRepository;
    @Mock private DocumentConversationRepository documentConversationRepository;

    @InjectMocks
    private ConversationMapperImpl mapper;

    @Test
    void nullInputs_ShouldReturnNull() {
        assertNull(mapper.requestToEntity(null));
        assertNull(mapper.entityToRequest(null));
        assertNull(mapper.entityToResponse(null));
        assertNull(mapper.responseToEntity(null));
    }

    @Test
    void requestToEntity_ShouldResolveRelations() {
        UUID initiateurId = UUID.randomUUID();
        UUID destinataireId = UUID.randomUUID();
        UUID annonceId = UUID.randomUUID();
        UUID messageId = UUID.randomUUID();
        UUID documentId = UUID.randomUUID();

        Utilisateur initiateur = mock(Utilisateur.class);
        Utilisateur destinataire = mock(Utilisateur.class);
        Annonce annonce = mock(Annonce.class);
        Message message = mock(Message.class);
        DocumentConversation document = mock(DocumentConversation.class);

        ConversationRequestDto dto = mock(ConversationRequestDto.class);
        when(dto.getInitiateurId()).thenReturn(initiateurId);
        when(dto.getDestinataireId()).thenReturn(destinataireId);
        when(dto.getAnnonceId()).thenReturn(annonceId);
        when(dto.getMessagesIds()).thenReturn(List.of(messageId));
        when(dto.getDocumentConversationsIds()).thenReturn(List.of(documentId));

        when(utilisateurRepository.findById(initiateurId)).thenReturn(Optional.of(initiateur));
        when(utilisateurRepository.findById(destinataireId)).thenReturn(Optional.of(destinataire));
        when(annonceRepository.findById(annonceId)).thenReturn(Optional.of(annonce));
        when(messageRepository.findAllById(List.of(messageId))).thenReturn(List.of(message));
        when(documentConversationRepository.findAllById(List.of(documentId))).thenReturn(List.of(document));

        Conversation result = mapper.requestToEntity(dto);

        assertSame(initiateur, result.getInitiateur());
        assertSame(destinataire, result.getDestinataire());
        assertSame(annonce, result.getAnnonce());
        assertEquals(List.of(message), result.getMessages());
        assertEquals(List.of(document), result.getDocumentConversations());
    }

    @Test
    void requestToEntity_WithoutRelations_ShouldUseNullAndEmptyRelations() {
        ConversationRequestDto dto = mock(ConversationRequestDto.class);

        Conversation result = mapper.requestToEntity(dto);

        assertNull(result.getInitiateur());
        assertNull(result.getDestinataire());
        assertNull(result.getAnnonce());
        assertTrue(result.getMessages().isEmpty());
        assertTrue(result.getDocumentConversations().isEmpty());
    }

    @Test
    void entityToDtos_ShouldExtractRelationIds() {
        UUID initiateurId = UUID.randomUUID();
        UUID destinataireId = UUID.randomUUID();
        UUID annonceId = UUID.randomUUID();
        UUID messageId = UUID.randomUUID();
        UUID documentId = UUID.randomUUID();

        Utilisateur initiateur = mock(Utilisateur.class);
        Utilisateur destinataire = mock(Utilisateur.class);
        Annonce annonce = mock(Annonce.class);
        Message message = mock(Message.class);
        DocumentConversation document = mock(DocumentConversation.class);

        when(initiateur.getUtilisateurId()).thenReturn(initiateurId);
        when(destinataire.getUtilisateurId()).thenReturn(destinataireId);
        when(annonce.getAnnonceId()).thenReturn(annonceId);
        when(message.getMessageId()).thenReturn(messageId);
        when(document.getDocumentConversationId()).thenReturn(documentId);

        Conversation conversation = mock(Conversation.class);
        when(conversation.getInitiateur()).thenReturn(initiateur);
        when(conversation.getDestinataire()).thenReturn(destinataire);
        when(conversation.getAnnonce()).thenReturn(annonce);
        when(conversation.getMessages()).thenReturn(List.of(message));
        when(conversation.getDocumentConversations()).thenReturn(List.of(document));

        ConversationRequestDto request = mapper.entityToRequest(conversation);
        ConversationResponseDto response = mapper.entityToResponse(conversation);

        assertEquals(initiateurId, request.getInitiateurId());
        assertEquals(destinataireId, request.getDestinataireId());
        assertEquals(annonceId, request.getAnnonceId());
        assertEquals(List.of(messageId), request.getMessagesIds());
        assertEquals(List.of(documentId), request.getDocumentConversationsIds());

        assertEquals(initiateurId, response.getInitiateurId());
        assertEquals(destinataireId, response.getDestinataireId());
        assertEquals(annonceId, response.getAnnonceId());
    }

    @Test
    void responseToEntity_ShouldResolveRelations() {
        UUID initiateurId = UUID.randomUUID();
        UUID destinataireId = UUID.randomUUID();
        UUID annonceId = UUID.randomUUID();
        UUID messageId = UUID.randomUUID();
        UUID documentId = UUID.randomUUID();

        Utilisateur initiateur = mock(Utilisateur.class);
        Utilisateur destinataire = mock(Utilisateur.class);
        Annonce annonce = mock(Annonce.class);
        Message message = mock(Message.class);
        DocumentConversation document = mock(DocumentConversation.class);

        ConversationResponseDto dto = mock(ConversationResponseDto.class);
        when(dto.getInitiateurId()).thenReturn(initiateurId);
        when(dto.getDestinataireId()).thenReturn(destinataireId);
        when(dto.getAnnonceId()).thenReturn(annonceId);
        when(dto.getMessagesIds()).thenReturn(List.of(messageId));
        when(dto.getDocumentConversationsIds()).thenReturn(List.of(documentId));

        when(utilisateurRepository.findById(initiateurId)).thenReturn(Optional.of(initiateur));
        when(utilisateurRepository.findById(destinataireId)).thenReturn(Optional.of(destinataire));
        when(annonceRepository.findById(annonceId)).thenReturn(Optional.of(annonce));
        when(messageRepository.findAllById(List.of(messageId))).thenReturn(List.of(message));
        when(documentConversationRepository.findAllById(List.of(documentId))).thenReturn(List.of(document));

        Conversation result = mapper.responseToEntity(dto);

        assertSame(initiateur, result.getInitiateur());
        assertSame(destinataire, result.getDestinataire());
        assertSame(annonce, result.getAnnonce());
        assertEquals(List.of(message), result.getMessages());
        assertEquals(List.of(document), result.getDocumentConversations());
    }
}
