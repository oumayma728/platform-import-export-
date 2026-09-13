package com.commercial.Pont.Commercial.services;

import com.commercial.Pont.Commercial.dtos.rabbitmq.NotificationEventDto;
import com.commercial.Pont.Commercial.dtos.requestDtos.NotificationRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.NotificationResponseDto;
import com.commercial.Pont.Commercial.enums.NotificationCanal;
import com.commercial.Pont.Commercial.enums.NotificationStatus;
import com.commercial.Pont.Commercial.enums.NotificationType;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.NotificationMapperInterface;
import com.commercial.Pont.Commercial.models.Notification;
import com.commercial.Pont.Commercial.models.Utilisateur;
import com.commercial.Pont.Commercial.repositories.NotificationRepository;
import com.commercial.Pont.Commercial.repositories.UtilisateurRepository;
import com.commercial.Pont.Commercial.services.ImplementationServices.NotificationProducer;
import com.commercial.Pont.Commercial.services.ImplementationServices.NotificationServiceImpl;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.EmailServiceInterface;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.SmsServiceInterface;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceImplTest {

    @Mock private NotificationRepository notificationRepository;
    @Mock private NotificationMapperInterface notificationMapper;
    @Mock private UtilisateurRepository utilisateurRepository;
    @Mock private EmailServiceInterface emailService;
    @Mock private SmsServiceInterface smsService;
    @Mock private NotificationProducer notificationProducer;
    @Mock private Authentication authentication;

    @InjectMocks
    private NotificationServiceImpl service;

    private Utilisateur user;

    @BeforeEach
    void setUp() {
        user = new Utilisateur();
        user.setUtilisateurId(UUID.randomUUID());
        user.setPrenom("Jamal");
        user.setNom("Jabbour");
        user.setEmail("jamal@test.com");
        user.setTelephone("+212600000000");

        ReflectionTestUtils.setField(service, "maxRetries", 3);
    }

    @Test
    void create_ShouldCreateNotification_WithUtilisateur() {
        NotificationRequestDto request = mock(NotificationRequestDto.class);
        Notification notification = new Notification();
        NotificationResponseDto response = mock(NotificationResponseDto.class);

        when(request.getUtilisateurId()).thenReturn(user.getUtilisateurId());
        when(notificationMapper.requestToEntity(request))
                .thenReturn(notification);
        when(utilisateurRepository.findById(user.getUtilisateurId()))
                .thenReturn(Optional.of(user));
        when(notificationRepository.save(notification))
                .thenReturn(notification);
        when(notificationMapper.entityToResponse(notification))
                .thenReturn(response);

        assertSame(response, service.create(request));
        assertSame(user, notification.getUtilisateur());
        assertEquals(NotificationStatus.EN_ATTENTE, notification.getStatut());
        assertEquals(0, notification.getTentativesEnvoi());
        assertFalse(notification.getEstLu());
        assertNotNull(notification.getCreatedAt());
        assertNotNull(notification.getUpdatedAt());
    }

    @Test
    void create_ShouldCreateWithoutUtilisateur_WhenIdNull() {
        NotificationRequestDto request = mock(NotificationRequestDto.class);
        Notification notification = new Notification();

        when(request.getUtilisateurId()).thenReturn(null);
        when(notificationMapper.requestToEntity(request))
                .thenReturn(notification);
        when(notificationRepository.save(notification))
                .thenReturn(notification);

        service.create(request);

        assertNull(notification.getUtilisateur());
        verifyNoInteractions(utilisateurRepository);
    }

    @Test
    void create_ShouldThrow_WhenUtilisateurMissing() {
        NotificationRequestDto request = mock(NotificationRequestDto.class);
        UUID id = UUID.randomUUID();

        when(request.getUtilisateurId()).thenReturn(id);
        when(notificationMapper.requestToEntity(request))
                .thenReturn(new Notification());
        when(utilisateurRepository.findById(id))
                .thenReturn(Optional.empty());

        assertThrows(
                EntityNotFoundException.class,
                () -> service.create(request)
        );
    }

    @Test
    void update_ShouldUpdateFields() {
        UUID id = UUID.randomUUID();
        Notification notification = new Notification();
        NotificationRequestDto request = mock(NotificationRequestDto.class);
        NotificationResponseDto response = mock(NotificationResponseDto.class);

        when(request.getTitre()).thenReturn("Titre");
        when(request.getContenu()).thenReturn("Contenu");
        when(request.getTypeNotification())
                .thenReturn(NotificationType.BIENVENUE);
        when(request.getEmailDestinataire()).thenReturn("a@b.com");
        when(request.getTelephoneDestinataire()).thenReturn("+2126");

        when(notificationRepository.findById(id))
                .thenReturn(Optional.of(notification));
        when(notificationRepository.save(notification))
                .thenReturn(notification);
        when(notificationMapper.entityToResponse(notification))
                .thenReturn(response);

        assertSame(response, service.update(id, request));
        assertEquals("Titre", notification.getTitre());
        assertEquals("Contenu", notification.getContenu());
        assertNotNull(notification.getUpdatedAt());
    }

    @Test
    void update_ShouldThrow_WhenMissing() {
        UUID id = UUID.randomUUID();
        when(notificationRepository.findById(id))
                .thenReturn(Optional.empty());

        assertThrows(
                EntityNotFoundException.class,
                () -> service.update(id, mock(NotificationRequestDto.class))
        );
    }

    @Test
    void getById_ShouldReturnMappedNotification() {
        UUID id = UUID.randomUUID();
        Notification notification = new Notification();
        NotificationResponseDto dto = mock(NotificationResponseDto.class);

        when(notificationRepository.findById(id))
                .thenReturn(Optional.of(notification));
        when(notificationMapper.entityToResponse(notification))
                .thenReturn(dto);

        assertSame(dto, service.getById(id));
    }

    @Test
    void getById_ShouldThrow_WhenMissing() {
        UUID id = UUID.randomUUID();
        when(notificationRepository.findById(id))
                .thenReturn(Optional.empty());

        assertThrows(
                EntityNotFoundException.class,
                () -> service.getById(id)
        );
    }

    @Test
    void getAll_ShouldMapAll() {
        Notification n1 = new Notification();
        Notification n2 = new Notification();

        when(notificationRepository.findAll()).thenReturn(List.of(n1, n2));
        when(notificationMapper.entityToResponse(any()))
                .thenReturn(mock(NotificationResponseDto.class));

        assertEquals(2, service.getAll().size());
    }

    @Test
    void delete_ShouldDelete_WhenExists() {
        UUID id = UUID.randomUUID();
        when(notificationRepository.existsById(id)).thenReturn(true);

        service.delete(id);

        verify(notificationRepository).deleteById(id);
    }

    @Test
    void delete_ShouldThrow_WhenMissing() {
        UUID id = UUID.randomUUID();
        when(notificationRepository.existsById(id)).thenReturn(false);

        assertThrows(EntityNotFoundException.class, () -> service.delete(id));
    }

    @Test
    void sendEmail_ShouldReturn_WhenUtilisateurNull() {
        service.sendEmail(
                null,
                NotificationType.BIENVENUE,
                "Sujet",
                "Body"
        );

        verifyNoInteractions(notificationRepository, emailService);
    }

    @Test
    void sendEmail_ShouldReturn_WhenEmailBlank() {
        user.setEmail(" ");

        service.sendEmail(
                user,
                NotificationType.BIENVENUE,
                "Sujet",
                "Body"
        );

        verifyNoInteractions(notificationRepository, emailService);
    }

    @Test
    void sendEmail_ShouldSendAndMarkAsSent() {
        when(notificationRepository.save(any(Notification.class)))
                .thenAnswer(i -> i.getArgument(0));

        service.sendEmail(
                user,
                NotificationType.BIENVENUE,
                "Sujet",
                "Body"
        );

        verify(emailService)
                .sendEmail("jamal@test.com", "Sujet", "Body");

        ArgumentCaptor<Notification> captor =
                ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository, atLeast(2)).save(captor.capture());

        Notification last = captor.getValue();
        assertEquals(NotificationStatus.ENVOYEE, last.getStatut());
        assertEquals(NotificationCanal.EMAIL, last.getCanal());
        assertEquals(1, last.getTentativesEnvoi());
        assertNotNull(last.getDateEnvoi());
        assertNull(last.getMessageErreur());
    }

    @Test
    void sendEmail_ShouldMarkFailed_WhenProviderThrows() {
        when(notificationRepository.save(any(Notification.class)))
                .thenAnswer(i -> i.getArgument(0));
        doThrow(new IllegalStateException("email down"))
                .when(emailService)
                .sendEmail(anyString(), anyString(), anyString());

        assertDoesNotThrow(() ->
                service.sendEmail(
                        user,
                        NotificationType.BIENVENUE,
                        "Sujet",
                        "Body"
                )
        );

        ArgumentCaptor<Notification> captor =
                ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository, atLeast(2)).save(captor.capture());

        Notification last = captor.getValue();
        assertEquals(NotificationStatus.ECHOUEE, last.getStatut());
        assertEquals("email down", last.getMessageErreur());
    }

    @Test
    void sendSms_ShouldReturn_WhenPhoneBlank() {
        user.setTelephone("");

        service.sendSms(
                user,
                NotificationType.BIENVENUE,
                "message"
        );

        verifyNoInteractions(notificationRepository, smsService);
    }

    @Test
    void sendSms_ShouldSendSuccessfully() {
        when(notificationRepository.save(any(Notification.class)))
                .thenAnswer(i -> i.getArgument(0));

        service.sendSms(
                user,
                NotificationType.BIENVENUE,
                "message"
        );

        verify(smsService)
                .sendSms("+212600000000", "message");
    }

    @Test
    void notifierBienvenue_ShouldPublishEvent() {
        service.notifierBienvenue(user);

        ArgumentCaptor<NotificationEventDto> captor =
                ArgumentCaptor.forClass(NotificationEventDto.class);
        verify(notificationProducer).envoyerNotification(captor.capture());

        NotificationEventDto event = captor.getValue();
        assertEquals(user.getUtilisateurId(), event.getUtilisateurId());
        assertEquals(NotificationType.BIENVENUE, event.getTypeNotification());
        assertNotNull(event.getSmsMessage());
    }

    @Test
    void notifierValidationCompte_ShouldPublishEvent() {
        service.notifierValidationCompte(user);

        ArgumentCaptor<NotificationEventDto> captor =
                ArgumentCaptor.forClass(NotificationEventDto.class);
        verify(notificationProducer).envoyerNotification(captor.capture());

        assertEquals(
                NotificationType.INSCRIPTION_VALIDEE,
                captor.getValue().getTypeNotification()
        );
    }

    @Test
    void notifierNouveauMessage_ShouldPublishEmailOnlyEvent() {
        Utilisateur sender = new Utilisateur();
        sender.setPrenom("Ali");
        sender.setNom("Test");

        service.notifierNouveauMessage(user, sender);

        ArgumentCaptor<NotificationEventDto> captor =
                ArgumentCaptor.forClass(NotificationEventDto.class);
        verify(notificationProducer).envoyerNotification(captor.capture());

        NotificationEventDto event = captor.getValue();
        assertEquals(NotificationType.NOUVEAU_MESSAGE, event.getTypeNotification());
        assertNull(event.getSmsMessage());
    }

    @Test
    void notifierPaiementConfirme_ShouldPublishEvent() {
        service.notifierPaiementConfirme(user);

        verify(notificationProducer)
                .envoyerNotification(any(NotificationEventDto.class));
    }

    @Test
    void notifierQuotaAtteint_ShouldDoNothing_WhenAlreadyNotified() {
        when(notificationRepository
                .existsByUtilisateurAndTypeNotificationAndStatut(
                        user,
                        NotificationType.QUOTA_ATTEINT,
                        NotificationStatus.ENVOYEE))
                .thenReturn(true);

        service.notifierQuotaAtteint(user);

        verifyNoInteractions(notificationProducer);
    }

    @Test
    void notifierQuotaAtteint_ShouldPublish_WhenNotAlreadyNotified() {
        when(notificationRepository
                .existsByUtilisateurAndTypeNotificationAndStatut(
                        user,
                        NotificationType.QUOTA_ATTEINT,
                        NotificationStatus.ENVOYEE))
                .thenReturn(false);

        service.notifierQuotaAtteint(user);

        verify(notificationProducer)
                .envoyerNotification(any(NotificationEventDto.class));
    }

    @Test
    void notifierPropositionMatching_ShouldPublishEvent() {
        service.notifierPropositionMatching(
                user,
                "Correspondance forte"
        );

        ArgumentCaptor<NotificationEventDto> captor =
                ArgumentCaptor.forClass(NotificationEventDto.class);
        verify(notificationProducer).envoyerNotification(captor.capture());

        assertEquals(
                NotificationType.MATCHING_PROPOSE,
                captor.getValue().getTypeNotification()
        );
    }

    @Test
    void retryNotificationsEchouees_ShouldReturn_WhenEmpty() {
        when(notificationRepository
                .findByStatutAndTentativesEnvoiLessThan(
                        NotificationStatus.ECHOUEE,
                        3))
                .thenReturn(List.of());

        service.retryNotificationsEchouees();

        verify(emailService, never())
                .sendEmail(anyString(), anyString(), anyString());
    }

    @Test
    void retryNotificationsEchouees_ShouldRetryEmail() {
        Notification notification = Notification.builder()
                .canal(NotificationCanal.EMAIL)
                .emailDestinataire("jamal@test.com")
                .titre("retry")
                .contenu("body")
                .statut(NotificationStatus.ECHOUEE)
                .tentativesEnvoi(1)
                .build();

        when(notificationRepository
                .findByStatutAndTentativesEnvoiLessThan(
                        NotificationStatus.ECHOUEE,
                        3))
                .thenReturn(List.of(notification));
        when(notificationRepository.save(any()))
                .thenAnswer(i -> i.getArgument(0));

        service.retryNotificationsEchouees();

        verify(emailService)
                .sendEmail("jamal@test.com", "retry", "body");
        assertEquals(NotificationStatus.ENVOYEE, notification.getStatut());
        assertEquals(2, notification.getTentativesEnvoi());
    }

    @Test
    void markAsRead_ShouldMarkNotification() {
        UUID id = UUID.randomUUID();
        Notification notification = new Notification();
        notification.setEstLu(false);

        when(authentication.getName()).thenReturn("jamal@test.com");
        when(utilisateurRepository.findByEmail("jamal@test.com"))
                .thenReturn(Optional.of(user));
        when(notificationRepository
                .findByNotificationIdAndUtilisateurUtilisateurId(
                        id,
                        user.getUtilisateurId()))
                .thenReturn(Optional.of(notification));

        service.markAsRead(id, authentication);

        assertTrue(notification.getEstLu());
        assertNotNull(notification.getDateLecture());
        verify(notificationRepository).save(notification);
    }

    @Test
    void markAsRead_ShouldReturn_WhenAlreadyRead() {
        UUID id = UUID.randomUUID();
        Notification notification = new Notification();
        notification.setEstLu(true);

        when(authentication.getName()).thenReturn("jamal@test.com");
        when(utilisateurRepository.findByEmail("jamal@test.com"))
                .thenReturn(Optional.of(user));
        when(notificationRepository
                .findByNotificationIdAndUtilisateurUtilisateurId(
                        id,
                        user.getUtilisateurId()))
                .thenReturn(Optional.of(notification));

        service.markAsRead(id, authentication);

        verify(notificationRepository, never()).save(notification);
    }
}
