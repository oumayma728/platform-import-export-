package com.commercial.Pont.Commercial.mappers.ImplementationMappers;

import com.commercial.Pont.Commercial.dtos.requestDtos.NotificationRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.NotificationResponseDto;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.NotificationMapperInterface;
import com.commercial.Pont.Commercial.models.Notification;
import com.commercial.Pont.Commercial.models.Utilisateur;
import com.commercial.Pont.Commercial.repositories.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class NotificationMapperImpl
        implements NotificationMapperInterface {

    private final UtilisateurRepository utilisateurRepository;


    /**
     * ============================================================
     * REQUEST DTO -> ENTITY
     * ============================================================
     *
     * NotificationRequestDto
     *          ↓
     *      Notification
     *
     * utilisateurId → Utilisateur
     */
    @Override
    public Notification requestToEntity(
            NotificationRequestDto notificationRequestDto) {

        if (notificationRequestDto == null) {
            return null;
        }


        /*
         * ========================================================
         * Récupération de l'Utilisateur
         * ========================================================
         */
        Utilisateur utilisateur = null;

        if (notificationRequestDto.getUtilisateurId() != null) {

            utilisateur = utilisateurRepository
                    .findById(
                            notificationRequestDto
                                    .getUtilisateurId()
                    )
                    .orElse(null);
        }


        /*
         * ========================================================
         * Construction de l'entité Notification
         * ========================================================
         */
        return Notification.builder()

                // Informations principales
                .titre(
                        notificationRequestDto.getTitre()
                )
                .contenu(
                        notificationRequestDto.getContenu()
                )
                .typeNotification(
                        notificationRequestDto.getTypeNotification()
                )
                .statut(
                        notificationRequestDto.getStatut()
                )
                .emailDestinataire(
                        notificationRequestDto.getEmailDestinataire()
                )
                .telephoneDestinataire(
                        notificationRequestDto.getTelephoneDestinataire()
                )
                .dateEnvoi(
                        notificationRequestDto.getDateEnvoi()
                )
                .dateLecture(
                        notificationRequestDto.getDateLecture()
                )
                .tentativesEnvoi(
                        notificationRequestDto.getTentativesEnvoi()
                )
                .estLu(
                        notificationRequestDto.getEstLu()
                )
                .createdAt(
                        notificationRequestDto.getCreatedAt()
                )
                .updatedAt(
                        notificationRequestDto.getUpdatedAt()
                )

                // Relation avec Utilisateur
                .utilisateur(utilisateur)

                .build();
    }


    /**
     * ============================================================
     * ENTITY -> REQUEST DTO
     * ============================================================
     *
     * Notification
     *       ↓
     * NotificationRequestDto
     *
     * utilisateur → utilisateurId
     */
    @Override
    public NotificationRequestDto entityToRequest(
            Notification notification) {

        if (notification == null) {
            return null;
        }


        /*
         * ========================================================
         * Extraction de l'ID de l'Utilisateur
         * ========================================================
         */
        UUID utilisateurId = null;

        if (notification.getUtilisateur() != null) {

            utilisateurId = notification
                    .getUtilisateur()
                    .getUtilisateurId();
        }


        /*
         * ========================================================
         * Construction du Request DTO
         * ========================================================
         */
        return NotificationRequestDto.builder()

                // ID de la relation
                .utilisateurId(utilisateurId)

                // Informations principales
                .titre(
                        notification.getTitre()
                )
                .contenu(
                        notification.getContenu()
                )
                .typeNotification(
                        notification.getTypeNotification()
                )
                .statut(
                        notification.getStatut()
                )
                .emailDestinataire(
                        notification.getEmailDestinataire()
                )
                .telephoneDestinataire(
                        notification.getTelephoneDestinataire()
                )
                .dateEnvoi(
                        notification.getDateEnvoi()
                )
                .dateLecture(
                        notification.getDateLecture()
                )
                .tentativesEnvoi(
                        notification.getTentativesEnvoi()
                )
                .estLu(
                        notification.getEstLu()
                )
                .createdAt(
                        notification.getCreatedAt()
                )
                .updatedAt(
                        notification.getUpdatedAt()
                )

                .build();
    }


    /**
     * ============================================================
     * ENTITY -> RESPONSE DTO
     * ============================================================
     *
     * Notification
     *       ↓
     * NotificationResponseDto
     *
     * utilisateur → utilisateurId
     */
    @Override
    public NotificationResponseDto entityToResponse(
            Notification notification) {

        if (notification == null) {
            return null;
        }


        /*
         * ========================================================
         * Extraction de l'ID de l'Utilisateur
         * ========================================================
         */
        UUID utilisateurId = null;

        if (notification.getUtilisateur() != null) {

            utilisateurId = notification
                    .getUtilisateur()
                    .getUtilisateurId();
        }


        /*
         * ========================================================
         * Construction du Response DTO
         * ========================================================
         */
        return NotificationResponseDto.builder()

                // ID de l'utilisateur
                .utilisateurId(utilisateurId)

                // ID de la notification
                .notificationId(
                        notification.getNotificationId()
                )

                // Informations principales
                .titre(
                        notification.getTitre()
                )
                .contenu(
                        notification.getContenu()
                )
                .typeNotification(
                        notification.getTypeNotification()
                )
                .statut(
                        notification.getStatut()
                )
                .emailDestinataire(
                        notification.getEmailDestinataire()
                )
                .telephoneDestinataire(
                        notification.getTelephoneDestinataire()
                )
                .dateEnvoi(
                        notification.getDateEnvoi()
                )
                .dateLecture(
                        notification.getDateLecture()
                )
                .tentativesEnvoi(
                        notification.getTentativesEnvoi()
                )
                .estLu(
                        notification.getEstLu()
                )
                .createdAt(
                        notification.getCreatedAt()
                )
                .updatedAt(
                        notification.getUpdatedAt()
                )

                .build();
    }


    /**
     * ============================================================
     * RESPONSE DTO -> ENTITY
     * ============================================================
     *
     * NotificationResponseDto
     *          ↓
     *      Notification
     *
     * utilisateurId → Utilisateur
     */
    @Override
    public Notification responseToEntity(
            NotificationResponseDto notificationResponseDto) {

        if (notificationResponseDto == null) {
            return null;
        }


        /*
         * ========================================================
         * Récupération de l'Utilisateur
         * ========================================================
         */
        Utilisateur utilisateur = null;

        if (notificationResponseDto.getUtilisateurId() != null) {

            utilisateur = utilisateurRepository
                    .findById(
                            notificationResponseDto
                                    .getUtilisateurId()
                    )
                    .orElse(null);
        }


        /*
         * ========================================================
         * Construction de l'entité Notification
         * ========================================================
         */
        return Notification.builder()

                // ID de la Notification
                .notificationId(
                        notificationResponseDto
                                .getNotificationId()
                )

                // Informations principales
                .titre(
                        notificationResponseDto.getTitre()
                )
                .contenu(
                        notificationResponseDto.getContenu()
                )
                .typeNotification(
                        notificationResponseDto
                                .getTypeNotification()
                )
                .statut(
                        notificationResponseDto.getStatut()
                )
                .emailDestinataire(
                        notificationResponseDto
                                .getEmailDestinataire()
                )
                .telephoneDestinataire(
                        notificationResponseDto
                                .getTelephoneDestinataire()
                )
                .dateEnvoi(
                        notificationResponseDto
                                .getDateEnvoi()
                )
                .dateLecture(
                        notificationResponseDto
                                .getDateLecture()
                )
                .tentativesEnvoi(
                        notificationResponseDto
                                .getTentativesEnvoi()
                )
                .estLu(
                        notificationResponseDto
                                .getEstLu()
                )
                .createdAt(
                        notificationResponseDto
                                .getCreatedAt()
                )
                .updatedAt(
                        notificationResponseDto
                                .getUpdatedAt()
                )

                // Relation avec Utilisateur
                .utilisateur(utilisateur)

                .build();
    }
}