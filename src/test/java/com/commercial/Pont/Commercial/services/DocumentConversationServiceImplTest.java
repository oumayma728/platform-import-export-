package com.commercial.Pont.Commercial.services;

import com.commercial.Pont.Commercial.dtos.requestDtos.DocumentConversationRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.DocumentConversationResponseDto;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.DocumentConversationMapperInterface;
import com.commercial.Pont.Commercial.models.Conversation;
import com.commercial.Pont.Commercial.models.DocumentConversation;
import com.commercial.Pont.Commercial.models.Utilisateur;
import com.commercial.Pont.Commercial.repositories.ConversationRepository;
import com.commercial.Pont.Commercial.repositories.DocumentConversationRepository;
import com.commercial.Pont.Commercial.repositories.UtilisateurRepository;
import com.commercial.Pont.Commercial.services.FileStorageService;
import com.commercial.Pont.Commercial.services.ImplementationServices.DocumentConversationServiceImpl;
import com.commercial.Pont.Commercial.services.ImplementationServices.MessageServiceImpl;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.NotificationServiceInterface;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DocumentConversationServiceImplTest {

    @Mock private DocumentConversationRepository documentConversationRepository;
    @Mock private DocumentConversationMapperInterface documentConversationMapper;
    @Mock private UtilisateurRepository utilisateurRepository;
    @Mock private ConversationRepository conversationRepository;
    @Mock private FileStorageService fileStorageService;
    @Mock private SimpMessagingTemplate messagingTemplate;
    @Mock private MessageServiceImpl messageService;
    @Mock private NotificationServiceInterface notificationService;
    @Mock private Authentication authentication;

    @InjectMocks
    private DocumentConversationServiceImpl service;

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

        destinataire = new Utilisateur();
        destinataire.setUtilisateurId(destinataireId);
        destinataire.setEmail("dest@test.com");
        destinataire.setNombreChatsUtilises(0);

        conversation = new Conversation();
        conversation.setConversationId(conversationId);
        conversation.setInitiateur(initiateur);
        conversation.setDestinataire(destinataire);
        conversation.setNombreMessages(0);
    }

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void create_ShouldCreateDocumentSuccessfully() {
        DocumentConversationRequestDto request =
                mock(DocumentConversationRequestDto.class);
        DocumentConversation document = new DocumentConversation();
        DocumentConversationResponseDto response =
                mock(DocumentConversationResponseDto.class);

        when(request.getUtilisateurId()).thenReturn(initiateurId);
        when(request.getConversationId()).thenReturn(conversationId);
        when(documentConversationMapper.requestToEntity(request))
                .thenReturn(document);
        when(utilisateurRepository.findById(initiateurId))
                .thenReturn(Optional.of(initiateur));
        when(conversationRepository.findById(conversationId))
                .thenReturn(Optional.of(conversation));
        when(documentConversationRepository.save(document))
                .thenReturn(document);
        when(documentConversationMapper.entityToResponse(document))
                .thenReturn(response);

        assertSame(response, service.create(request));

        assertSame(initiateur, document.getExpediteur());
        assertSame(conversation, document.getConversation());
        assertFalse(document.getEstLu());
        assertEquals(1, conversation.getNombreMessages());
        assertEquals(1, initiateur.getNombreChatsUtilises());
    }

    @Test
    void create_ShouldThrow_WhenUserMissing() {
        DocumentConversationRequestDto request =
                mock(DocumentConversationRequestDto.class);

        when(request.getUtilisateurId()).thenReturn(initiateurId);
        when(documentConversationMapper.requestToEntity(request))
                .thenReturn(new DocumentConversation());
        when(utilisateurRepository.findById(initiateurId))
                .thenReturn(Optional.empty());

        assertThrows(
                EntityNotFoundException.class,
                () -> service.create(request)
        );
    }

    @Test
    void create_ShouldThrow_WhenConversationMissing() {
        DocumentConversationRequestDto request =
                mock(DocumentConversationRequestDto.class);

        when(request.getUtilisateurId()).thenReturn(initiateurId);
        when(request.getConversationId()).thenReturn(conversationId);
        when(documentConversationMapper.requestToEntity(request))
                .thenReturn(new DocumentConversation());
        when(utilisateurRepository.findById(initiateurId))
                .thenReturn(Optional.of(initiateur));
        when(conversationRepository.findById(conversationId))
                .thenReturn(Optional.empty());

        assertThrows(
                EntityNotFoundException.class,
                () -> service.create(request)
        );
    }

    @Test
    void update_ShouldUpdateDocumentAndRelations() {
        UUID documentId = UUID.randomUUID();
        UUID newUserId = UUID.randomUUID();
        UUID newConversationId = UUID.randomUUID();

        Utilisateur newUser = new Utilisateur();
        newUser.setUtilisateurId(newUserId);

        Conversation newConversation = new Conversation();
        newConversation.setConversationId(newConversationId);

        DocumentConversation document = new DocumentConversation();
        document.setExpediteur(initiateur);
        document.setConversation(conversation);

        DocumentConversationRequestDto request =
                mock(DocumentConversationRequestDto.class);

        when(request.getNomFichier()).thenReturn("new.pdf");
        when(request.getCheminFichier()).thenReturn("/new.pdf");
        when(request.getExtension()).thenReturn("pdf");
        when(request.getTaille()).thenReturn(100L);
        when(request.getUtilisateurId()).thenReturn(newUserId);
        when(request.getConversationId()).thenReturn(newConversationId);

        when(documentConversationRepository.findById(documentId))
                .thenReturn(Optional.of(document));
        when(utilisateurRepository.findById(newUserId))
                .thenReturn(Optional.of(newUser));
        when(conversationRepository.findById(newConversationId))
                .thenReturn(Optional.of(newConversation));
        when(documentConversationRepository.save(document))
                .thenReturn(document);

        service.update(documentId, request);

        assertEquals("new.pdf", document.getNomFichier());
        assertSame(newUser, document.getExpediteur());
        assertSame(newConversation, document.getConversation());
    }

    @Test
    void getById_ShouldReturnMappedDocument() {
        UUID id = UUID.randomUUID();
        DocumentConversation document = new DocumentConversation();
        DocumentConversationResponseDto dto =
                mock(DocumentConversationResponseDto.class);

        when(documentConversationRepository.findById(id))
                .thenReturn(Optional.of(document));
        when(documentConversationMapper.entityToResponse(document))
                .thenReturn(dto);

        assertSame(dto, service.getById(id));
    }

    @Test
    void getAll_ShouldReturnMappedDocuments() {
        DocumentConversation d1 = new DocumentConversation();
        DocumentConversation d2 = new DocumentConversation();

        when(documentConversationRepository.findAll())
                .thenReturn(List.of(d1, d2));
        when(documentConversationMapper.entityToResponse(any()))
                .thenReturn(mock(DocumentConversationResponseDto.class));

        assertEquals(2, service.getAll().size());
    }

    @Test
    void delete_ShouldDelete_WhenExists() {
        UUID id = UUID.randomUUID();
        when(documentConversationRepository.existsById(id))
                .thenReturn(true);

        service.delete(id);

        verify(documentConversationRepository).deleteById(id);
    }

    @Test
    void delete_ShouldThrow_WhenMissing() {
        UUID id = UUID.randomUUID();
        when(documentConversationRepository.existsById(id))
                .thenReturn(false);

        assertThrows(
                EntityNotFoundException.class,
                () -> service.delete(id)
        );
    }

    @Test
    void addDocumentToConversation_ShouldRejectNullFile() {
        assertThrows(
                IllegalArgumentException.class,
                () -> service.addDocumentToConversation(
                        conversationId,
                        null
                )
        );
    }

    @Test
    void addDocumentToConversation_ShouldRejectEmptyFile() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "empty.txt",
                "text/plain",
                new byte[0]
        );

        assertThrows(
                IllegalArgumentException.class,
                () -> service.addDocumentToConversation(
                        conversationId,
                        file
                )
        );
    }

    @Test
    void addDocumentToConversation_ShouldRejectUnauthenticatedUser() {
        MockMultipartFile file = file("test.pdf");
        Authentication auth = mock(Authentication.class);
        when(auth.isAuthenticated()).thenReturn(false);
        SecurityContextHolder.getContext().setAuthentication(auth);

        assertThrows(
                IllegalStateException.class,
                () -> service.addDocumentToConversation(
                        conversationId,
                        file
                )
        );
    }

    @Test
    void addDocumentToConversation_ShouldRejectNonParticipant() {
        MockMultipartFile file = file("test.pdf");

        Utilisateur outsider = new Utilisateur();
        outsider.setUtilisateurId(UUID.randomUUID());
        outsider.setEmail("out@test.com");

        setAuthenticatedUser("out@test.com");
        when(utilisateurRepository.findByEmail("out@test.com"))
                .thenReturn(Optional.of(outsider));
        when(messageService.estUtilisateurAbonne(outsider))
                .thenReturn(true);
        when(conversationRepository.findById(conversationId))
                .thenReturn(Optional.of(conversation));

        assertThrows(
                AccessDeniedException.class,
                () -> service.addDocumentToConversation(
                        conversationId,
                        file
                )
        );
    }

    @Test
    void addDocumentToConversation_ShouldRejectInvalidFilename() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                null,
                "application/octet-stream",
                "abc".getBytes(StandardCharsets.UTF_8)
        );

        setAuthenticatedUser("init@test.com");
        when(utilisateurRepository.findByEmail("init@test.com"))
                .thenReturn(Optional.of(initiateur));
        when(messageService.estUtilisateurAbonne(initiateur))
                .thenReturn(true);
        when(conversationRepository.findById(conversationId))
                .thenReturn(Optional.of(conversation));

        assertThrows(
                IllegalArgumentException.class,
                () -> service.addDocumentToConversation(
                        conversationId,
                        file
                )
        );
    }

    @Test
    void addDocumentToConversation_ShouldStoreAndNotify() {
        MockMultipartFile file = file("document.pdf");
        DocumentConversationResponseDto response =
                mock(DocumentConversationResponseDto.class);

        setAuthenticatedUser("init@test.com");

        when(utilisateurRepository.findByEmail("init@test.com"))
                .thenReturn(Optional.of(initiateur));
        when(messageService.estUtilisateurAbonne(initiateur))
                .thenReturn(false);
        when(conversationRepository.findById(conversationId))
                .thenReturn(Optional.of(conversation));
        when(fileStorageService.store(file))
                .thenReturn("/uploads/document.pdf");
        when(documentConversationRepository.save(any(DocumentConversation.class)))
                .thenAnswer(i -> i.getArgument(0));
        when(documentConversationMapper.entityToResponse(any()))
                .thenReturn(response);

        DocumentConversationResponseDto result =
                service.addDocumentToConversation(
                        conversationId,
                        file
                );

        assertSame(response, result);

        verify(messageService)
                .verifierLimiteMessages(initiateur);
        verify(messageService)
                .incrementerNombreChats(initiateur, false);
        verify(notificationService)
                .notifierNouveauMessage(destinataire, initiateur);
        verify(messagingTemplate).convertAndSend(
                eq("/topic/conversations/" + conversationId),
                any(Object.class)
        );
    }

    @Test
    void getDocumentsByConversation_ShouldReturnDocuments_ForParticipant() {
        setAuthenticatedUser("init@test.com");

        DocumentConversation document =
                new DocumentConversation();
        DocumentConversationResponseDto dto =
                mock(DocumentConversationResponseDto.class);

        when(conversationRepository.findById(conversationId))
                .thenReturn(Optional.of(conversation));
        when(documentConversationRepository
                .findByConversation_ConversationId(conversationId))
                .thenReturn(List.of(document));
        when(documentConversationMapper.entityToResponse(document))
                .thenReturn(dto);

        List<DocumentConversationResponseDto> result =
                service.getDocumentsByConversation(conversationId);

        assertEquals(1, result.size());
    }

    @Test
    void getDocumentsByConversation_ShouldRejectNonParticipant() {
        setAuthenticatedUser("out@test.com");
        when(conversationRepository.findById(conversationId))
                .thenReturn(Optional.of(conversation));

        assertThrows(
                IllegalStateException.class,
                () -> service.getDocumentsByConversation(
                        conversationId
                )
        );
    }

    @Test
    void deleteDocumentFromConversation_ShouldDeleteOwnDocument() {
        UUID documentId = UUID.randomUUID();

        DocumentConversation document =
                new DocumentConversation();
        document.setConversation(conversation);
        document.setExpediteur(initiateur);
        document.setCheminFichier("/uploads/doc.pdf");

        setAuthenticatedUser("init@test.com");

        when(documentConversationRepository.findById(documentId))
                .thenReturn(Optional.of(document));

        service.deleteDocumentFromConversation(
                conversationId,
                documentId
        );

        verify(fileStorageService).delete("/uploads/doc.pdf");
        verify(documentConversationRepository).delete(document);
    }

    @Test
    void deleteDocumentFromConversation_ShouldRejectWrongConversation() {
        UUID documentId = UUID.randomUUID();

        Conversation other = new Conversation();
        other.setConversationId(UUID.randomUUID());

        DocumentConversation document =
                new DocumentConversation();
        document.setConversation(other);

        setAuthenticatedUser("init@test.com");
        when(documentConversationRepository.findById(documentId))
                .thenReturn(Optional.of(document));

        assertThrows(
                IllegalArgumentException.class,
                () -> service.deleteDocumentFromConversation(
                        conversationId,
                        documentId
                )
        );
    }

    @Test
    void markAsRead_ShouldMarkDocument() {
        UUID documentId = UUID.randomUUID();

        DocumentConversation document =
                new DocumentConversation();
        document.setConversation(conversation);
        document.setExpediteur(initiateur);

        DocumentConversationResponseDto response =
                mock(DocumentConversationResponseDto.class);

        when(authentication.getName()).thenReturn("dest@test.com");
        when(utilisateurRepository.findByEmail("dest@test.com"))
                .thenReturn(Optional.of(destinataire));
        when(documentConversationRepository.findById(documentId))
                .thenReturn(Optional.of(document));
        when(documentConversationRepository.save(document))
                .thenReturn(document);
        when(documentConversationMapper.entityToResponse(document))
                .thenReturn(response);

        assertSame(
                response,
                service.markAsRead(documentId, authentication)
        );

        assertTrue(document.getEstLu());
        assertNotNull(document.getDateLecture());

        verify(messagingTemplate).convertAndSend(
                eq("/topic/conversations/" + conversationId),
                any(Object.class)
        );
    }

    @Test
    void markAsRead_ShouldRejectOwnDocument() {
        UUID documentId = UUID.randomUUID();

        DocumentConversation document =
                new DocumentConversation();
        document.setConversation(conversation);
        document.setExpediteur(initiateur);

        when(authentication.getName()).thenReturn("init@test.com");
        when(utilisateurRepository.findByEmail("init@test.com"))
                .thenReturn(Optional.of(initiateur));
        when(documentConversationRepository.findById(documentId))
                .thenReturn(Optional.of(document));

        assertThrows(
                IllegalStateException.class,
                () -> service.markAsRead(
                        documentId,
                        authentication
                )
        );
    }

    private MockMultipartFile file(String name) {
        return new MockMultipartFile(
                "file",
                name,
                "application/octet-stream",
                "content".getBytes(StandardCharsets.UTF_8)
        );
    }

    private void setAuthenticatedUser(String email) {
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(
                        email,
                        null,
                        List.of()
                );
        SecurityContextHolder.getContext()
                .setAuthentication(auth);
    }
}
