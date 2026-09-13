package com.commercial.Pont.Commercial.services;

import com.commercial.Pont.Commercial.dtos.requestDtos.UpdateProfileRequestDto;
import com.commercial.Pont.Commercial.dtos.requestDtos.UtilisateurRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.UtilisateurResponseDto;
import com.commercial.Pont.Commercial.enums.AuthProvider;
import com.commercial.Pont.Commercial.enums.ValidationStatus;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.UtilisateurMapperInterface;
import com.commercial.Pont.Commercial.models.Entreprise;
import com.commercial.Pont.Commercial.models.Utilisateur;
import com.commercial.Pont.Commercial.repositories.EntrepriseRepository;
import com.commercial.Pont.Commercial.repositories.UtilisateurRepository;
import com.commercial.Pont.Commercial.services.ImplementationServices.UtilisateurServiceImpl;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.NotificationServiceInterface;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.PhotoStorageServiceInterface;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UtilisateurServiceImplTest {

    @Mock private UtilisateurRepository utilisateurRepository;
    @Mock private UtilisateurMapperInterface utilisateurMapper;
    @Mock private EntrepriseRepository entrepriseRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private PhotoStorageServiceInterface photoStorageService;
    @Mock private NotificationServiceInterface notificationService;

    @InjectMocks
    private UtilisateurServiceImpl service;

    private UUID userId;
    private UUID entrepriseId;
    private Entreprise entreprise;
    private Utilisateur utilisateur;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        entrepriseId = UUID.randomUUID();

        entreprise = new Entreprise();
        entreprise.setEntrepriseId(entrepriseId);
        entreprise.setNombreEmployes(5);

        utilisateur = new Utilisateur();
        utilisateur.setUtilisateurId(userId);
        utilisateur.setEntreprise(entreprise);
    }

    @Test
    void create_ShouldCreateUserWithoutPhoto() {
        UtilisateurRequestDto request = mock(UtilisateurRequestDto.class);
        UtilisateurResponseDto response = mock(UtilisateurResponseDto.class);

        when(request.getEmail()).thenReturn("user@test.com");
        when(request.getPassword()).thenReturn("password");
        when(request.getEntrepriseId()).thenReturn(entrepriseId);

        when(utilisateurRepository.existsByEmail("user@test.com"))
                .thenReturn(false);
        when(utilisateurMapper.requestToEntity(request))
                .thenReturn(utilisateur);
        when(entrepriseRepository.findById(entrepriseId))
                .thenReturn(Optional.of(entreprise));
        when(passwordEncoder.encode("password"))
                .thenReturn("encoded");
        when(utilisateurRepository.save(utilisateur))
                .thenReturn(utilisateur);
        when(utilisateurMapper.entityToResponse(utilisateur))
                .thenReturn(response);

        assertSame(response, service.create(request, null));

        assertEquals("encoded", utilisateur.getPasswordHash());
        assertEquals(
                ValidationStatus.EN_ATTENTE_VALIDATION,
                utilisateur.getValidationStatus()
        );
        assertEquals(0, utilisateur.getNombreChatsUtilises());
        assertEquals(50, utilisateur.getMaxMessagesPossible());
        assertEquals(AuthProvider.LOCAL, utilisateur.getAuthProvider());
        assertEquals(6, entreprise.getNombreEmployes());

        verify(notificationService).notifierBienvenue(utilisateur);
        verifyNoInteractions(photoStorageService);
    }

    @Test
    void create_ShouldStorePhoto_WhenProvided() {
        UtilisateurRequestDto request = mock(UtilisateurRequestDto.class);
        MockMultipartFile photo = new MockMultipartFile(
                "photo",
                "me.jpg",
                "image/jpeg",
                new byte[]{1, 2}
        );

        when(request.getEmail()).thenReturn("user@test.com");
        when(request.getPassword()).thenReturn("password");
        when(request.getEntrepriseId()).thenReturn(entrepriseId);
        when(utilisateurRepository.existsByEmail("user@test.com"))
                .thenReturn(false);
        when(utilisateurMapper.requestToEntity(request))
                .thenReturn(utilisateur);
        when(entrepriseRepository.findById(entrepriseId))
                .thenReturn(Optional.of(entreprise));
        when(passwordEncoder.encode("password"))
                .thenReturn("encoded");
        when(photoStorageService.storeProfilePhoto(photo))
                .thenReturn("/uploads/profiles/me.jpg");
        when(utilisateurRepository.save(utilisateur))
                .thenReturn(utilisateur);

        service.create(request, photo);

        assertEquals(
                "/uploads/profiles/me.jpg",
                utilisateur.getPhotoProfile()
        );
    }

    @Test
    void create_ShouldUseZero_WhenEntrepriseEmployeeCountNull() {
        entreprise.setNombreEmployes(null);

        UtilisateurRequestDto request = mock(UtilisateurRequestDto.class);

        when(request.getEmail()).thenReturn("user@test.com");
        when(request.getPassword()).thenReturn("password");
        when(request.getEntrepriseId()).thenReturn(entrepriseId);
        when(utilisateurRepository.existsByEmail("user@test.com"))
                .thenReturn(false);
        when(utilisateurMapper.requestToEntity(request))
                .thenReturn(utilisateur);
        when(entrepriseRepository.findById(entrepriseId))
                .thenReturn(Optional.of(entreprise));
        when(passwordEncoder.encode("password"))
                .thenReturn("encoded");
        when(utilisateurRepository.save(utilisateur))
                .thenReturn(utilisateur);

        service.create(request, null);

        assertEquals(1, entreprise.getNombreEmployes());
    }

    @Test
    void create_ShouldThrow_WhenEmailAlreadyExists() {
        UtilisateurRequestDto request = mock(UtilisateurRequestDto.class);
        when(request.getEmail()).thenReturn("user@test.com");
        when(utilisateurRepository.existsByEmail("user@test.com"))
                .thenReturn(true);

        assertThrows(
                IllegalArgumentException.class,
                () -> service.create(request, null)
        );
    }

    @Test
    void create_ShouldThrow_WhenEntrepriseMissing() {
        UtilisateurRequestDto request = mock(UtilisateurRequestDto.class);

        when(request.getEmail()).thenReturn("user@test.com");
        when(request.getEntrepriseId()).thenReturn(entrepriseId);
        when(utilisateurRepository.existsByEmail("user@test.com"))
                .thenReturn(false);
        when(utilisateurMapper.requestToEntity(request))
                .thenReturn(utilisateur);
        when(entrepriseRepository.findById(entrepriseId))
                .thenReturn(Optional.empty());

        assertThrows(
                EntityNotFoundException.class,
                () -> service.create(request, null)
        );
    }

    @Test
    void update_ShouldUpdateUserAndEntreprise() {
        UUID newEntrepriseId = UUID.randomUUID();
        Entreprise newEntreprise = new Entreprise();
        newEntreprise.setEntrepriseId(newEntrepriseId);

        UtilisateurRequestDto request = mock(UtilisateurRequestDto.class);
        when(request.getEmail()).thenReturn("new@test.com");
        when(request.getNom()).thenReturn("New");
        when(request.getEntrepriseId()).thenReturn(newEntrepriseId);

        when(utilisateurRepository.findById(userId))
                .thenReturn(Optional.of(utilisateur));
        when(entrepriseRepository.findById(newEntrepriseId))
                .thenReturn(Optional.of(newEntreprise));
        when(utilisateurRepository.save(utilisateur))
                .thenReturn(utilisateur);

        service.update(userId, request);

        assertEquals("new@test.com", utilisateur.getEmail());
        assertEquals("New", utilisateur.getNom());
        assertSame(newEntreprise, utilisateur.getEntreprise());
        assertNotNull(utilisateur.getUpdatedAt());
    }

    @Test
    void update_ShouldNotReloadEntreprise_WhenSameId() {
        UtilisateurRequestDto request = mock(UtilisateurRequestDto.class);
        when(request.getEntrepriseId()).thenReturn(entrepriseId);
        when(utilisateurRepository.findById(userId))
                .thenReturn(Optional.of(utilisateur));
        when(utilisateurRepository.save(utilisateur))
                .thenReturn(utilisateur);

        service.update(userId, request);

        verifyNoInteractions(entrepriseRepository);
    }

    @Test
    void getById_ShouldReturnMappedUser() {
        UtilisateurResponseDto dto = mock(UtilisateurResponseDto.class);
        when(utilisateurRepository.findById(userId))
                .thenReturn(Optional.of(utilisateur));
        when(utilisateurMapper.entityToResponse(utilisateur))
                .thenReturn(dto);

        assertSame(dto, service.getById(userId));
    }

    @Test
    void getAll_ShouldMapUsers() {
        when(utilisateurRepository.findAll())
                .thenReturn(List.of(utilisateur, new Utilisateur()));
        when(utilisateurMapper.entityToResponse(any()))
                .thenReturn(mock(UtilisateurResponseDto.class));

        assertEquals(2, service.getAll().size());
    }

    @Test
    void delete_ShouldDelete_WhenExists() {
        when(utilisateurRepository.existsById(userId))
                .thenReturn(true);

        service.delete(userId);

        verify(utilisateurRepository).deleteById(userId);
    }

    @Test
    void delete_ShouldThrow_WhenMissing() {
        when(utilisateurRepository.existsById(userId))
                .thenReturn(false);

        assertThrows(
                EntityNotFoundException.class,
                () -> service.delete(userId)
        );
    }

    @Test
    void validerUtilisateur_ShouldValidateAndNotify() {
        UtilisateurResponseDto dto = mock(UtilisateurResponseDto.class);

        when(utilisateurRepository.findById(userId))
                .thenReturn(Optional.of(utilisateur));
        when(utilisateurRepository.save(utilisateur))
                .thenReturn(utilisateur);
        when(utilisateurMapper.entityToResponse(utilisateur))
                .thenReturn(dto);

        assertSame(dto, service.validerUtilisateur(userId));

        assertEquals(
                ValidationStatus.VALIDE,
                utilisateur.getValidationStatus()
        );
        verify(notificationService)
                .notifierValidationCompte(utilisateur);
    }

    @Test
    void rejeterUtilisateur_ShouldSetRejected() {
        when(utilisateurRepository.findById(userId))
                .thenReturn(Optional.of(utilisateur));
        when(utilisateurRepository.save(utilisateur))
                .thenReturn(utilisateur);

        service.rejeterUtilisateur(userId);

        assertEquals(
                ValidationStatus.REJETE,
                utilisateur.getValidationStatus()
        );
    }

    @Test
    void suspendreUtilisateur_ShouldSetSuspended() {
        when(utilisateurRepository.findById(userId))
                .thenReturn(Optional.of(utilisateur));
        when(utilisateurRepository.save(utilisateur))
                .thenReturn(utilisateur);

        service.suspendreUtilisateur(userId);

        assertEquals(
                ValidationStatus.SUSPENDU,
                utilisateur.getValidationStatus()
        );
    }

    @Test
    void getByEmail_ShouldReturnMappedUser() {
        UtilisateurResponseDto dto = mock(UtilisateurResponseDto.class);
        when(utilisateurRepository.findByEmail("user@test.com"))
                .thenReturn(Optional.of(utilisateur));
        when(utilisateurMapper.entityToResponse(utilisateur))
                .thenReturn(dto);

        assertSame(dto, service.getByEmail("user@test.com"));
    }

    @Test
    void getByEmail_ShouldThrow_WhenMissing() {
        when(utilisateurRepository.findByEmail("none@test.com"))
                .thenReturn(Optional.empty());

        assertThrows(
                EntityNotFoundException.class,
                () -> service.getByEmail("none@test.com")
        );
    }

    @Test
    void updateProfile_ShouldUpdateProfile() {
        UpdateProfileRequestDto request =
                mock(UpdateProfileRequestDto.class);
        UtilisateurResponseDto response =
                mock(UtilisateurResponseDto.class);

        when(request.getEmail()).thenReturn("new@test.com");
        when(request.getNom()).thenReturn("Jabbour");
        when(request.getPrenom()).thenReturn("Jamal");
        when(request.getTelephone()).thenReturn("0600000000");
        when(request.getFonction()).thenReturn("Dev");

        when(utilisateurRepository.findByEmail("old@test.com"))
                .thenReturn(Optional.of(utilisateur));
        when(utilisateurRepository.existsByEmail("new@test.com"))
                .thenReturn(false);
        when(utilisateurRepository.save(utilisateur))
                .thenReturn(utilisateur);
        when(utilisateurMapper.entityToResponse(utilisateur))
                .thenReturn(response);

        assertSame(
                response,
                service.updateProfile("old@test.com", request)
        );

        assertEquals("new@test.com", utilisateur.getEmail());
        assertEquals("Jamal", utilisateur.getPrenom());
    }

    @Test
    void updateProfile_ShouldRejectUsedEmail() {
        UpdateProfileRequestDto request =
                mock(UpdateProfileRequestDto.class);

        when(request.getEmail()).thenReturn("used@test.com");
        when(utilisateurRepository.findByEmail("old@test.com"))
                .thenReturn(Optional.of(utilisateur));
        when(utilisateurRepository.existsByEmail("used@test.com"))
                .thenReturn(true);

        assertThrows(
                IllegalArgumentException.class,
                () -> service.updateProfile("old@test.com", request)
        );
    }

    @Test
    void updateProfile_ShouldNotCheckExistence_WhenEmailUnchanged() {
        UpdateProfileRequestDto request =
                mock(UpdateProfileRequestDto.class);
        when(request.getEmail()).thenReturn("same@test.com");

        when(utilisateurRepository.findByEmail("same@test.com"))
                .thenReturn(Optional.of(utilisateur));
        when(utilisateurRepository.save(utilisateur))
                .thenReturn(utilisateur);

        service.updateProfile("same@test.com", request);

        verify(utilisateurRepository, never())
                .existsByEmail(anyString());
    }
}
