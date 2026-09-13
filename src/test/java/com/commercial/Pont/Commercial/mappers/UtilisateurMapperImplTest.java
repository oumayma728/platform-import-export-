package com.commercial.Pont.Commercial.mappers;

import com.commercial.Pont.Commercial.dtos.requestDtos.UtilisateurRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.UtilisateurResponseDto;
import com.commercial.Pont.Commercial.mappers.ImplementationMappers.UtilisateurMapperImpl;
import com.commercial.Pont.Commercial.models.*;
import com.commercial.Pont.Commercial.repositories.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UtilisateurMapperImplTest {

    @Mock private EntrepriseRepository entrepriseRepository;
    @Mock private SubscriptionRepository subscriptionRepository;
    @Mock private MessageRepository messageRepository;
    @Mock private ConversationRepository conversationRepository;
    @Mock private AnnonceRepository annonceRepository;
    @Mock private DocumentConversationRepository documentConversationRepository;
    @Mock private NotificationRepository notificationRepository;
    @Mock private RoleUtilisateurRepository roleUtilisateurRepository;

    @InjectMocks
    private UtilisateurMapperImpl mapper;

    @Test
    void nullInputs_ShouldReturnNull() {
        assertNull(mapper.requestToEntity(null));
        assertNull(mapper.entityToRequest(null));
        assertNull(mapper.entityToResponse(null));
        assertNull(mapper.responseToEntity(null));
    }

    @Test
    void requestToEntity_ShouldResolveAllRelations() {
        UUID entrepriseId = UUID.randomUUID();
        UUID subscriptionId = UUID.randomUUID();
        UUID messageId = UUID.randomUUID();
        UUID conversationInitiateurId = UUID.randomUUID();
        UUID conversationDestinataireId = UUID.randomUUID();
        UUID annonceId = UUID.randomUUID();
        UUID documentId = UUID.randomUUID();
        UUID notificationId = UUID.randomUUID();
        UUID roleUtilisateurId = UUID.randomUUID();

        Entreprise entreprise = mock(Entreprise.class);
        Subscription subscription = mock(Subscription.class);
        Message message = mock(Message.class);
        Conversation conversationInitiateur = mock(Conversation.class);
        Conversation conversationDestinataire = mock(Conversation.class);
        Annonce annonce = mock(Annonce.class);
        DocumentConversation document = mock(DocumentConversation.class);
        Notification notification = mock(Notification.class);
        RoleUtilisateur roleUtilisateur = mock(RoleUtilisateur.class);

        UtilisateurRequestDto dto =
                mock(UtilisateurRequestDto.class);

        when(dto.getEntrepriseId()).thenReturn(entrepriseId);
        when(dto.getSubscriptionsIds()).thenReturn(List.of(subscriptionId));
        when(dto.getMessageIds()).thenReturn(List.of(messageId));
        when(dto.getConversationsCommeInitiateurIds())
                .thenReturn(List.of(conversationInitiateurId));
        when(dto.getConversationsCommeDestinataireIds())
                .thenReturn(List.of(conversationDestinataireId));
        when(dto.getAnnoncesIds()).thenReturn(List.of(annonceId));
        when(dto.getDocumentConversationsIds()).thenReturn(List.of(documentId));
        when(dto.getNotificationsIds()).thenReturn(List.of(notificationId));
        when(dto.getUtilisateurRoleIds()).thenReturn(Set.of(roleUtilisateurId));

        when(entrepriseRepository.findById(entrepriseId))
                .thenReturn(Optional.of(entreprise));
        when(subscriptionRepository.findAllById(List.of(subscriptionId)))
                .thenReturn(List.of(subscription));
        when(messageRepository.findAllById(List.of(messageId)))
                .thenReturn(List.of(message));
        when(conversationRepository.findAllById(List.of(conversationInitiateurId)))
                .thenReturn(List.of(conversationInitiateur));
        when(conversationRepository.findAllById(List.of(conversationDestinataireId)))
                .thenReturn(List.of(conversationDestinataire));
        when(annonceRepository.findAllById(List.of(annonceId)))
                .thenReturn(List.of(annonce));
        when(documentConversationRepository.findAllById(List.of(documentId)))
                .thenReturn(List.of(document));
        when(notificationRepository.findAllById(List.of(notificationId)))
                .thenReturn(List.of(notification));
        when(roleUtilisateurRepository.findAllById(Set.of(roleUtilisateurId)))
                .thenReturn(List.of(roleUtilisateur));

        Utilisateur result =
                mapper.requestToEntity(dto);

        assertSame(entreprise, result.getEntreprise());
        assertEquals(List.of(subscription), result.getSubscriptions());
        assertEquals(List.of(message), result.getMessages());
        assertEquals(
                List.of(conversationInitiateur),
                result.getConversationsCommeInitiateur()
        );
        assertEquals(
                List.of(conversationDestinataire),
                result.getConversationsCommeDestinataire()
        );
        assertEquals(List.of(annonce), result.getAnnonces());
        assertEquals(List.of(document), result.getDocumentConversations());
        assertEquals(List.of(notification), result.getNotifications());
        assertEquals(Set.of(roleUtilisateur), result.getRoles());
    }

    @Test
    void requestToEntity_WithoutRelations_ShouldUseNullAndEmptyCollections() {
        UtilisateurRequestDto dto =
                mock(UtilisateurRequestDto.class);

        Utilisateur result =
                mapper.requestToEntity(dto);

        assertNull(result.getEntreprise());
        assertTrue(result.getSubscriptions().isEmpty());
        assertTrue(result.getMessages().isEmpty());
        assertTrue(result.getConversationsCommeInitiateur().isEmpty());
        assertTrue(result.getConversationsCommeDestinataire().isEmpty());
        assertTrue(result.getAnnonces().isEmpty());
        assertTrue(result.getDocumentConversations().isEmpty());
        assertTrue(result.getNotifications().isEmpty());
        assertTrue(result.getRoles().isEmpty());
    }

    @Test
    void entityToRequest_ShouldExtractAllRelationIds() {
        UUID entrepriseId = UUID.randomUUID();
        UUID subscriptionId = UUID.randomUUID();
        UUID messageId = UUID.randomUUID();
        UUID conversationInitiateurId = UUID.randomUUID();
        UUID conversationDestinataireId = UUID.randomUUID();
        UUID annonceId = UUID.randomUUID();
        UUID documentId = UUID.randomUUID();
        UUID notificationId = UUID.randomUUID();
        UUID roleUtilisateurId = UUID.randomUUID();

        Entreprise entreprise = mock(Entreprise.class);
        Subscription subscription = mock(Subscription.class);
        Message message = mock(Message.class);
        Conversation conversationInitiateur = mock(Conversation.class);
        Conversation conversationDestinataire = mock(Conversation.class);
        Annonce annonce = mock(Annonce.class);
        DocumentConversation document = mock(DocumentConversation.class);
        Notification notification = mock(Notification.class);
        RoleUtilisateur roleUtilisateur = mock(RoleUtilisateur.class);

        when(entreprise.getEntrepriseId()).thenReturn(entrepriseId);
        when(subscription.getSubscriptionId()).thenReturn(subscriptionId);
        when(message.getMessageId()).thenReturn(messageId);
        when(conversationInitiateur.getConversationId())
                .thenReturn(conversationInitiateurId);
        when(conversationDestinataire.getConversationId())
                .thenReturn(conversationDestinataireId);
        when(annonce.getAnnonceId()).thenReturn(annonceId);
        when(document.getDocumentConversationId()).thenReturn(documentId);
        when(notification.getNotificationId()).thenReturn(notificationId);
        when(roleUtilisateur.getRoleUtilisateurId()).thenReturn(roleUtilisateurId);

        Utilisateur utilisateur =
                mock(Utilisateur.class);

        when(utilisateur.getEntreprise()).thenReturn(entreprise);
        when(utilisateur.getSubscriptions()).thenReturn(List.of(subscription));
        when(utilisateur.getMessages()).thenReturn(List.of(message));
        when(utilisateur.getConversationsCommeInitiateur())
                .thenReturn(List.of(conversationInitiateur));
        when(utilisateur.getConversationsCommeDestinataire())
                .thenReturn(List.of(conversationDestinataire));
        when(utilisateur.getAnnonces()).thenReturn(List.of(annonce));
        when(utilisateur.getDocumentConversations()).thenReturn(List.of(document));
        when(utilisateur.getNotifications()).thenReturn(List.of(notification));
        when(utilisateur.getRoles()).thenReturn(Set.of(roleUtilisateur));

        UtilisateurRequestDto result =
                mapper.entityToRequest(utilisateur);

        assertEquals(entrepriseId, result.getEntrepriseId());
        assertEquals(List.of(subscriptionId), result.getSubscriptionsIds());
        assertEquals(List.of(messageId), result.getMessageIds());
        assertEquals(
                List.of(conversationInitiateurId),
                result.getConversationsCommeInitiateurIds()
        );
        assertEquals(
                List.of(conversationDestinataireId),
                result.getConversationsCommeDestinataireIds()
        );
        assertEquals(List.of(annonceId), result.getAnnoncesIds());
        assertEquals(
                List.of(documentId),
                result.getDocumentConversationsIds()
        );
        assertEquals(
                List.of(notificationId),
                result.getNotificationsIds()
        );
        assertEquals(
                Set.of(roleUtilisateurId),
                result.getUtilisateurRoleIds()
        );
    }

    @Test
    void entityToResponse_ShouldExtractRelationsAndRoleIds() {
        UUID entrepriseId = UUID.randomUUID();
        UUID roleUtilisateurId = UUID.randomUUID();
        UUID roleId = UUID.randomUUID();

        Entreprise entreprise = mock(Entreprise.class);
        RoleUtilisateur roleUtilisateur = mock(RoleUtilisateur.class);
        Role role = mock(Role.class);

        when(entreprise.getEntrepriseId())
                .thenReturn(entrepriseId);

        when(roleUtilisateur.getRoleUtilisateurId())
                .thenReturn(roleUtilisateurId);

        when(roleUtilisateur.getRole())
                .thenReturn(role);

        when(role.getRoleId())
                .thenReturn(roleId);

        Utilisateur utilisateur =
                mock(Utilisateur.class);

        when(utilisateur.getEntreprise())
                .thenReturn(entreprise);

        when(utilisateur.getRoles())
                .thenReturn(Set.of(roleUtilisateur));

        UtilisateurResponseDto result =
                mapper.entityToResponse(utilisateur);

        assertEquals(
                entrepriseId,
                result.getEntrepriseId()
        );

        assertEquals(
                Set.of(roleUtilisateurId),
                result.getUtilisateurRoleIds()
        );

        assertEquals(
                Set.of(roleId),
                result.getRoleIds()
        );
    }

    @Test
    void entityToResponse_WithNullCollections_ShouldUseEmptyCollections() {
        Utilisateur utilisateur =
                mock(Utilisateur.class);

        UtilisateurResponseDto result =
                mapper.entityToResponse(utilisateur);

        assertNotNull(result);
        assertTrue(result.getSubscriptionsIds().isEmpty());
        assertTrue(result.getMessageIds().isEmpty());
        assertTrue(result.getConversationsCommeInitiateurIds().isEmpty());
        assertTrue(result.getConversationsCommeDestinataireIds().isEmpty());
        assertTrue(result.getAnnoncesIds().isEmpty());
        assertTrue(result.getDocumentConversationsIds().isEmpty());
        assertTrue(result.getNotificationsIds().isEmpty());
        assertTrue(result.getUtilisateurRoleIds().isEmpty());
        assertTrue(result.getRoleIds().isEmpty());
    }

    @Test
    void responseToEntity_ShouldResolveAllRelations() {
        UUID entrepriseId = UUID.randomUUID();
        UUID subscriptionId = UUID.randomUUID();
        UUID messageId = UUID.randomUUID();
        UUID conversationInitiateurId = UUID.randomUUID();
        UUID conversationDestinataireId = UUID.randomUUID();
        UUID annonceId = UUID.randomUUID();
        UUID documentId = UUID.randomUUID();
        UUID notificationId = UUID.randomUUID();
        UUID roleUtilisateurId = UUID.randomUUID();

        Entreprise entreprise = mock(Entreprise.class);
        Subscription subscription = mock(Subscription.class);
        Message message = mock(Message.class);
        Conversation conversationInitiateur = mock(Conversation.class);
        Conversation conversationDestinataire = mock(Conversation.class);
        Annonce annonce = mock(Annonce.class);
        DocumentConversation document = mock(DocumentConversation.class);
        Notification notification = mock(Notification.class);
        RoleUtilisateur roleUtilisateur = mock(RoleUtilisateur.class);

        UtilisateurResponseDto dto =
                mock(UtilisateurResponseDto.class);

        when(dto.getEntrepriseId()).thenReturn(entrepriseId);
        when(dto.getSubscriptionsIds()).thenReturn(List.of(subscriptionId));
        when(dto.getMessageIds()).thenReturn(List.of(messageId));
        when(dto.getConversationsCommeInitiateurIds())
                .thenReturn(List.of(conversationInitiateurId));
        when(dto.getConversationsCommeDestinataireIds())
                .thenReturn(List.of(conversationDestinataireId));
        when(dto.getAnnoncesIds()).thenReturn(List.of(annonceId));
        when(dto.getDocumentConversationsIds()).thenReturn(List.of(documentId));
        when(dto.getNotificationsIds()).thenReturn(List.of(notificationId));
        when(dto.getUtilisateurRoleIds()).thenReturn(Set.of(roleUtilisateurId));

        when(entrepriseRepository.findById(entrepriseId))
                .thenReturn(Optional.of(entreprise));
        when(subscriptionRepository.findAllById(List.of(subscriptionId)))
                .thenReturn(List.of(subscription));
        when(messageRepository.findAllById(List.of(messageId)))
                .thenReturn(List.of(message));
        when(conversationRepository.findAllById(List.of(conversationInitiateurId)))
                .thenReturn(List.of(conversationInitiateur));
        when(conversationRepository.findAllById(List.of(conversationDestinataireId)))
                .thenReturn(List.of(conversationDestinataire));
        when(annonceRepository.findAllById(List.of(annonceId)))
                .thenReturn(List.of(annonce));
        when(documentConversationRepository.findAllById(List.of(documentId)))
                .thenReturn(List.of(document));
        when(notificationRepository.findAllById(List.of(notificationId)))
                .thenReturn(List.of(notification));
        when(roleUtilisateurRepository.findAllById(Set.of(roleUtilisateurId)))
                .thenReturn(List.of(roleUtilisateur));

        Utilisateur result =
                mapper.responseToEntity(dto);

        assertSame(entreprise, result.getEntreprise());
        assertEquals(List.of(subscription), result.getSubscriptions());
        assertEquals(List.of(message), result.getMessages());
        assertEquals(
                List.of(conversationInitiateur),
                result.getConversationsCommeInitiateur()
        );
        assertEquals(
                List.of(conversationDestinataire),
                result.getConversationsCommeDestinataire()
        );
        assertEquals(List.of(annonce), result.getAnnonces());
        assertEquals(List.of(document), result.getDocumentConversations());
        assertEquals(List.of(notification), result.getNotifications());
        assertEquals(Set.of(roleUtilisateur), result.getRoles());
    }
}
