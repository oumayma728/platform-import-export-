package com.commercial.Pont.Commercial.repositories;

import com.commercial.Pont.Commercial.enums.NotificationStatus;
import com.commercial.Pont.Commercial.enums.NotificationType;
import com.commercial.Pont.Commercial.models.Notification;
import com.commercial.Pont.Commercial.models.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    List<Notification> findByStatutAndTentativesEnvoiLessThan(
            NotificationStatus statut,
            Integer maxTentatives
    );

    boolean existsByUtilisateurAndTypeNotificationAndStatut(
            Utilisateur utilisateur,
            NotificationType typeNotification,
            NotificationStatus statut
    );

    Optional<Notification> findByNotificationIdAndUtilisateurUtilisateurId(
            UUID notificationId,
            UUID utilisateurId
    );

}
