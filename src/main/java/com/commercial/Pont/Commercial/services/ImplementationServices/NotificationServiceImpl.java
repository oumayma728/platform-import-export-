package com.commercial.Pont.Commercial.services.ImplementationServices;

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
import com.commercial.Pont.Commercial.services.ServiceInterfaces.EmailServiceInterface;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.NotificationServiceInterface;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.SmsServiceInterface;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationServiceImpl
        implements NotificationServiceInterface {

    private final NotificationRepository notificationRepository;

    private final NotificationMapperInterface notificationMapper;

    private final UtilisateurRepository utilisateurRepository;

    private final EmailServiceInterface emailService;

    private final SmsServiceInterface smsService;

    private final NotificationProducer notificationProducer;

    @Value("${notification.max-retries:3}")
    private Integer maxRetries;


    // ============================================================
    // CREATE CRUD
    // ============================================================

    @Override
    public NotificationResponseDto create(
            NotificationRequestDto request
    ) {

        Notification notification =
                notificationMapper.requestToEntity(
                        request
                );

        Utilisateur utilisateur = null;

        if (request.getUtilisateurId() != null) {

            utilisateur =
                    utilisateurRepository
                            .findById(
                                    request.getUtilisateurId()
                            )
                            .orElseThrow(() ->
                                    new EntityNotFoundException(
                                            "Utilisateur non trouvé."
                                    )
                            );
        }

        LocalDateTime now =
                LocalDateTime.now();


        notification.setUtilisateur(
                utilisateur
        );

        notification.setStatut(
                NotificationStatus.EN_ATTENTE
        );

        notification.setTentativesEnvoi(0);

        notification.setEstLu(false);

        notification.setCreatedAt(now);

        notification.setUpdatedAt(now);


        Notification saved =
                notificationRepository.save(
                        notification
                );


        return notificationMapper
                .entityToResponse(
                        saved
                );
    }


    // ============================================================
    // UPDATE
    // ============================================================

    @Override
    public NotificationResponseDto update(
            UUID notificationId,
            NotificationRequestDto request
    ) {

        Notification notification =
                notificationRepository
                        .findById(notificationId)
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Notification non trouvée."
                                )
                        );


        notification.setTitre(
                request.getTitre()
        );

        notification.setContenu(
                request.getContenu()
        );

        notification.setTypeNotification(
                request.getTypeNotification()
        );

        notification.setEmailDestinataire(
                request.getEmailDestinataire()
        );

        notification.setTelephoneDestinataire(
                request.getTelephoneDestinataire()
        );

        notification.setUpdatedAt(
                LocalDateTime.now()
        );


        return notificationMapper
                .entityToResponse(
                        notificationRepository.save(
                                notification
                        )
                );
    }


    // ============================================================
    // GET BY ID
    // ============================================================

    @Override
    @Transactional(readOnly = true)
    public NotificationResponseDto getById(
            UUID notificationId
    ) {

        Notification notification =
                notificationRepository
                        .findById(notificationId)
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Notification non trouvée."
                                )
                        );


        return notificationMapper
                .entityToResponse(
                        notification
                );
    }


    // ============================================================
    // GET ALL
    // ============================================================

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponseDto> getAll() {

        return notificationRepository
                .findAll()
                .stream()
                .map(
                        notificationMapper::entityToResponse
                )
                .toList();
    }


    // ============================================================
    // DELETE
    // ============================================================

    @Override
    public void delete(
            UUID notificationId
    ) {

        if (!notificationRepository
                .existsById(notificationId)) {

            throw new EntityNotFoundException(
                    "Notification non trouvée."
            );
        }

        notificationRepository.deleteById(
                notificationId
        );
    }


    // ============================================================
    // SEND EMAIL
    // ============================================================

    @Override
    public void sendEmail(
            Utilisateur utilisateur,
            NotificationType type,
            String subject,
            String body
    ) {

        if (
                utilisateur == null
                        ||
                        utilisateur.getEmail() == null
                        ||
                        utilisateur.getEmail().isBlank()
        ) {

            return;
        }


        LocalDateTime now =
                LocalDateTime.now();


        Notification notification =
                Notification.builder()
                        .utilisateur(utilisateur)
                        .titre(subject)
                        .contenu(body)
                        .typeNotification(type)
                        .canal(
                                NotificationCanal.EMAIL
                        )
                        .emailDestinataire(
                                utilisateur.getEmail()
                        )
                        .statut(
                                NotificationStatus.EN_ATTENTE
                        )
                        .tentativesEnvoi(0)
                        .estLu(false)
                        .createdAt(now)
                        .updatedAt(now)
                        .build();


        notification =
                notificationRepository.save(
                        notification
                );


        executerEnvoi(
                notification
        );
    }


    // ============================================================
    // SEND SMS
    // ============================================================

    @Override
    public void sendSms(
            Utilisateur utilisateur,
            NotificationType type,
            String message
    ) {

        if (
                utilisateur == null
                        ||
                        utilisateur.getTelephone() == null
                        ||
                        utilisateur.getTelephone().isBlank()
        ) {

            return;
        }


        LocalDateTime now =
                LocalDateTime.now();


        Notification notification =
                Notification.builder()
                        .utilisateur(utilisateur)
                        .titre(
                                type.name()
                        )
                        .contenu(message)
                        .typeNotification(type)
                        .canal(
                                NotificationCanal.SMS
                        )
                        .telephoneDestinataire(
                                utilisateur.getTelephone()
                        )
                        .statut(
                                NotificationStatus.EN_ATTENTE
                        )
                        .tentativesEnvoi(0)
                        .estLu(false)
                        .createdAt(now)
                        .updatedAt(now)
                        .build();


        notification =
                notificationRepository.save(
                        notification
                );


        executerEnvoi(
                notification
        );
    }


    // ============================================================
    // EXECUTION REELLE
    // ============================================================

    private void executerEnvoi(
            Notification notification
    ) {

        int tentatives =
                notification.getTentativesEnvoi() == null
                        ? 0
                        : notification.getTentativesEnvoi();


        notification.setTentativesEnvoi(
                tentatives + 1
        );

        notification.setUpdatedAt(
                LocalDateTime.now()
        );


        try {

            // ==========================================
            // EMAIL
            // ==========================================

            if (
                    NotificationCanal.EMAIL.equals(
                            notification.getCanal()
                    )
            ) {

                emailService.sendEmail(
                        notification.getEmailDestinataire(),
                        notification.getTitre(),
                        notification.getContenu()
                );
            }


            // ==========================================
            // SMS
            // ==========================================

            else if (
                    NotificationCanal.SMS.equals(
                            notification.getCanal()
                    )
            ) {

                smsService.sendSms(
                        notification
                                .getTelephoneDestinataire(),

                        notification
                                .getContenu()
                );
            }


            // ==========================================
            // SUCCES
            // ==========================================

            notification.setStatut(
                    NotificationStatus.ENVOYEE
            );

            notification.setDateEnvoi(
                    LocalDateTime.now()
            );

            notification.setMessageErreur(
                    null
            );


        } catch (Exception e) {

            // ==========================================
            // ECHEC
            // ==========================================

            notification.setStatut(
                    NotificationStatus.ECHOUEE
            );

            notification.setMessageErreur(
                    e.getMessage()
            );

            System.err.println(
                    "Notification échouée : "
                            + notification.getNotificationId()
                            + " | "
                            + e.getMessage()
            );
        }


        notification.setUpdatedAt(
                LocalDateTime.now()
        );


        notificationRepository.save(
                notification
        );
    }


    // ============================================================
    // BIENVENUE
    // ============================================================

    @Override
    public void notifierBienvenue(
            Utilisateur utilisateur
    ) {

        String subject =
                "Bienvenue sur Export-import platforme";


        String body = """
        <h2>Bienvenue sur Export-import platforme</h2>

        <p>Bonjour %s,</p>

        <p>Votre compte a été créé avec succès.</p>

        <p>Votre profil est actuellement en attente de validation.</p>
        """.formatted(
                utilisateur.getPrenom()
        );


        String smsMessage =
                "Bienvenue sur Export-import platforme "
                        + utilisateur.getPrenom()
                        + ". Votre compte est en attente de validation.";


        NotificationEventDto event =
                NotificationEventDto.builder()
                        .utilisateurId(
                                utilisateur.getUtilisateurId()
                        )
                        .typeNotification(
                                NotificationType.BIENVENUE
                        )
                        .subject(subject)
                        .emailBody(body)
                        .smsMessage(smsMessage)
                        .build();


        notificationProducer
                .envoyerNotification(
                        event
                );
    }


    // ============================================================
    // VALIDATION COMPTE
    // ============================================================

    @Override
    public void notifierValidationCompte(
            Utilisateur utilisateur
    ) {

        String subject =
                "Votre compte a été validé";


        String body = """
        <h2>Compte validé</h2>

        <p>Bonjour %s,</p>

        <p>Votre compte Export-import platforme a été validé.</p>

        <p>Vous pouvez maintenant accéder aux fonctionnalités de la plateforme.</p>

        <p>L'équipe Export-import platforme</p>
        """.formatted(
                utilisateur.getPrenom()
        );


        String smsMessage =
                "Export-import platforme : Bonjour "
                        + utilisateur.getPrenom()
                        + ", votre compte a été validé. "
                        + "Vous pouvez maintenant accéder à la plateforme.";


        NotificationEventDto event =
                NotificationEventDto.builder()
                        .utilisateurId(
                                utilisateur.getUtilisateurId()
                        )
                        .typeNotification(
                                NotificationType.INSCRIPTION_VALIDEE
                        )
                        .subject(subject)
                        .emailBody(body)
                        .smsMessage(smsMessage)
                        .build();


        notificationProducer
                .envoyerNotification(
                        event
                );
    }


