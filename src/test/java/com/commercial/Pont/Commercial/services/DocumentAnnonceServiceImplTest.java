package com.commercial.Pont.Commercial.services;

import com.commercial.Pont.Commercial.dtos.requestDtos.DocumentAnnonceRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.DocumentAnnonceResponseDto;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.DocumentAnnonceMapperInterface;
import com.commercial.Pont.Commercial.models.Annonce;
import com.commercial.Pont.Commercial.models.DocumentAnnonce;
import com.commercial.Pont.Commercial.models.Utilisateur;
import com.commercial.Pont.Commercial.repositories.AnnonceRepository;
import com.commercial.Pont.Commercial.repositories.DocumentAnnonceRepository;
import com.commercial.Pont.Commercial.repositories.UtilisateurRepository;
import com.commercial.Pont.Commercial.services.ImplementationServices.DocumentAnnonceServiceImpl;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
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
class DocumentAnnonceServiceImplTest {

    @Mock private DocumentAnnonceRepository documentAnnonceRepository;
    @Mock private DocumentAnnonceMapperInterface documentAnnonceMapper;
    @Mock private AnnonceRepository annonceRepository;
    @Mock private UtilisateurRepository utilisateurRepository;
    @Mock private FileStorageService fileStorageService;

    @InjectMocks
    private DocumentAnnonceServiceImpl service;

    private UUID userId;
    private UUID annonceId;
    private Utilisateur user;
    private Annonce annonce;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        annonceId = UUID.randomUUID();

        user = new Utilisateur();
        user.setUtilisateurId(userId);
        user.setEmail("user@test.com");

