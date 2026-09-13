package com.commercial.Pont.Commercial.services;

import com.commercial.Pont.Commercial.dtos.requestDtos.AnnonceRequestDto;
import com.commercial.Pont.Commercial.dtos.requestDtos.CreateMyAnnonceRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.AnnonceResponseDto;
import com.commercial.Pont.Commercial.enums.AnnouncementStatus;
import com.commercial.Pont.Commercial.enums.AnnouncementType;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.AnnonceMapperInterface;
import com.commercial.Pont.Commercial.models.Annonce;
import com.commercial.Pont.Commercial.models.Utilisateur;
import com.commercial.Pont.Commercial.repositories.AnnonceRepository;
import com.commercial.Pont.Commercial.repositories.UtilisateurRepository;
import com.commercial.Pont.Commercial.services.ImplementationServices.AnnonceServiceImpl;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.CurrencyConversionServiceInterface;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AnnonceServiceImplTest {

    @Mock private AnnonceRepository annonceRepository;
    @Mock private AnnonceMapperInterface annonceMapper;
    @Mock private UtilisateurRepository utilisateurRepository;
    @Mock private CurrencyConversionServiceInterface currencyConversionService;
    @Mock private Authentication authentication;

    @InjectMocks
    private AnnonceServiceImpl service;

    private UUID userId;
    private Utilisateur user;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        user = new Utilisateur();
        user.setUtilisateurId(userId);
        user.setEmail("user@test.com");
    }

    @Test
    void create_ShouldCreateAnnonce() {
        AnnonceRequestDto request = mock(AnnonceRequestDto.class);
        Annonce annonce = new Annonce();
        AnnonceResponseDto response = mock(AnnonceResponseDto.class);

        when(annonceMapper.requestToEntity(request)).thenReturn(annonce);
        when(annonceRepository.save(annonce)).thenReturn(annonce);
        when(annonceMapper.entityToResponse(annonce)).thenReturn(response);

        assertSame(response, service.create(request));
        assertNotNull(annonce.getCreatedAt());
        assertNotNull(annonce.getUpdatedAt());
    }

    @Test
    void createMyAnnonce_ShouldCreateWithDefaultActiveStatus() {
        CreateMyAnnonceRequestDto request =
                mock(CreateMyAnnonceRequestDto.class);

        when(authentication.getName()).thenReturn("user@test.com");
        when(utilisateurRepository.findByEmail("user@test.com"))
                .thenReturn(Optional.of(user));
        when(request.getTitre()).thenReturn("Café");
        when(request.getType()).thenReturn(AnnouncementType.OFFRE);
        when(request.getPrix()).thenReturn(new BigDecimal("100"));
        when(request.getDevise()).thenReturn("MAD");
        when(request.getStatut()).thenReturn(null);

        when(annonceRepository.save(any(Annonce.class)))
                .thenAnswer(i -> {
                    Annonce a = i.getArgument(0);
                    a.setAnnonceId(UUID.randomUUID());
                    return a;
                });

        AnnonceResponseDto result =
                service.createMyAnnonce(request, authentication);

        assertNotNull(result);
        assertEquals("Café", result.getTitre());
        assertEquals(AnnouncementStatus.ACTIVE, result.getStatut());
    }

    @Test
    void createMyAnnonce_ShouldKeepProvidedStatus() {
        CreateMyAnnonceRequestDto request =
                mock(CreateMyAnnonceRequestDto.class);

        when(authentication.getName()).thenReturn("user@test.com");
        when(utilisateurRepository.findByEmail("user@test.com"))
                .thenReturn(Optional.of(user));
        when(request.getStatut())
                .thenReturn(AnnouncementStatus.SUSPENDUE);
        when(annonceRepository.save(any(Annonce.class)))
                .thenAnswer(i -> i.getArgument(0));

        AnnonceResponseDto result =
                service.createMyAnnonce(request, authentication);

        assertEquals(
                AnnouncementStatus.SUSPENDUE,
                result.getStatut()
        );
    }

    @Test
    void createMyAnnonce_ShouldThrow_WhenUserMissing() {
        when(authentication.getName()).thenReturn("none@test.com");
        when(utilisateurRepository.findByEmail("none@test.com"))
                .thenReturn(Optional.empty());

        assertThrows(
                EntityNotFoundException.class,
                () -> service.createMyAnnonce(
                        mock(CreateMyAnnonceRequestDto.class),
                        authentication
                )
        );
    }

    @Test
    void update_ShouldUpdateAnnonce() {
        UUID id = UUID.randomUUID();
        Annonce annonce = new Annonce();
        AnnonceRequestDto request = mock(AnnonceRequestDto.class);
        AnnonceResponseDto response = mock(AnnonceResponseDto.class);

        when(request.getTitre()).thenReturn("updated");
        when(request.getPrix()).thenReturn(new BigDecimal("25"));
        when(request.getDevise()).thenReturn("EUR");
        when(annonceRepository.findById(id))
                .thenReturn(Optional.of(annonce));
        when(annonceRepository.save(annonce))
                .thenReturn(annonce);
        when(annonceMapper.entityToResponse(annonce))
                .thenReturn(response);

        assertSame(response, service.update(id, request));
        assertEquals("updated", annonce.getTitre());
        assertEquals(new BigDecimal("25"), annonce.getPrix());
        assertNotNull(annonce.getUpdatedAt());
    }

    @Test
    void update_ShouldThrow_WhenMissing() {
        UUID id = UUID.randomUUID();
        when(annonceRepository.findById(id))
                .thenReturn(Optional.empty());

        assertThrows(
                EntityNotFoundException.class,
                () -> service.update(id, mock(AnnonceRequestDto.class))
        );
    }

    @Test
    void getById_ShouldReturnMappedAnnonce() {
        UUID id = UUID.randomUUID();
        Annonce annonce = new Annonce();
        AnnonceResponseDto dto = mock(AnnonceResponseDto.class);

        when(annonceRepository.findById(id))
                .thenReturn(Optional.of(annonce));
        when(annonceMapper.entityToResponse(annonce))
                .thenReturn(dto);

        assertSame(dto, service.getById(id));
    }

    @Test
    void getAll_ShouldMapAll() {
        when(annonceRepository.findAll())
                .thenReturn(List.of(new Annonce(), new Annonce()));
        when(annonceMapper.entityToResponse(any()))
                .thenReturn(mock(AnnonceResponseDto.class));

        assertEquals(2, service.getAll().size());
    }

    @Test
    void delete_ShouldDelete_WhenExists() {
        UUID id = UUID.randomUUID();
        when(annonceRepository.existsById(id)).thenReturn(true);

        service.delete(id);

        verify(annonceRepository).deleteById(id);
    }

    @Test
    void delete_ShouldThrow_WhenMissing() {
        UUID id = UUID.randomUUID();
        when(annonceRepository.existsById(id)).thenReturn(false);

        assertThrows(EntityNotFoundException.class, () -> service.delete(id));
    }

    @Test
    void suspendreAnnonce_ShouldSetSuspendedStatus() {
        UUID id = UUID.randomUUID();
        Annonce annonce = new Annonce();

        when(annonceRepository.findById(id))
                .thenReturn(Optional.of(annonce));
        when(annonceRepository.save(annonce))
                .thenReturn(annonce);
        when(annonceMapper.entityToResponse(annonce))
                .thenReturn(mock(AnnonceResponseDto.class));

        service.suspendreAnnonce(id);

        assertEquals(AnnouncementStatus.SUSPENDUE, annonce.getStatut());
    }

    @Test
    void cloturerAnnonce_ShouldSetClosedStatus() {
        UUID id = UUID.randomUUID();
        Annonce annonce = new Annonce();

        when(annonceRepository.findById(id))
                .thenReturn(Optional.of(annonce));
        when(annonceRepository.save(annonce))
                .thenReturn(annonce);
        when(annonceMapper.entityToResponse(annonce))
                .thenReturn(mock(AnnonceResponseDto.class));

        service.cloturerAnnonce(id);

        assertEquals(AnnouncementStatus.CLOTUREE, annonce.getStatut());
    }

    @SuppressWarnings("unchecked")
    @Test
    void rechercher_ShouldNotConvert_WhenCurrencyBlank() {
        Annonce annonce = new Annonce();
        AnnonceResponseDto dto = new AnnonceResponseDto();

        when(annonceRepository.findAll(any(Specification.class)))
                .thenReturn(List.of(annonce));
        when(annonceMapper.entityToResponse(annonce))
                .thenReturn(dto);

        List<AnnonceResponseDto> result =
                service.rechercher(
                        null,
                        null,
                        null,
                        null,
                        null,
                        " "
                );

        assertEquals(1, result.size());
        verifyNoInteractions(currencyConversionService);
    }

    @SuppressWarnings("unchecked")
    @Test
    void rechercher_ShouldConvertPrice_WhenCurrencyProvided() {
        Annonce annonce = new Annonce();
        annonce.setPrix(new BigDecimal("100"));
        annonce.setDevise("MAD");

        AnnonceResponseDto dto = new AnnonceResponseDto();

        when(annonceRepository.findAll(any(Specification.class)))
                .thenReturn(List.of(annonce));
        when(annonceMapper.entityToResponse(annonce))
                .thenReturn(dto);
        when(currencyConversionService.convertir(
                new BigDecimal("100"),
                "MAD",
                "eur"
        ))
                .thenReturn(new BigDecimal("9.20"));

        List<AnnonceResponseDto> result =
                service.rechercher(
                        "Maroc",
                        "Food",
                        10.0,
                        200.0,
                        "ISO",
                        "eur"
                );

        assertEquals(new BigDecimal("9.20"), result.get(0).getPrixConverti());
        assertEquals("EUR", result.get(0).getDeviseConversion());
    }

    @Test
    void getAnnoncesByUtilisateur_ShouldMapResults() {
        Annonce annonce = new Annonce();
        when(annonceRepository
                .findByUtilisateurUtilisateurId(userId))
                .thenReturn(List.of(annonce));
        when(annonceMapper.entityToResponse(annonce))
                .thenReturn(mock(AnnonceResponseDto.class));

        assertEquals(
                1,
                service.getAnnoncesByUtilisateur(userId).size()
        );
    }

    @Test
    void getOffres_ShouldUseOffreType() {
        when(annonceRepository.findByType(AnnouncementType.OFFRE))
                .thenReturn(List.of());

        service.getOffres();

        verify(annonceRepository).findByType(AnnouncementType.OFFRE);
    }

    @Test
    void getDemandes_ShouldUseDemandeType() {
        when(annonceRepository.findByType(AnnouncementType.DEMANDE))
                .thenReturn(List.of());

        service.getDemandes();

        verify(annonceRepository).findByType(AnnouncementType.DEMANDE);
    }

    @Test
    void getOffresByUtilisateur_ShouldUseCorrectType() {
        when(annonceRepository
                .findByUtilisateurUtilisateurIdAndType(
                        userId,
                        AnnouncementType.OFFRE))
                .thenReturn(List.of());

        service.getOffresByUtilisateur(userId);

        verify(annonceRepository)
                .findByUtilisateurUtilisateurIdAndType(
                        userId,
                        AnnouncementType.OFFRE);
    }

    @Test
    void getDemandesByUtilisateur_ShouldUseCorrectType() {
        when(annonceRepository
                .findByUtilisateurUtilisateurIdAndType(
                        userId,
                        AnnouncementType.DEMANDE))
                .thenReturn(List.of());

        service.getDemandesByUtilisateur(userId);

        verify(annonceRepository)
                .findByUtilisateurUtilisateurIdAndType(
                        userId,
                        AnnouncementType.DEMANDE);
    }
}
