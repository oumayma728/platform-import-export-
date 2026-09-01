package com.commercial.Pont.Commercial.services.ServiceInterfaces;

import com.commercial.Pont.Commercial.dtos.requestDtos.NotificationRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.NotificationResponseDto;
import com.commercial.Pont.Commercial.enums.NotificationType;
import com.commercial.Pont.Commercial.models.Utilisateur;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.UUID;

public interface NotificationServiceInterface {

    // ==========================================
    // CRUD EXISTANT
    // ==========================================

    NotificationResponseDto create(
            NotificationRequestDto requestDto
    );

    NotificationResponseDto update(
            UUID notificationId,
            NotificationRequestDto requestDto
    );

    NotificationResponseDto getById(
            UUID notificationId
    );

    List<NotificationResponseDto> getAll();

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

    void markAsRead(
            UUID notificationId,
            Authentication authentication
    );
}