// ============================================================
// NOUVEAU MESSAGE
// EMAIL SEULEMENT
// ============================================================

    @Override
    public void notifierNouveauMessage(
            Utilisateur destinataire,
            Utilisateur expediteur
    ) {

        String subject =
                "Nouveau message sur Export-import platforme";


        String body = """
        <h2>Nouveau message</h2>

        <p>Bonjour %s,</p>

        <p>Vous avez reçu un nouveau message de %s %s.</p>

        <p>Connectez-vous à Export-import platforme pour le consulter.</p>
        """.formatted(
                destinataire.getPrenom(),
                expediteur.getPrenom(),
                expediteur.getNom()
        );


        NotificationEventDto event =
                NotificationEventDto.builder()
                        .utilisateurId(
                                destinataire.getUtilisateurId()
                        )
                        .typeNotification(
                                NotificationType.NOUVEAU_MESSAGE
                        )
                        .subject(subject)
                        .emailBody(body)

                        // Pas de SMS pour cette notification
                        .smsMessage(null)

                        .build();


        notificationProducer
                .envoyerNotification(
                        event
                );
    }


// ============================================================
// PAIEMENT
// EMAIL + SMS
// ============================================================

    @Override
    public void notifierPaiementConfirme(
            Utilisateur utilisateur
    ) {

        String subject =
                "Paiement confirmé";


        String body = """
        <h2>Paiement confirmé</h2>

        <p>Bonjour %s,</p>

        <p>Votre paiement a été confirmé avec succès.</p>

        <p>Votre achat est maintenant actif sur votre compte.</p>

        <p>Merci d'utiliser Export-import platforme.</p>
        """.formatted(
                utilisateur.getPrenom()
        );


        String smsMessage =
                "Export-import platforme : Bonjour "
                        + utilisateur.getPrenom()
                        + ", votre paiement a été confirmé avec succès. "
                        + "Votre achat est maintenant actif sur votre compte.";


        NotificationEventDto event =
                NotificationEventDto.builder()
                        .utilisateurId(
                                utilisateur.getUtilisateurId()
                        )
                        .typeNotification(
                                NotificationType.PAIEMENT_CONFIRME
                        )
                        .subject(subject)
                        .emailBody(body)
                        .smsMessage(smsMessage)
                        .build();


        notificationProducer
                .envoyerNotification(
                        event
                );
    }