        annonce = new Annonce();
        annonce.setAnnonceId(annonceId);
        annonce.setUtilisateur(user);
    }

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void create_ShouldCreateDocument() {
        DocumentAnnonceRequestDto request =
                mock(DocumentAnnonceRequestDto.class);
        DocumentAnnonce document = new DocumentAnnonce();
        DocumentAnnonceResponseDto response =
                mock(DocumentAnnonceResponseDto.class);

        when(request.getAnnonceId()).thenReturn(annonceId);
        when(documentAnnonceMapper.requestToEntity(request))
                .thenReturn(document);
        when(annonceRepository.findById(annonceId))
                .thenReturn(Optional.of(annonce));
        when(documentAnnonceRepository.save(document))
                .thenReturn(document);
        when(documentAnnonceMapper.entityToResponse(document))
                .thenReturn(response);

        assertSame(response, service.create(request));
        assertSame(annonce, document.getAnnonce());
        assertNotNull(document.getCreatedAt());
        assertNotNull(document.getUpdatedAt());
    }

    @Test
    void create_ShouldThrow_WhenAnnonceMissing() {
        DocumentAnnonceRequestDto request =
                mock(DocumentAnnonceRequestDto.class);

        when(request.getAnnonceId()).thenReturn(annonceId);
        when(documentAnnonceMapper.requestToEntity(request))
                .thenReturn(new DocumentAnnonce());
        when(annonceRepository.findById(annonceId))
                .thenReturn(Optional.empty());

        assertThrows(
                EntityNotFoundException.class,
                () -> service.create(request)
        );
    }

    @Test
    void update_ShouldUpdateNonNullFieldsAndAnnonce() {
        UUID documentId = UUID.randomUUID();
        UUID newAnnonceId = UUID.randomUUID();

        Annonce newAnnonce = new Annonce();
        newAnnonce.setAnnonceId(newAnnonceId);

        DocumentAnnonce document = new DocumentAnnonce();
        document.setAnnonce(annonce);

        DocumentAnnonceRequestDto request =
                mock(DocumentAnnonceRequestDto.class);

        when(request.getNomFichier()).thenReturn("new.pdf");
        when(request.getCheminFichier()).thenReturn("/files/new.pdf");
        when(request.getExtension()).thenReturn("pdf");
        when(request.getTaille()).thenReturn(120L);
        when(request.getAnnonceId()).thenReturn(newAnnonceId);

        when(documentAnnonceRepository.findById(documentId))
                .thenReturn(Optional.of(document));
        when(annonceRepository.findById(newAnnonceId))
                .thenReturn(Optional.of(newAnnonce));
        when(documentAnnonceRepository.save(document))
                .thenReturn(document);

        service.update(documentId, request);

        assertEquals("new.pdf", document.getNomFichier());
        assertEquals("/files/new.pdf", document.getCheminFichier());
        assertEquals("pdf", document.getExtension());
        assertEquals(120L, document.getTaille());
        assertSame(newAnnonce, document.getAnnonce());
    }

    @Test
    void update_ShouldKeepValues_WhenRequestFieldsNull() {
        UUID documentId = UUID.randomUUID();

        DocumentAnnonce document = new DocumentAnnonce();
        document.setAnnonce(annonce);
        document.setNomFichier("old.pdf");
        document.setExtension("pdf");

        DocumentAnnonceRequestDto request =
                mock(DocumentAnnonceRequestDto.class);

        when(request.getAnnonceId()).thenReturn(annonceId);
        when(documentAnnonceRepository.findById(documentId))
                .thenReturn(Optional.of(document));
        when(documentAnnonceRepository.save(document))
                .thenReturn(document);

        service.update(documentId, request);

        assertEquals("old.pdf", document.getNomFichier());
        assertEquals("pdf", document.getExtension());
        verify(annonceRepository, never()).findById(any());
    }

    @Test
    void getById_ShouldReturnMappedDocument() {
        UUID id = UUID.randomUUID();
        DocumentAnnonce document = new DocumentAnnonce();
        DocumentAnnonceResponseDto dto =
                mock(DocumentAnnonceResponseDto.class);

        when(documentAnnonceRepository.findById(id))
                .thenReturn(Optional.of(document));
        when(documentAnnonceMapper.entityToResponse(document))
                .thenReturn(dto);

        assertSame(dto, service.getById(id));
    }

    @Test
    void getAll_ShouldMapAll() {
        DocumentAnnonce d1 = new DocumentAnnonce();
        DocumentAnnonce d2 = new DocumentAnnonce();

        when(documentAnnonceRepository.findAll())
                .thenReturn(List.of(d1, d2));
        when(documentAnnonceMapper.entityToResponse(any()))
                .thenReturn(mock(DocumentAnnonceResponseDto.class));

        assertEquals(2, service.getAll().size());
    }

    @Test
    void delete_ShouldDeletePhysicalFileAndDb() {
        UUID id = UUID.randomUUID();
        DocumentAnnonce document = new DocumentAnnonce();
        document.setCheminFichier("/uploads/doc.pdf");

        when(documentAnnonceRepository.findById(id))
                .thenReturn(Optional.of(document));

        service.delete(id);

        verify(fileStorageService).delete("/uploads/doc.pdf");
        verify(documentAnnonceRepository).delete(document);
    }

    @Test
    void delete_ShouldSkipPhysicalDelete_WhenPathNull() {
        UUID id = UUID.randomUUID();
        DocumentAnnonce document = new DocumentAnnonce();

        when(documentAnnonceRepository.findById(id))
                .thenReturn(Optional.of(document));

        service.delete(id);

        verifyNoInteractions(fileStorageService);
        verify(documentAnnonceRepository).delete(document);
    }

    @Test
    void addDocumentToAnnonce_ShouldRejectNullFile() {
        assertThrows(
                IllegalArgumentException.class,
                () -> service.addDocumentToAnnonce(annonceId, null)
        );
    }

    @Test
    void addDocumentToAnnonce_ShouldRejectUnauthenticatedUser() {
        MockMultipartFile file = file("doc.pdf");
        Authentication auth = mock(Authentication.class);
        when(auth.isAuthenticated()).thenReturn(false);
        SecurityContextHolder.getContext().setAuthentication(auth);

        assertThrows(
                IllegalStateException.class,
                () -> service.addDocumentToAnnonce(annonceId, file)
        );
    }

    @Test
    void addDocumentToAnnonce_ShouldRejectNonOwner() {
        MockMultipartFile file = file("doc.pdf");

        Utilisateur other = new Utilisateur();
        other.setUtilisateurId(UUID.randomUUID());
        other.setEmail("other@test.com");

        setAuth("other@test.com");
        when(utilisateurRepository.findByEmail("other@test.com"))
                .thenReturn(Optional.of(other));
        when(annonceRepository.findById(annonceId))
                .thenReturn(Optional.of(annonce));

        assertThrows(
                AccessDeniedException.class,
                () -> service.addDocumentToAnnonce(annonceId, file)
        );
    }

    @Test
    void addDocumentToAnnonce_ShouldRejectInvalidFilename() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                null,
                "application/octet-stream",
                "x".getBytes(StandardCharsets.UTF_8)
        );

        setAuth("user@test.com");
        when(utilisateurRepository.findByEmail("user@test.com"))
                .thenReturn(Optional.of(user));
        when(annonceRepository.findById(annonceId))
                .thenReturn(Optional.of(annonce));

        assertThrows(
                IllegalArgumentException.class,
                () -> service.addDocumentToAnnonce(annonceId, file)
        );
    }

    @Test
    void addDocumentToAnnonce_ShouldStoreFileAndSaveDocument() {
        MockMultipartFile file = file("contract.pdf");
        DocumentAnnonceResponseDto dto =
                mock(DocumentAnnonceResponseDto.class);

        setAuth("user@test.com");
        when(utilisateurRepository.findByEmail("user@test.com"))
                .thenReturn(Optional.of(user));
        when(annonceRepository.findById(annonceId))
                .thenReturn(Optional.of(annonce));
        when(fileStorageService.store(file))
                .thenReturn("/uploads/contract.pdf");
        when(documentAnnonceRepository.save(any(DocumentAnnonce.class)))
                .thenAnswer(i -> i.getArgument(0));
        when(documentAnnonceMapper.entityToResponse(any()))
                .thenReturn(dto);

        assertSame(dto, service.addDocumentToAnnonce(annonceId, file));

        verify(fileStorageService).store(file);
        verify(documentAnnonceRepository)
                .save(argThat(d ->
                        "contract.pdf".equals(d.getNomFichier())
                                && "pdf".equals(d.getExtension())
                                && annonce.equals(d.getAnnonce())
                ));
    }

    @Test
    void getDocumentsByAnnonce_ShouldThrow_WhenAnnonceMissing() {
        when(annonceRepository.existsById(annonceId))
                .thenReturn(false);

        assertThrows(
                EntityNotFoundException.class,
                () -> service.getDocumentsByAnnonce(annonceId)
        );
    }

    @Test
    void getDocumentsByAnnonce_ShouldReturnMappedDocuments() {
        DocumentAnnonce document = new DocumentAnnonce();

        when(annonceRepository.existsById(annonceId))
                .thenReturn(true);
        when(documentAnnonceRepository
                .findByAnnonce_AnnonceId(annonceId))
                .thenReturn(List.of(document));
        when(documentAnnonceMapper.entityToResponse(document))
                .thenReturn(mock(DocumentAnnonceResponseDto.class));

        assertEquals(
                1,
                service.getDocumentsByAnnonce(annonceId).size()
        );
    }

    @Test
    void deleteDocumentFromAnnonce_ShouldDeleteOwnDocument() {
        UUID documentId = UUID.randomUUID();
        DocumentAnnonce document = new DocumentAnnonce();
        document.setAnnonce(annonce);
        document.setCheminFichier("/uploads/doc.pdf");

        setAuth("user@test.com");
        when(utilisateurRepository.findByEmail("user@test.com"))
                .thenReturn(Optional.of(user));
        when(documentAnnonceRepository.findById(documentId))
                .thenReturn(Optional.of(document));

        service.deleteDocumentFromAnnonce(annonceId, documentId);

        verify(fileStorageService).delete("/uploads/doc.pdf");
        verify(documentAnnonceRepository).delete(document);
    }

    @Test
    void deleteDocumentFromAnnonce_ShouldRejectWrongAnnonce() {
        UUID documentId = UUID.randomUUID();

        Annonce otherAnnonce = new Annonce();
        otherAnnonce.setAnnonceId(UUID.randomUUID());

        DocumentAnnonce document = new DocumentAnnonce();
        document.setAnnonce(otherAnnonce);

        setAuth("user@test.com");
        when(utilisateurRepository.findByEmail("user@test.com"))
                .thenReturn(Optional.of(user));
        when(documentAnnonceRepository.findById(documentId))
                .thenReturn(Optional.of(document));

        assertThrows(
                IllegalArgumentException.class,
                () -> service.deleteDocumentFromAnnonce(
                        annonceId,
                        documentId
                )
        );
    }

    @Test
    void deleteDocumentFromAnnonce_ShouldRejectNonOwner() {
        UUID documentId = UUID.randomUUID();

        Utilisateur other = new Utilisateur();
        other.setUtilisateurId(UUID.randomUUID());
        other.setEmail("other@test.com");

        DocumentAnnonce document = new DocumentAnnonce();
        document.setAnnonce(annonce);

        setAuth("other@test.com");
        when(utilisateurRepository.findByEmail("other@test.com"))
                .thenReturn(Optional.of(other));
        when(documentAnnonceRepository.findById(documentId))
                .thenReturn(Optional.of(document));

        assertThrows(
                AccessDeniedException.class,
                () -> service.deleteDocumentFromAnnonce(
                        annonceId,
                        documentId
                )
        );
    }

    private MockMultipartFile file(String name) {
        return new MockMultipartFile(
                "file",
                name,
                "application/pdf",
                "content".getBytes(StandardCharsets.UTF_8)
        );
    }

    private void setAuth(String email) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        email,
                        null,
                        List.of()
                )
        );
    }
}
