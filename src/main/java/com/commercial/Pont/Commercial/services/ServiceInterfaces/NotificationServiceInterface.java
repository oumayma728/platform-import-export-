package com.commercial.Pont.Commercial.services.ServiceInterfaces;

import com.commercial.Pont.Commercial.dtos.requestDtos.NotificationRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.NotificationResponseDto;
import com.commercial.Pont.Commercial.enums.NotificationType;
import com.commercial.Pont.Commercial.models.Utilisateur;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;
import java.util.UUID;

public interface NotificationServiceInterface {

    // ==========================================
    // CRUD EXISTANT
    // ==========================================
    @PreAuthorize("hasRole('ADMIN')")
    NotificationResponseDto create(
            NotificationRequestDto requestDto
    );

    @PreAuthorize("hasRole('ADMIN')")
    NotificationResponseDto update(
            UUID notificationId,
            NotificationRequestDto requestDto
    );

    @PreAuthorize("hasAnyRole('ADMIN', 'IMPORTATEUR', 'EXPORTATEUR')")
    NotificationResponseDto getById(
            UUID notificationId
    );
    @PreAuthorize("hasAnyRole('ADMIN', 'IMPORTATEUR', 'EXPORTATEUR')")
    List<NotificationResponseDto> getAll();

    @PreAuthorize("hasRole('ADMIN')")
    void delete(
            UUID notificationId
    );


    // ==========================================
    // EMAIL / SMS
    // ==========================================

    void sendEmail(
            Utilisateur utilisateur,
            NotificationType type,
            String subject,
            String body
    );


    void sendSms(
            Utilisateur utilisateur,
            NotificationType type,
            String message
    );


    // ==========================================
    // EVENEMENTS METIER
    // ==========================================

    void notifierBienvenue(
            Utilisateur utilisateur
    );

    void notifierValidationCompte(
            Utilisateur utilisateur
    );

    void notifierNouveauMessage(
            Utilisateur destinataire,
            Utilisateur expediteur
    );

    void notifierPaiementConfirme(
            Utilisateur utilisateur
    );

    void notifierQuotaAtteint(
            Utilisateur utilisateur
    );

    void notifierPropositionMatching(
            Utilisateur utilisateur,
            String descriptionMatching
    );


    // ==========================================
    // RETRY
    // ==========================================

    void retryNotificationsEchouees();

    @PreAuthorize("hasAnyRole('IMPORTATEUR', 'EXPORTATEUR')")
    void markAsRead(
            UUID notificationId,
            Authentication authentication
    );
}