// ============================================================
// QUOTA
// EMAIL SEULEMENT
// ============================================================

    @Override
    @Transactional(
            propagation = Propagation.REQUIRES_NEW
    )
    public void notifierQuotaAtteint(
            Utilisateur utilisateur
    ) {

        boolean dejaNotifie =
                notificationRepository
                        .existsByUtilisateurAndTypeNotificationAndStatut(
                                utilisateur,
                                NotificationType.QUOTA_ATTEINT,
                                NotificationStatus.ENVOYEE
                        );


        if (dejaNotifie) {
            return;
        }


        String subject =
                "Quota gratuit atteint";


        String body = """
        <h2>Quota de messages atteint</h2>

        <p>Bonjour %s,</p>

        <p>Vous avez atteint votre quota de messages disponibles.</p>

        <p>Vous pouvez acheter des messages supplémentaires ou souscrire à un abonnement.</p>
        """.formatted(
                utilisateur.getPrenom()
        );


        NotificationEventDto event =
                NotificationEventDto.builder()
                        .utilisateurId(
                                utilisateur.getUtilisateurId()
                        )
                        .typeNotification(
                                NotificationType.QUOTA_ATTEINT
                        )
                        .subject(subject)
                        .emailBody(body)

                        // Pas de SMS pour le quota
                        .smsMessage(null)

                        .build();


        notificationProducer
                .envoyerNotification(
                        event
                );
    }


