package com.commercial.Pont.Commercial.services;


import com.commercial.Pont.Commercial.dtos.requestDtos.ConversationRequestDto;
import com.commercial.Pont.Commercial.dtos.requestDtos.CreateConversationRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.ConversationResponseDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.MessageResponseDto;
import com.commercial.Pont.Commercial.enums.ConversationStatus;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.ConversationMapperInterface;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.MessageMapperInterface;
import com.commercial.Pont.Commercial.models.Annonce;
import com.commercial.Pont.Commercial.models.Conversation;
import com.commercial.Pont.Commercial.models.Message;
import com.commercial.Pont.Commercial.models.Utilisateur;
import com.commercial.Pont.Commercial.repositories.AnnonceRepository;
import com.commercial.Pont.Commercial.repositories.ConversationRepository;
import com.commercial.Pont.Commercial.repositories.DocumentConversationRepository;
import com.commercial.Pont.Commercial.repositories.MessageRepository;
import com.commercial.Pont.Commercial.repositories.UtilisateurRepository;
import com.commercial.Pont.Commercial.services.ImplementationServices.ConversationServiceImpl;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ConversationServiceImplTest {

    @Mock
    private ConversationRepository conversationRepository;

    @Mock
    private ConversationMapperInterface conversationMapper;

    @Mock
    private MessageMapperInterface messageMapper;

    @Mock
    private UtilisateurRepository utilisateurRepository;

    @Mock
    private AnnonceRepository annonceRepository;

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private DocumentConversationRepository documentConversationRepository;

    @InjectMocks
    private ConversationServiceImpl conversationService;


    private UUID conversationId;

    private UUID initiateurId;

    private UUID destinataireId;

    private UUID annonceId;


    private Utilisateur initiateur;

    private Utilisateur destinataire;

    private Annonce annonce;

    private Conversation conversation;

    private ConversationResponseDto responseDto;

    private Authentication authentication;


    @BeforeEach
    void setUp() {

        conversationId =
                UUID.randomUUID();

        initiateurId =
                UUID.randomUUID();

        destinataireId =
                UUID.randomUUID();

        annonceId =
                UUID.randomUUID();


        initiateur =
                new Utilisateur();

        initiateur.setUtilisateurId(
                initiateurId
        );

        initiateur.setEmail(
                "initiateur@test.com"
        );


        destinataire =
                new Utilisateur();

        destinataire.setUtilisateurId(
                destinataireId
        );

        destinataire.setEmail(
                "vendeur@test.com"
        );


        annonce =
                new Annonce();

        annonce.setUtilisateur(
                destinataire
        );


        conversation =
                new Conversation();

        conversation.setInitiateur(
                initiateur
        );

        conversation.setDestinataire(
                destinataire
        );

        conversation.setAnnonce(
                annonce
        );


        responseDto =
                mock(
                        ConversationResponseDto.class
                );


        authentication =
                mock(Authentication.class);
    }


    // =========================================================
    // CREATE
    // =========================================================

    @Test
    void create_ShouldCreateConversationSuccessfully() {

        ConversationRequestDto requestDto =
                mock(
                        ConversationRequestDto.class
                );


        when(
                conversationMapper
                        .requestToEntity(requestDto)
        )
                .thenReturn(conversation);


        when(
                conversationRepository
                        .save(conversation)
        )
                .thenReturn(conversation);


        when(
                conversationMapper
                        .entityToResponse(conversation)
        )
                .thenReturn(responseDto);


        ConversationResponseDto result =
                conversationService.create(
                        requestDto
                );


        assertSame(
                responseDto,
                result
        );


        assertEquals(
                0,
                conversation.getNombreMessages()
        );


        assertNotNull(
                conversation.getCreatedAt()
        );

        assertNotNull(
                conversation.getUpdatedAt()
        );


        verify(conversationMapper)
                .requestToEntity(requestDto);

        verify(conversationRepository)
                .save(conversation);

        verify(conversationMapper)
                .entityToResponse(conversation);
    }


    // =========================================================
    // UPDATE
    // =========================================================

    @Test
    void update_ShouldUpdateConversationSuccessfully() {

        ConversationRequestDto requestDto =
                mock(
                        ConversationRequestDto.class
                );


        LocalDateTime dateDernierMessage =
                LocalDateTime.now();


        when(requestDto.getStatut())
                .thenReturn(
                        ConversationStatus.EN_NEGOCIATION
                );

        when(requestDto.getDateDernierMessage())
                .thenReturn(
                        dateDernierMessage
                );


        when(
                conversationRepository
                        .findById(conversationId)
        )
                .thenReturn(
                        Optional.of(conversation)
                );


        when(
                conversationRepository
                        .save(conversation)
        )
                .thenReturn(conversation);


        when(
                conversationMapper
                        .entityToResponse(conversation)
        )
                .thenReturn(responseDto);


        ConversationResponseDto result =
                conversationService.update(
                        conversationId,
                        requestDto
                );


        assertSame(
                responseDto,
                result
        );


        assertEquals(
                ConversationStatus.EN_NEGOCIATION,
                conversation.getStatut()
        );


        assertEquals(
                dateDernierMessage,
                conversation.getDateDernierMessage()
        );


        assertNotNull(
                conversation.getUpdatedAt()
        );


        verify(conversationRepository)
                .findById(conversationId);

        verify(conversationRepository)
                .save(conversation);
    }


    @Test
    void update_ShouldThrowException_WhenConversationDoesNotExist() {

        ConversationRequestDto requestDto =
                mock(
                        ConversationRequestDto.class
                );


        when(
                conversationRepository
                        .findById(conversationId)
        )
                .thenReturn(
                        Optional.empty()
                );


        assertThrows(
                EntityNotFoundException.class,
                () ->
                        conversationService.update(
                                conversationId,
                                requestDto
                        )
        );


        verify(conversationRepository)
                .findById(conversationId);

        verify(conversationRepository, never())
                .save(any());
    }


    // =========================================================
    // GET BY ID
    // =========================================================

    @Test
    void getById_ShouldReturnConversation_WhenExists() {

        when(
                conversationRepository
                        .findById(conversationId)
        )
                .thenReturn(
                        Optional.of(conversation)
                );


        when(
                conversationMapper
                        .entityToResponse(conversation)
        )
                .thenReturn(responseDto);


        ConversationResponseDto result =
                conversationService.getById(
                        conversationId
                );


        assertSame(
                responseDto,
                result
        );


        verify(conversationRepository)
                .findById(conversationId);

        verify(conversationMapper)
                .entityToResponse(conversation);
    }


    @Test
    void getById_ShouldThrowException_WhenConversationDoesNotExist() {

        when(
                conversationRepository
                        .findById(conversationId)
        )
                .thenReturn(
                        Optional.empty()
                );


        assertThrows(
                EntityNotFoundException.class,
                () ->
                        conversationService.getById(
                                conversationId
                        )
        );


        verify(conversationRepository)
                .findById(conversationId);

        verifyNoInteractions(
                conversationMapper
        );
    }


    // =========================================================
    // GET ALL
    // =========================================================

    @Test
    void getAll_ShouldReturnAllConversations() {

        Conversation secondConversation =
                new Conversation();

        ConversationResponseDto secondResponse =
                mock(
                        ConversationResponseDto.class
                );


        when(
                conversationRepository
                        .findAll()
        )
                .thenReturn(
                        List.of(
                                conversation,
                                secondConversation
                        )
                );


        when(
                conversationMapper
                        .entityToResponse(conversation)
        )
                .thenReturn(responseDto);


        when(
                conversationMapper
                        .entityToResponse(secondConversation)
        )
                .thenReturn(secondResponse);


        List<ConversationResponseDto> result =
                conversationService.getAll();


        assertEquals(
                2,
                result.size()
        );


        assertSame(
                responseDto,
                result.get(0)
        );

        assertSame(
                secondResponse,
                result.get(1)
        );


        verify(conversationRepository)
                .findAll();

        verify(conversationMapper, times(2))
                .entityToResponse(
                        any(Conversation.class)
                );
    }


    @Test
    void getAll_ShouldReturnEmptyList_WhenNoConversationExists() {

        when(
                conversationRepository
                        .findAll()
        )
                .thenReturn(
                        List.of()
                );


        List<ConversationResponseDto> result =
                conversationService.getAll();


        assertNotNull(result);

        assertTrue(
                result.isEmpty()
        );


        verify(conversationRepository)
                .findAll();
    }


    // =========================================================
    // DELETE
    // =========================================================

    @Test
    void delete_ShouldDeleteConversation_WhenExists() {

        when(
                conversationRepository
                        .existsById(conversationId)
        )
                .thenReturn(true);


        conversationService.delete(
                conversationId
        );


        verify(conversationRepository)
                .existsById(conversationId);

        verify(conversationRepository)
                .deleteById(conversationId);
    }


    @Test
    void delete_ShouldThrowException_WhenConversationDoesNotExist() {

        when(
                conversationRepository
                        .existsById(conversationId)
        )
                .thenReturn(false);


        assertThrows(
                EntityNotFoundException.class,
                () ->
                        conversationService.delete(
                                conversationId
                        )
        );


        verify(conversationRepository)
                .existsById(conversationId);

        verify(conversationRepository, never())
                .deleteById(any());
    }


    // =========================================================
    // UPDATE STATUS SIMPLE
    // =========================================================

    @Test
    void updateStatus_ShouldUpdateStatusSuccessfully() {

        when(
                conversationRepository
                        .findById(conversationId)
        )
                .thenReturn(
                        Optional.of(conversation)
                );


        when(
                conversationRepository
                        .save(conversation)
        )
                .thenReturn(conversation);


        when(
                conversationMapper
                        .entityToResponse(conversation)
        )
                .thenReturn(responseDto);


        ConversationResponseDto result =
                conversationService.updateStatus(
                        conversationId,
                        ConversationStatus.CONCLUE
                );


        assertSame(
                responseDto,
                result
        );


        assertEquals(
                ConversationStatus.CONCLUE,
                conversation.getStatut()
        );


        assertNotNull(
                conversation.getUpdatedAt()
        );


        verify(conversationRepository)
                .save(conversation);
    }


    @Test
    void updateStatus_ShouldThrowException_WhenConversationDoesNotExist() {

        when(
                conversationRepository
                        .findById(conversationId)
        )
                .thenReturn(
                        Optional.empty()
                );


        assertThrows(
                EntityNotFoundException.class,
                () ->
                        conversationService.updateStatus(
                                conversationId,
                                ConversationStatus.CONCLUE
                        )
        );


        verify(conversationRepository, never())
                .save(any());
    }


    // =========================================================
    // CREATE MY CONVERSATION
    // =========================================================

    @Test
    void createMyConversation_ShouldCreateNewConversationSuccessfully() {

        CreateConversationRequestDto request =
                mock(
                        CreateConversationRequestDto.class
                );


        when(authentication.getName())
                .thenReturn(
                        "initiateur@test.com"
                );


        when(request.getAnnonceId())
                .thenReturn(
                        annonceId
                );


        when(
                utilisateurRepository.findByEmail(
                        "initiateur@test.com"
                )
        )
                .thenReturn(
                        Optional.of(initiateur)
                );


        when(
                annonceRepository.findById(
                        annonceId
                )
        )
                .thenReturn(
                        Optional.of(annonce)
                );


        when(
                conversationRepository
                        .findByInitiateurAndDestinataireAndAnnonce(
                                initiateur,
                                destinataire,
                                annonce
                        )
        )
                .thenReturn(
                        Optional.empty()
                );


        when(
                conversationRepository
                        .save(any(Conversation.class))
        )
                .thenAnswer(
                        invocation ->
                                invocation.getArgument(0)
                );


        when(
                conversationMapper
                        .entityToResponse(
                                any(Conversation.class)
                        )
        )
                .thenReturn(responseDto);


        ConversationResponseDto result =
                conversationService
                        .createMyConversation(
                                request,
                                authentication
                        );


        assertSame(
                responseDto,
                result
        );


        ArgumentCaptor<Conversation> captor =
                ArgumentCaptor.forClass(
                        Conversation.class
                );


        verify(conversationRepository)
                .save(
                        captor.capture()
                );


        Conversation savedConversation =
                captor.getValue();


        assertSame(
                initiateur,
                savedConversation.getInitiateur()
        );

        assertSame(
                destinataire,
                savedConversation.getDestinataire()
        );

        assertSame(
                annonce,
                savedConversation.getAnnonce()
        );


        assertEquals(
                ConversationStatus.SUGGEREE,
                savedConversation.getStatut()
        );


        assertEquals(
                0,
                savedConversation.getNombreMessages()
        );


        assertNull(
                savedConversation.getDateDernierMessage()
        );


        assertNotNull(
                savedConversation.getCreatedAt()
        );

        assertNotNull(
                savedConversation.getUpdatedAt()
        );
    }


    // =========================================================
    // UTILISATEUR CONNECTE INTROUVABLE
    // =========================================================

    @Test
    void createMyConversation_ShouldThrowException_WhenConnectedUserDoesNotExist() {

        CreateConversationRequestDto request =
                mock(
                        CreateConversationRequestDto.class
                );


        when(authentication.getName())
                .thenReturn(
                        "unknown@test.com"
                );


        when(
                utilisateurRepository.findByEmail(
                        "unknown@test.com"
                )
        )
                .thenReturn(
                        Optional.empty()
                );


        EntityNotFoundException exception =
                assertThrows(
                        EntityNotFoundException.class,
                        () ->
                                conversationService
                                        .createMyConversation(
                                                request,
                                                authentication
                                        )
                );


        assertEquals(
                "Utilisateur connecté non trouvé.",
                exception.getMessage()
        );


        verifyNoInteractions(
                annonceRepository
        );


        verify(
                conversationRepository,
                never()
        )
                .save(any());
    }


    // =========================================================
    // ANNONCE INTROUVABLE
    // =========================================================

    @Test
    void createMyConversation_ShouldThrowException_WhenAnnonceDoesNotExist() {

        CreateConversationRequestDto request =
                mock(
                        CreateConversationRequestDto.class
                );


        when(authentication.getName())
                .thenReturn(
                        "initiateur@test.com"
                );


        when(request.getAnnonceId())
                .thenReturn(
                        annonceId
                );


        when(
                utilisateurRepository.findByEmail(
                        "initiateur@test.com"
                )
        )
                .thenReturn(
                        Optional.of(initiateur)
                );


        when(
                annonceRepository.findById(
                        annonceId
                )
        )
                .thenReturn(
                        Optional.empty()
                );


        assertThrows(
                EntityNotFoundException.class,
                () ->
                        conversationService
                                .createMyConversation(
                                        request,
                                        authentication
                                )
        );


        verify(
                conversationRepository,
                never()
        )
                .save(any());
    }


    // =========================================================
    // PROPRE ANNONCE
    // =========================================================

    @Test
    void createMyConversation_ShouldThrowException_WhenUserContactsOwnAnnonce() {

        CreateConversationRequestDto request =
                mock(
                        CreateConversationRequestDto.class
                );


        /*
         * L'annonce appartient à l'utilisateur connecté.
         */
        annonce.setUtilisateur(
                initiateur
        );


        when(authentication.getName())
                .thenReturn(
                        "initiateur@test.com"
                );


        when(request.getAnnonceId())
                .thenReturn(
                        annonceId
                );


        when(
                utilisateurRepository.findByEmail(
                        "initiateur@test.com"
                )
        )
                .thenReturn(
                        Optional.of(initiateur)
                );


        when(
                annonceRepository.findById(
                        annonceId
                )
        )
                .thenReturn(
                        Optional.of(annonce)
                );


        IllegalStateException exception =
                assertThrows(
                        IllegalStateException.class,
                        () ->
                                conversationService
                                        .createMyConversation(
                                                request,
                                                authentication
                                        )
                );


        assertEquals(
                "Vous ne pouvez pas créer une conversation avec vous-même.",
                exception.getMessage()
        );


        verify(
                conversationRepository,
                never()
        )
                .save(any());
    }


    // =========================================================
    // CONVERSATION EXISTANTE
    // =========================================================

    @Test
    void createMyConversation_ShouldReturnExistingConversation_WhenAlreadyExists() {

        CreateConversationRequestDto request =
                mock(
                        CreateConversationRequestDto.class
                );


        when(authentication.getName())
                .thenReturn(
                        "initiateur@test.com"
                );


        when(request.getAnnonceId())
                .thenReturn(
                        annonceId
                );


        when(
                utilisateurRepository.findByEmail(
                        "initiateur@test.com"
                )
        )
                .thenReturn(
                        Optional.of(initiateur)
                );


        when(
                annonceRepository.findById(
                        annonceId
                )
        )
                .thenReturn(
                        Optional.of(annonce)
                );


        when(
                conversationRepository
                        .findByInitiateurAndDestinataireAndAnnonce(
                                initiateur,
                                destinataire,
                                annonce
                        )
        )
                .thenReturn(
                        Optional.of(conversation)
                );


        when(
                conversationMapper
                        .entityToResponse(conversation)
        )
                .thenReturn(responseDto);


        ConversationResponseDto result =
                conversationService
                        .createMyConversation(
                                request,
                                authentication
                        );


        assertSame(
                responseDto,
                result
        );


        verify(
                conversationRepository,
                never()
        )
                .save(any());
    }


    // =========================================================
    // GET MY CONVERSATIONS
    // =========================================================

    @Test
    void getMyConversations_ShouldReturnUserConversations() {

        when(authentication.getName())
                .thenReturn(
                        "initiateur@test.com"
                );


        when(
                utilisateurRepository.findByEmail(
                        "initiateur@test.com"
                )
        )
                .thenReturn(
                        Optional.of(initiateur)
                );


        when(
                conversationRepository
                        .findByInitiateurOrDestinataire(
                                initiateur,
                                initiateur
                        )
        )
                .thenReturn(
                        List.of(conversation)
                );


        when(
                conversationMapper
                        .entityToResponse(conversation)
        )
                .thenReturn(responseDto);


        List<ConversationResponseDto> result =
                conversationService
                        .getMyConversations(
                                authentication
                        );


        assertEquals(
                1,
                result.size()
        );


        assertSame(
                responseDto,
                result.get(0)
        );
    }


    @Test
    void getMyConversations_ShouldThrowException_WhenUserDoesNotExist() {

        when(authentication.getName())
                .thenReturn(
                        "unknown@test.com"
                );


        when(
                utilisateurRepository.findByEmail(
                        "unknown@test.com"
                )
        )
                .thenReturn(
                        Optional.empty()
                );


        assertThrows(
                EntityNotFoundException.class,
                () ->
                        conversationService
                                .getMyConversations(
                                        authentication
                                )
        );


        verify(
                conversationRepository,
                never()
        )
                .findByInitiateurOrDestinataire(
                        any(),
                        any()
                );
    }


    // =========================================================
    // GET MESSAGES
    // =========================================================

    @Test
    void getMessages_ShouldReturnMessages_WhenUserIsParticipant() {

        Message message =
                new Message();

        MessageResponseDto messageResponse =
                mock(
                        MessageResponseDto.class
                );


        when(authentication.getName())
                .thenReturn(
                        "initiateur@test.com"
                );


        when(
                utilisateurRepository.findByEmail(
                        "initiateur@test.com"
                )
        )
                .thenReturn(
                        Optional.of(initiateur)
                );


        when(
                conversationRepository.findById(
                        conversationId
                )
        )
                .thenReturn(
                        Optional.of(conversation)
                );


        when(
                messageRepository
                        .findByConversationOrderByDateEnvoiAsc(
                                conversation
                        )
        )
                .thenReturn(
                        List.of(message)
                );


        when(
                messageMapper
                        .entityToResponse(message)
        )
                .thenReturn(
                        messageResponse
                );


        List<MessageResponseDto> result =
                conversationService.getMessages(
                        conversationId,
                        authentication
                );


        assertEquals(
                1,
                result.size()
        );


        assertSame(
                messageResponse,
                result.get(0)
        );
    }


    @Test
    void getMessages_ShouldThrowAccessDenied_WhenUserIsNotParticipant() {

        Utilisateur outsider =
                new Utilisateur();

        outsider.setUtilisateurId(
                UUID.randomUUID()
        );


        when(authentication.getName())
                .thenReturn(
                        "outsider@test.com"
                );


        when(
                utilisateurRepository.findByEmail(
                        "outsider@test.com"
                )
        )
                .thenReturn(
                        Optional.of(outsider)
                );


        when(
                conversationRepository.findById(
                        conversationId
                )
        )
                .thenReturn(
                        Optional.of(conversation)
                );


        AccessDeniedException exception =
                assertThrows(
                        AccessDeniedException.class,
                        () ->
                                conversationService.getMessages(
                                        conversationId,
                                        authentication
                                )
                );


        assertEquals(
                "Vous ne participez pas à cette conversation.",
                exception.getMessage()
        );


        verify(
                messageRepository,
                never()
        )
                .findByConversationOrderByDateEnvoiAsc(
                        any()
                );
    }


    @Test
    void getMessages_ShouldThrowException_WhenConversationDoesNotExist() {

        when(authentication.getName())
                .thenReturn(
                        "initiateur@test.com"
                );


        when(
                utilisateurRepository.findByEmail(
                        "initiateur@test.com"
                )
        )
                .thenReturn(
                        Optional.of(initiateur)
                );


        when(
                conversationRepository.findById(
                        conversationId
                )
        )
                .thenReturn(
                        Optional.empty()
                );


        assertThrows(
                EntityNotFoundException.class,
                () ->
                        conversationService.getMessages(
                                conversationId,
                                authentication
                        )
        );


        verifyNoInteractions(
                messageRepository
        );
    }


    // =========================================================
    // UPDATE STATUS AUTHENTICATED
    // =========================================================

    @Test
    void updateStatusAuthenticated_ShouldUpdate_WhenUserIsParticipant() {

        when(authentication.getName())
                .thenReturn(
                        "initiateur@test.com"
                );


        when(
                utilisateurRepository.findByEmail(
                        "initiateur@test.com"
                )
        )
                .thenReturn(
                        Optional.of(initiateur)
                );


        when(
                conversationRepository.findById(
                        conversationId
                )
        )
                .thenReturn(
                        Optional.of(conversation)
                );


        when(
                conversationRepository.save(
                        conversation
                )
        )
                .thenReturn(conversation);


        when(
                conversationMapper
                        .entityToResponse(conversation)
        )
                .thenReturn(responseDto);


        ConversationResponseDto result =
                conversationService.updateStatus(
                        conversationId,
                        ConversationStatus.EN_NEGOCIATION,
                        authentication
                );


        assertSame(
                responseDto,
                result
        );


        assertEquals(
                ConversationStatus.EN_NEGOCIATION,
                conversation.getStatut()
        );


        assertNotNull(
                conversation.getUpdatedAt()
        );


        verify(conversationRepository)
                .save(conversation);
    }


    @Test
    void updateStatusAuthenticated_ShouldWork_WhenUserIsDestinataire() {

        when(authentication.getName())
                .thenReturn(
                        "vendeur@test.com"
                );


        when(
                utilisateurRepository.findByEmail(
                        "vendeur@test.com"
                )
        )
                .thenReturn(
                        Optional.of(destinataire)
                );


        when(
                conversationRepository.findById(
                        conversationId
                )
        )
                .thenReturn(
                        Optional.of(conversation)
                );


        when(
                conversationRepository.save(
                        conversation
                )
        )
                .thenReturn(conversation);


        when(
                conversationMapper
                        .entityToResponse(conversation)
        )
                .thenReturn(responseDto);


        ConversationResponseDto result =
                conversationService.updateStatus(
                        conversationId,
                        ConversationStatus.CONCLUE,
                        authentication
                );


        assertSame(
                responseDto,
                result
        );


        assertEquals(
                ConversationStatus.CONCLUE,
                conversation.getStatut()
        );
    }


    @Test
    void updateStatusAuthenticated_ShouldThrowAccessDenied_WhenUserIsNotParticipant() {

        Utilisateur outsider =
                new Utilisateur();

        outsider.setUtilisateurId(
                UUID.randomUUID()
        );


        when(authentication.getName())
                .thenReturn(
                        "outsider@test.com"
                );


        when(
                utilisateurRepository.findByEmail(
                        "outsider@test.com"
                )
        )
                .thenReturn(
                        Optional.of(outsider)
                );


        when(
                conversationRepository.findById(
                        conversationId
                )
        )
                .thenReturn(
                        Optional.of(conversation)
                );


        AccessDeniedException exception =
                assertThrows(
                        AccessDeniedException.class,
                        () ->
                                conversationService.updateStatus(
                                        conversationId,
                                        ConversationStatus.CONCLUE,
                                        authentication
                                )
                );


        assertEquals(
                "Vous ne participez pas à cette conversation.",
                exception.getMessage()
        );


        verify(
                conversationRepository,
                never()
        )
                .save(any());
    }


    @Test
    void updateStatusAuthenticated_ShouldThrowException_WhenUserDoesNotExist() {

        when(authentication.getName())
                .thenReturn(
                        "unknown@test.com"
                );


        when(
                utilisateurRepository.findByEmail(
                        "unknown@test.com"
                )
        )
                .thenReturn(
                        Optional.empty()
                );


        assertThrows(
                EntityNotFoundException.class,
                () ->
                        conversationService.updateStatus(
                                conversationId,
                                ConversationStatus.CONCLUE,
                                authentication
                        )
        );


        verify(
                conversationRepository,
                never()
        )
                .findById(any());
    }


    @Test
    void updateStatusAuthenticated_ShouldThrowException_WhenConversationDoesNotExist() {

        when(authentication.getName())
                .thenReturn(
                        "initiateur@test.com"
                );


        when(
                utilisateurRepository.findByEmail(
                        "initiateur@test.com"
                )
        )
                .thenReturn(
                        Optional.of(initiateur)
                );


        when(
                conversationRepository.findById(
                        conversationId
                )
        )
                .thenReturn(
                        Optional.empty()
                );


        assertThrows(
                EntityNotFoundException.class,
                () ->
                        conversationService.updateStatus(
                                conversationId,
                                ConversationStatus.CONCLUE,
                                authentication
                        )
        );


        verify(
                conversationRepository,
                never()
        )
                .save(any());
    }
}
