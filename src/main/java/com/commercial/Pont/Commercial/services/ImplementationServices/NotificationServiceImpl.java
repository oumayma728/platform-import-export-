package com.commercial.Pont.Commercial.services.ImplementationServices;

import com.commercial.Pont.Commercial.dtos.requestDtos.NotificationRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.NotificationResponseDto;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.NotificationMapperInterface;
import com.commercial.Pont.Commercial.models.Notification;
import com.commercial.Pont.Commercial.models.Utilisateur;
import com.commercial.Pont.Commercial.repositories.NotificationRepository;
import com.commercial.Pont.Commercial.repositories.UtilisateurRepository;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.NotificationServiceInterface;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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


    // =========================
    // CREATE
    // =========================

    @Override
    public NotificationResponseDto create(
            NotificationRequestDto notificationRequestDto
    ) {

        Notification notification =
                notificationMapper.requestToEntity(
                        notificationRequestDto
                );


        // =========================
        // Recherche de l'utilisateur
        // =========================

        Utilisateur utilisateur =
                utilisateurRepository.findById(
                                notificationRequestDto
                                        .getUtilisateurId()
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Utilisateur non trouvé avec l'id : "
                                                + notificationRequestDto
                                                .getUtilisateurId()
                                )
                        );


        // =========================
        // Association de l'utilisateur
        // =========================

        notification.setUtilisateur(
                utilisateur
        );


        // =========================
        // Valeurs par défaut
        // =========================

        if (notification.getTentativesEnvoi() == null) {
            notification.setTentativesEnvoi(0);
        }

        if (notification.getEstLu() == null) {
            notification.setEstLu(false);
        }


        // =========================
        // Gestion des dates
        // =========================

        LocalDateTime now =
                LocalDateTime.now();

        notification.setCreatedAt(
                now
        );

        notification.setUpdatedAt(
                now
        );


        // =========================
        // Sauvegarde
        // =========================

        Notification savedNotification =
                notificationRepository.save(
                        notification
                );

        return notificationMapper.entityToResponse(
                savedNotification
        );
    }


    // =========================
    // UPDATE
    // =========================

    @Override
    public NotificationResponseDto update(
            UUID notificationId,
            NotificationRequestDto notificationRequestDto
    ) {

        Notification existingNotification =
                notificationRepository.findById(
                                notificationId
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Notification non trouvée avec l'id : "
                                                + notificationId
                                )
                        );


        // =========================
        // Mise à jour des informations
        // =========================

        existingNotification.setTitre(
                notificationRequestDto.getTitre()
        );

        existingNotification.setContenu(
                notificationRequestDto.getContenu()
        );

        existingNotification.setTypeNotification(
                notificationRequestDto
                        .getTypeNotification()
        );

        existingNotification.setStatut(
                notificationRequestDto.getStatut()
        );

        existingNotification.setEmailDestinataire(
                notificationRequestDto
                        .getEmailDestinataire()
        );

        existingNotification.setTelephoneDestinataire(
                notificationRequestDto
                        .getTelephoneDestinataire()
        );

        existingNotification.setDateEnvoi(
                notificationRequestDto.getDateEnvoi()
        );

        existingNotification.setDateLecture(
                notificationRequestDto.getDateLecture()
        );

        existingNotification.setTentativesEnvoi(
                notificationRequestDto
                        .getTentativesEnvoi()
        );

        existingNotification.setEstLu(
                notificationRequestDto.getEstLu()
        );


        // =========================
        // Mise à jour de l'utilisateur
        // =========================

        if (
                notificationRequestDto.getUtilisateurId() != null
                        &&
                        (
                                existingNotification.getUtilisateur() == null
                                        ||
                                        !notificationRequestDto
                                                .getUtilisateurId()
                                                .equals(
                                                        existingNotification
                                                                .getUtilisateur()
                                                                .getUtilisateurId()
                                                )
                        )
        ) {

            Utilisateur utilisateur =
                    utilisateurRepository.findById(
                                    notificationRequestDto
                                            .getUtilisateurId()
                            )
                            .orElseThrow(() ->
                                    new EntityNotFoundException(
                                            "Utilisateur non trouvé avec l'id : "
                                                    + notificationRequestDto
                                                    .getUtilisateurId()
                                    )
                            );

            existingNotification.setUtilisateur(
                    utilisateur
            );
        }


        // =========================
        // Mise à jour automatique
        // =========================

        existingNotification.setUpdatedAt(
                LocalDateTime.now()
        );


        // =========================
        // Sauvegarde
        // =========================

        Notification updatedNotification =
                notificationRepository.save(
                        existingNotification
                );

        return notificationMapper.entityToResponse(
                updatedNotification
        );
    }


    // =========================
    // GET BY ID
    // =========================

    @Override
    @Transactional(readOnly = true)
    public NotificationResponseDto getById(
            UUID notificationId
    ) {

        Notification notification =
                notificationRepository.findById(
                                notificationId
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Notification non trouvée avec l'id : "
                                                + notificationId
                                )
                        );

        return notificationMapper.entityToResponse(
                notification
        );
    }


    // =========================
    // GET ALL
    // =========================

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponseDto> getAll() {

        return notificationRepository.findAll()
                .stream()
                .map(
                        notificationMapper::entityToResponse
                )
                .toList();
    }


    // =========================
    // DELETE
    // =========================

    @Override
    public void delete(
            UUID notificationId
    ) {

        if (
                !notificationRepository
                        .existsById(
                                notificationId
                        )
        ) {

            throw new EntityNotFoundException(
                    "Notification non trouvée avec l'id : "
                            + notificationId
            );
        }

        notificationRepository.deleteById(
                notificationId
        );
    }
}