// ============================================================
// PROPOSITION MATCHING
// EMAIL SEULEMENT
// ============================================================

    @Override
    public void notifierPropositionMatching(
            Utilisateur utilisateur,
            String descriptionMatching
    ) {

        String subject =
                "Nouvelle proposition de matching";


        String body = """
        <h2>Nouvelle opportunité trouvée</h2>

        <p>Bonjour %s,</p>

        <p>Une nouvelle correspondance intéressante a été trouvée pour vous.</p>

        <p>%s</p>

        <p>Connectez-vous à Export-import platforme pour consulter cette opportunité.</p>

        <p>L'équipe Export-import platforme</p>
        """.formatted(
                utilisateur.getPrenom(),
                descriptionMatching
        );


        NotificationEventDto event =
                NotificationEventDto.builder()
                        .utilisateurId(
                                utilisateur.getUtilisateurId()
                        )
                        .typeNotification(
                                NotificationType.MATCHING_PROPOSE
                        )
                        .subject(subject)
                        .emailBody(body)

                        // Pas de SMS pour le matching
                        .smsMessage(null)

                        .build();


        notificationProducer
                .envoyerNotification(
                        event
                );
    }


    // ============================================================
    // RETRY
    // ============================================================

    @Override
    @Scheduled(fixedDelay = 300000)
    public void retryNotificationsEchouees() {

        List<Notification> notifications =
                notificationRepository
                        .findByStatutAndTentativesEnvoiLessThan(
                                NotificationStatus.ECHOUEE,
                                maxRetries
                        );


        if (notifications.isEmpty()) {

            return;
        }


        System.out.println(
                "Retry notifications : "
                        + notifications.size()
        );


        for (
                Notification notification
                : notifications
        ) {

            System.out.println(
                    "Retry notification "
                            + notification.getNotificationId()
                            + " tentative "
                            + (
                            notification
                                    .getTentativesEnvoi()
                                    + 1
                    )
            );


            executerEnvoi(
                    notification
            );
        }
    }









    @Override
    public void markAsRead(
            UUID notificationId,
            Authentication authentication
    ) {

        String email =
                authentication.getName();

        Utilisateur utilisateur =
                utilisateurRepository
                        .findByEmail(email)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Utilisateur introuvable"
                                )
                        );


        Notification notification =
                notificationRepository
                        .findByNotificationIdAndUtilisateurUtilisateurId(
                                notificationId,
                                utilisateur.getUtilisateurId()
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Notification introuvable ou accès interdit"
                                )
                        );


        if (Boolean.TRUE.equals(notification.getEstLu())) {
            return;
        }


        LocalDateTime now =
                LocalDateTime.now();

        notification.setEstLu(true);

        notification.setDateLecture(now);

        notification.setUpdatedAt(now);


        notificationRepository.save(
                notification
        );
    }
}