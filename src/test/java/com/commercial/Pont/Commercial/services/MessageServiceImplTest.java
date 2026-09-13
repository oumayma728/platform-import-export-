package com.commercial.Pont.Commercial.services;

import com.commercial.Pont.Commercial.dtos.requestDtos.CreateMessageRequestDto;
import com.commercial.Pont.Commercial.dtos.requestDtos.MessageRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.MessageResponseDto;
import com.commercial.Pont.Commercial.enums.FacturationStatus;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.MessageMapperInterface;
import com.commercial.Pont.Commercial.models.*;
import com.commercial.Pont.Commercial.repositories.*;
import com.commercial.Pont.Commercial.services.ImplementationServices.FacturationServiceImpl;
import com.commercial.Pont.Commercial.services.ImplementationServices.MessageServiceImpl;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.NotificationServiceInterface;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MessageServiceImplTest {

    @Mock private MessageRepository messageRepository;
    @Mock private MessageMapperInterface messageMapper;
    @Mock private ConversationRepository conversationRepository;
    @Mock private UtilisateurRepository utilisateurRepository;
    @Mock private FacturationRepository facturationRepository;
    @Mock private SimpMessagingTemplate messagingTemplate;
    @Mock private FacturationServiceImpl facturationService;
    @Mock private SubscriptionRepository subscriptionRepository;
    @Mock private NotificationServiceInterface notificationService;
    @Mock private Authentication authentication;

    @InjectMocks
    private MessageServiceImpl service;

    private UUID conversationId;
    private UUID initiateurId;
    private UUID destinataireId;
    private Conversation conversation;
    private Utilisateur initiateur;
    private Utilisateur destinataire;

    @BeforeEach
    void setUp() {
        conversationId = UUID.randomUUID();
        initiateurId = UUID.randomUUID();
        destinataireId = UUID.randomUUID();

        initiateur = new Utilisateur();
        initiateur.setUtilisateurId(initiateurId);
        initiateur.setEmail("init@test.com");
        initiateur.setNombreChatsUtilises(0);
        initiateur.setMaxMessagesPossible(50);

        destinataire = new Utilisateur();
        destinataire.setUtilisateurId(destinataireId);
        destinataire.setEmail("dest@test.com");
        destinataire.setNombreChatsUtilises(0);
        destinataire.setMaxMessagesPossible(50);

        conversation = new Conversation();
        conversation.setConversationId(conversationId);
        conversation.setInitiateur(initiateur);
        conversation.setDestinataire(destinataire);
        conversation.setNombreMessages(0);
    }

    @Test
    void create_ShouldCreateMessageSuccessfully() {
        MessageRequestDto request = mock(MessageRequestDto.class);
        Message message = new Message();
        MessageResponseDto response = mock(MessageResponseDto.class);

        when(request.getConversationId()).thenReturn(conversationId);
        when(request.getExpediteurId()).thenReturn(initiateurId);
        when(conversationRepository.findById(conversationId))
                .thenReturn(Optional.of(conversation));
        when(utilisateurRepository.findById(initiateurId))
                .thenReturn(Optional.of(initiateur));
        when(messageMapper.requestToEntity(request)).thenReturn(message);
        when(messageRepository.save(message)).thenReturn(message);
        when(messageMapper.entityToResponse(message)).thenReturn(response);

        MessageResponseDto result = service.create(request);

        assertSame(response, result);
        assertSame(conversation, message.getConversation());
        assertSame(initiateur, message.getUtilisateur());
        assertFalse(message.getEstLu());
        assertNotNull(message.getDateEnvoi());
        assertEquals(1, conversation.getNombreMessages());
        assertEquals(1, initiateur.getNombreChatsUtilises());

        verify(conversationRepository).save(conversation);
        verify(utilisateurRepository).save(initiateur);
        verify(messagingTemplate).convertAndSend(
                eq("/topic/conversations/" + conversationId),
                any(Object.class)
        );
    }

    @Test
    void create_ShouldThrow_WhenConversationNotFound() {
        MessageRequestDto request = mock(MessageRequestDto.class);
        when(request.getConversationId()).thenReturn(conversationId);
        when(conversationRepository.findById(conversationId))
                .thenReturn(Optional.empty());

        assertThrows(
                EntityNotFoundException.class,
                () -> service.create(request)
        );

        verify(messageRepository, never()).save(any());
    }

    @Test
    void create_ShouldThrow_WhenUserNotFound() {
        MessageRequestDto request = mock(MessageRequestDto.class);
        when(request.getConversationId()).thenReturn(conversationId);
        when(request.getExpediteurId()).thenReturn(initiateurId);
        when(conversationRepository.findById(conversationId))
                .thenReturn(Optional.of(conversation));
        when(utilisateurRepository.findById(initiateurId))
                .thenReturn(Optional.empty());

        assertThrows(
                EntityNotFoundException.class,
                () -> service.create(request)
        );
    }

    @Test
    void create_ShouldThrow_WhenSenderIsNotParticipant() {
        UUID outsiderId = UUID.randomUUID();
        Utilisateur outsider = new Utilisateur();
        outsider.setUtilisateurId(outsiderId);

        MessageRequestDto request = mock(MessageRequestDto.class);
        when(request.getConversationId()).thenReturn(conversationId);
        when(request.getExpediteurId()).thenReturn(outsiderId);
        when(conversationRepository.findById(conversationId))
                .thenReturn(Optional.of(conversation));
        when(utilisateurRepository.findById(outsiderId))
                .thenReturn(Optional.of(outsider));
        when(messageMapper.requestToEntity(request))
                .thenReturn(new Message());

        assertThrows(
                IllegalArgumentException.class,
                () -> service.create(request)
        );

        verify(messageRepository, never()).save(any());
    }

    @Test
    void createMyMessage_ShouldCreateMessage_ForFreeUser() {
        CreateMessageRequestDto request = mock(CreateMessageRequestDto.class);
        when(authentication.getName()).thenReturn("init@test.com");
        when(utilisateurRepository.findByEmail("init@test.com"))
                .thenReturn(Optional.of(initiateur));
        when(subscriptionRepository
                .findFirstByUtilisateurOrderByDateFinDesc(initiateur))
                .thenReturn(Optional.empty());
        when(request.getConversationId()).thenReturn(conversationId);
        when(request.getContenu()).thenReturn("Bonjour");
        when(conversationRepository.findById(conversationId))
                .thenReturn(Optional.of(conversation));
        when(messageRepository.save(any(Message.class)))
                .thenAnswer(invocation -> {
                    Message m = invocation.getArgument(0);
                    m.setMessageId(UUID.randomUUID());
                    return m;
                });

        MessageResponseDto result =
                service.createMyMessage(request, authentication);

        assertNotNull(result);
        assertEquals("Bonjour", result.getContenu());
        assertEquals(1, conversation.getNombreMessages());
        assertEquals(1, initiateur.getNombreChatsUtilises());

        verify(notificationService)
                .notifierNouveauMessage(destinataire, initiateur);
        verify(messagingTemplate).convertAndSend(
                eq("/topic/conversations/" + conversationId),
                any(Object.class)
        );
    }

    @Test
    void createMyMessage_ShouldThrow_WhenConnectedUserNotFound() {
        when(authentication.getName()).thenReturn("none@test.com");
        when(utilisateurRepository.findByEmail("none@test.com"))
                .thenReturn(Optional.empty());

        assertThrows(
                EntityNotFoundException.class,
                () -> service.createMyMessage(
                        mock(CreateMessageRequestDto.class),
                        authentication
                )
        );
    }

    @Test
    void createMyMessage_ShouldThrow_WhenQuotaReached() {
        initiateur.setNombreChatsUtilises(50);
        initiateur.setMaxMessagesPossible(50);

        when(authentication.getName()).thenReturn("init@test.com");
        when(utilisateurRepository.findByEmail("init@test.com"))
                .thenReturn(Optional.of(initiateur));
        when(subscriptionRepository
                .findFirstByUtilisateurOrderByDateFinDesc(initiateur))
                .thenReturn(Optional.empty());

        IllegalStateException ex = assertThrows(
                IllegalStateException.class,
                () -> service.createMyMessage(
                        mock(CreateMessageRequestDto.class),
                        authentication
                )
        );

        assertTrue(ex.getMessage().contains("limite"));
        verify(facturationService)
                .mettreFacturationLimiteAtteinte(initiateur);
        verify(notificationService)
                .notifierQuotaAtteint(initiateur);
    }

    @Test
    void createMyMessage_ShouldThrow_WhenUserIsNotParticipant() {
        Utilisateur outsider = new Utilisateur();
        outsider.setUtilisateurId(UUID.randomUUID());
        outsider.setEmail("out@test.com");
        outsider.setNombreChatsUtilises(0);
        outsider.setMaxMessagesPossible(50);

        CreateMessageRequestDto request =
                mock(CreateMessageRequestDto.class);

        when(authentication.getName()).thenReturn("out@test.com");
        when(utilisateurRepository.findByEmail("out@test.com"))
                .thenReturn(Optional.of(outsider));
        when(subscriptionRepository
                .findFirstByUtilisateurOrderByDateFinDesc(outsider))
                .thenReturn(Optional.empty());
        when(request.getConversationId()).thenReturn(conversationId);
        when(conversationRepository.findById(conversationId))
                .thenReturn(Optional.of(conversation));

        assertThrows(
                AccessDeniedException.class,
                () -> service.createMyMessage(request, authentication)
        );
    }

    @Test
    void markAsRead_ShouldMarkMessageAsRead() {
        UUID messageId = UUID.randomUUID();
        Message message = new Message();
        message.setMessageId(messageId);
        message.setConversation(conversation);
        message.setUtilisateur(initiateur);

        MessageResponseDto response = mock(MessageResponseDto.class);

        when(authentication.getName()).thenReturn("dest@test.com");
        when(utilisateurRepository.findByEmail("dest@test.com"))
                .thenReturn(Optional.of(destinataire));
        when(messageRepository.findById(messageId))
                .thenReturn(Optional.of(message));
        when(messageRepository.save(message)).thenReturn(message);
        when(messageMapper.entityToResponse(message))
                .thenReturn(response);

        MessageResponseDto result =
                service.markAsRead(messageId, authentication);

        assertSame(response, result);
        assertTrue(message.getEstLu());
        assertNotNull(message.getDateLecture());

        verify(messagingTemplate).convertAndSend(
                eq("/topic/conversations/" + conversationId),
                any(Object.class)
        );
    }

    @Test
    void markAsRead_ShouldRejectOwnMessage() {
        UUID messageId = UUID.randomUUID();
        Message message = new Message();
        message.setConversation(conversation);
        message.setUtilisateur(initiateur);

        when(authentication.getName()).thenReturn("init@test.com");
        when(utilisateurRepository.findByEmail("init@test.com"))
                .thenReturn(Optional.of(initiateur));
        when(messageRepository.findById(messageId))
                .thenReturn(Optional.of(message));

        assertThrows(
                IllegalStateException.class,
                () -> service.markAsRead(messageId, authentication)
        );

        verify(messageRepository, never()).save(any());
    }

    @Test
    void markAsRead_ShouldRejectNonParticipant() {
        UUID messageId = UUID.randomUUID();
        Utilisateur outsider = new Utilisateur();
        outsider.setUtilisateurId(UUID.randomUUID());

        Message message = new Message();
        message.setConversation(conversation);
        message.setUtilisateur(initiateur);

        when(authentication.getName()).thenReturn("out@test.com");
        when(utilisateurRepository.findByEmail("out@test.com"))
                .thenReturn(Optional.of(outsider));
        when(messageRepository.findById(messageId))
                .thenReturn(Optional.of(message));

        assertThrows(
                AccessDeniedException.class,
                () -> service.markAsRead(messageId, authentication)
        );
    }

    @Test
    void getReadMessages_ShouldReturnMappedMessages() {
        Message message = new Message();
        MessageResponseDto dto = mock(MessageResponseDto.class);

        when(authentication.getName()).thenReturn("init@test.com");
        when(utilisateurRepository.findByEmail("init@test.com"))
                .thenReturn(Optional.of(initiateur));
        when(conversationRepository.findById(conversationId))
                .thenReturn(Optional.of(conversation));
        when(messageRepository
                .findByConversation_ConversationIdAndEstLuTrueOrderByDateEnvoiAsc(
                        conversationId))
                .thenReturn(List.of(message));
        when(messageMapper.entityToResponse(message)).thenReturn(dto);

        List<MessageResponseDto> result =
                service.getReadMessages(
                        conversationId,
                        authentication
                );

        assertEquals(1, result.size());
        assertSame(dto, result.get(0));
    }

    @Test
    void getUnreadMessages_ShouldReturnMappedMessages() {
        Message message = new Message();
        MessageResponseDto dto = mock(MessageResponseDto.class);

        when(authentication.getName()).thenReturn("init@test.com");
        when(utilisateurRepository.findByEmail("init@test.com"))
                .thenReturn(Optional.of(initiateur));
        when(conversationRepository.findById(conversationId))
                .thenReturn(Optional.of(conversation));
        when(messageRepository
                .findByConversation_ConversationIdAndEstLuFalseAndUtilisateurNotOrderByDateEnvoiAsc(
                        conversationId,
                        initiateur))
                .thenReturn(List.of(message));
        when(messageMapper.entityToResponse(message)).thenReturn(dto);

        List<MessageResponseDto> result =
                service.getUnreadMessages(
                        conversationId,
                        authentication
                );

        assertEquals(1, result.size());
    }

    @Test
    void update_ShouldUpdateMessageAndRelations() {
        UUID messageId = UUID.randomUUID();
        UUID newConversationId = UUID.randomUUID();
        UUID newUserId = UUID.randomUUID();

        Conversation newConversation = new Conversation();
        newConversation.setConversationId(newConversationId);

        Utilisateur newUser = new Utilisateur();
        newUser.setUtilisateurId(newUserId);

        Message existing = new Message();
        existing.setConversation(conversation);
        existing.setUtilisateur(initiateur);

        MessageRequestDto request = mock(MessageRequestDto.class);
        when(request.getContenu()).thenReturn("updated");
        when(request.getEstLu()).thenReturn(true);
        when(request.getConversationId()).thenReturn(newConversationId);
        when(request.getExpediteurId()).thenReturn(newUserId);

        when(messageRepository.findById(messageId))
                .thenReturn(Optional.of(existing));
        when(conversationRepository.findById(newConversationId))
                .thenReturn(Optional.of(newConversation));
        when(utilisateurRepository.findById(newUserId))
                .thenReturn(Optional.of(newUser));
        when(messageRepository.save(existing)).thenReturn(existing);

        MessageResponseDto dto = mock(MessageResponseDto.class);
        when(messageMapper.entityToResponse(existing)).thenReturn(dto);

        assertSame(dto, service.update(messageId, request));
        assertEquals("updated", existing.getContenu());
        assertSame(newConversation, existing.getConversation());
        assertSame(newUser, existing.getUtilisateur());
    }

    @Test
    void getById_ShouldReturnMappedMessage() {
        UUID id = UUID.randomUUID();
        Message message = new Message();
        MessageResponseDto dto = mock(MessageResponseDto.class);

        when(messageRepository.findById(id))
                .thenReturn(Optional.of(message));
        when(messageMapper.entityToResponse(message)).thenReturn(dto);

        assertSame(dto, service.getById(id));
    }

    @Test
    void getById_ShouldThrow_WhenMissing() {
        UUID id = UUID.randomUUID();
        when(messageRepository.findById(id))
                .thenReturn(Optional.empty());

        assertThrows(
                EntityNotFoundException.class,
                () -> service.getById(id)
        );
    }

    @Test
    void getAll_ShouldReturnMappedMessages() {
        Message m1 = new Message();
        Message m2 = new Message();
        MessageResponseDto d1 = mock(MessageResponseDto.class);
        MessageResponseDto d2 = mock(MessageResponseDto.class);

        when(messageRepository.findAll()).thenReturn(List.of(m1, m2));
        when(messageMapper.entityToResponse(m1)).thenReturn(d1);
        when(messageMapper.entityToResponse(m2)).thenReturn(d2);

        assertEquals(2, service.getAll().size());
    }

    @Test
    void delete_ShouldDelete_WhenExists() {
        UUID id = UUID.randomUUID();
        when(messageRepository.existsById(id)).thenReturn(true);

        service.delete(id);

        verify(messageRepository).deleteById(id);
    }

    @Test
    void delete_ShouldThrow_WhenMissing() {
        UUID id = UUID.randomUUID();
        when(messageRepository.existsById(id)).thenReturn(false);

        assertThrows(
                EntityNotFoundException.class,
                () -> service.delete(id)
        );
    }

    @Test
    void getByConversationId_ShouldReturnMessages_WhenConversationExists() {
        Message message = new Message();
        MessageResponseDto dto = mock(MessageResponseDto.class);

        when(conversationRepository.existsById(conversationId))
                .thenReturn(true);
        when(messageRepository
                .findByConversation_ConversationIdOrderByDateEnvoiAsc(
                        conversationId))
                .thenReturn(List.of(message));
        when(messageMapper.entityToResponse(message)).thenReturn(dto);

        List<MessageResponseDto> result =
                service.getByConversationId(conversationId);

        assertEquals(1, result.size());
    }

    @Test
    void getByConversationId_ShouldThrow_WhenConversationMissing() {
        when(conversationRepository.existsById(conversationId))
                .thenReturn(false);

        assertThrows(
                EntityNotFoundException.class,
                () -> service.getByConversationId(conversationId)
        );
    }

    @Test
    void estUtilisateurAbonne_ShouldReturnFalse_WhenNoSubscription() {
        when(subscriptionRepository
                .findFirstByUtilisateurOrderByDateFinDesc(initiateur))
                .thenReturn(Optional.empty());

        assertFalse(service.estUtilisateurAbonne(initiateur));
    }

    @Test
    void estUtilisateurAbonne_ShouldReturnTrue_WhenSubscriptionStillValid() {
        Subscription subscription = new Subscription();
        subscription.setDateFin(LocalDateTime.now().plusDays(1));

        when(subscriptionRepository
                .findFirstByUtilisateurOrderByDateFinDesc(initiateur))
                .thenReturn(Optional.of(subscription));

        assertTrue(service.estUtilisateurAbonne(initiateur));
    }

    @Test
    void estUtilisateurAbonne_ShouldExpireFacturation_WhenSubscriptionExpired() {
        Subscription subscription = new Subscription();
        subscription.setDateFin(LocalDateTime.now().minusDays(1));

        Facturation facturation = new Facturation();

        when(subscriptionRepository
                .findFirstByUtilisateurOrderByDateFinDesc(initiateur))
                .thenReturn(Optional.of(subscription));
        when(facturationRepository.findBySubscription(subscription))
                .thenReturn(Optional.of(facturation));

        assertFalse(service.estUtilisateurAbonne(initiateur));
        assertEquals(
                FacturationStatus.ABONNEMENT_EXPIRE,
                facturation.getStatut()
        );
        verify(facturationRepository).save(facturation);
    }

    @Test
    void verifierLimiteMessages_ShouldUseDefaults_WhenValuesNull() {
        initiateur.setNombreChatsUtilises(null);
        initiateur.setMaxMessagesPossible(null);

        assertDoesNotThrow(
                () -> service.verifierLimiteMessages(initiateur)
        );
    }

    @Test
    void incrementerNombreChats_ShouldIncreaseOnlyUsedCount_WhenNotSubscribed() {
        initiateur.setNombreChatsUtilises(3);
        initiateur.setMaxMessagesPossible(50);

        service.incrementerNombreChats(initiateur, false);

        assertEquals(4, initiateur.getNombreChatsUtilises());
        assertEquals(50, initiateur.getMaxMessagesPossible());
    }

    @Test
    void incrementerNombreChats_ShouldIncreaseUsedAndMax_WhenSubscribed() {
        initiateur.setNombreChatsUtilises(3);
        initiateur.setMaxMessagesPossible(50);

        service.incrementerNombreChats(initiateur, true);

        assertEquals(4, initiateur.getNombreChatsUtilises());
        assertEquals(51, initiateur.getMaxMessagesPossible());
    }

    @Test
    void getDerniereSubscription_ShouldDelegateToRepository() {
        Subscription subscription = new Subscription();

        when(subscriptionRepository
                .findFirstByUtilisateurOrderByDateFinDesc(initiateur))
                .thenReturn(Optional.of(subscription));

        Optional<Subscription> result =
                service.getDerniereSubscription(initiateur);

        assertTrue(result.isPresent());
        assertSame(subscription, result.get());
    }
}
