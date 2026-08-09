package com.commercial.Pont.Commercial.mappers.ImplementationMappers;

import com.commercial.Pont.Commercial.dtos.requestDtos.UtilisateurRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.UtilisateurResponseDto;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.UtilisateurMapperInterface;
import com.commercial.Pont.Commercial.models.*;
import com.commercial.Pont.Commercial.repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class UtilisateurMapperImpl
        implements UtilisateurMapperInterface {

    private final EntrepriseRepository entrepriseRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final AnnonceRepository annonceRepository;
    private final DocumentConversationRepository documentConversationRepository;
    private final NotificationRepository notificationRepository;
    private final RoleUtilisateurRepository roleUtilisateurRepository;


    /**
     * ============================================================
     * REQUEST DTO -> ENTITY
     * ============================================================
     *
     * UtilisateurRequestDto
     *          ↓
     *       Utilisateur
     *
     * entrepriseId
     * subscriptionsIds
     * messageIds
     * conversationsCommeVendeurIds
     * conversationsCommeAcheteurIds
     * annoncesIds
     * documentConversationsIds
     * notificationsIds
     * utilisateurRoleIds
     *          ↓
     *       Relations JPA
     */
    @Override
    public Utilisateur requestToEntity(
            UtilisateurRequestDto utilisateurRequestDto) {

        if (utilisateurRequestDto == null) {
            return null;
        }


        /*
         * ========================================================
         * Récupération de l'Entreprise
         * ========================================================
         */
        Entreprise entreprise = null;

        if (utilisateurRequestDto.getEntrepriseId() != null) {

            entreprise = entrepriseRepository
                    .findById(
                            utilisateurRequestDto
                                    .getEntrepriseId()
                    )
                    .orElse(null);
        }


        /*
         * ========================================================
         * Récupération des Subscriptions
         * ========================================================
         */
        List<Subscription> subscriptions =
                Collections.emptyList();

        if (utilisateurRequestDto.getSubscriptionsIds() != null
                && !utilisateurRequestDto
                .getSubscriptionsIds()
                .isEmpty()) {

            subscriptions = subscriptionRepository
                    .findAllById(
                            utilisateurRequestDto
                                    .getSubscriptionsIds()
                    );
        }


        /*
         * ========================================================
         * Récupération des Messages
         * ========================================================
         */
        List<Message> messages =
                Collections.emptyList();

        if (utilisateurRequestDto.getMessageIds() != null
                && !utilisateurRequestDto
                .getMessageIds()
                .isEmpty()) {

            messages = messageRepository
                    .findAllById(
                            utilisateurRequestDto
                                    .getMessageIds()
                    );
        }


        /*
         * ========================================================
         * Récupération des Conversations comme Vendeur
         * ========================================================
         */
        List<Conversation> conversationsCommeVendeur =
                Collections.emptyList();

        if (utilisateurRequestDto
                .getConversationsCommeVendeurIds() != null
                && !utilisateurRequestDto
                .getConversationsCommeVendeurIds()
                .isEmpty()) {

            conversationsCommeVendeur =
                    conversationRepository.findAllById(
                            utilisateurRequestDto
                                    .getConversationsCommeVendeurIds()
                    );
        }


        /*
         * ========================================================
         * Récupération des Conversations comme Acheteur
         * ========================================================
         */
        List<Conversation> conversationsCommeAcheteur =
                Collections.emptyList();

        if (utilisateurRequestDto
                .getConversationsCommeAcheteurIds() != null
                && !utilisateurRequestDto
                .getConversationsCommeAcheteurIds()
                .isEmpty()) {

            conversationsCommeAcheteur =
                    conversationRepository.findAllById(
                            utilisateurRequestDto
                                    .getConversationsCommeAcheteurIds()
                    );
        }


        /*
         * ========================================================
         * Récupération des Annonces
         * ========================================================
         */
        List<Annonce> annonces =
                Collections.emptyList();

        if (utilisateurRequestDto.getAnnoncesIds() != null
                && !utilisateurRequestDto
                .getAnnoncesIds()
                .isEmpty()) {

            annonces = annonceRepository
                    .findAllById(
                            utilisateurRequestDto
                                    .getAnnoncesIds()
                    );
        }


        /*
         * ========================================================
         * Récupération des Documents de Conversation
         * ========================================================
         */
        List<DocumentConversation> documentConversations =
                Collections.emptyList();

        if (utilisateurRequestDto
                .getDocumentConversationsIds() != null
                && !utilisateurRequestDto
                .getDocumentConversationsIds()
                .isEmpty()) {

            documentConversations =
                    documentConversationRepository.findAllById(
                            utilisateurRequestDto
                                    .getDocumentConversationsIds()
                    );
        }


        /*
         * ========================================================
         * Récupération des Notifications
         * ========================================================
         */
        List<Notification> notifications =
                Collections.emptyList();

        if (utilisateurRequestDto.getNotificationsIds() != null
                && !utilisateurRequestDto
                .getNotificationsIds()
                .isEmpty()) {

            notifications = notificationRepository
                    .findAllById(
                            utilisateurRequestDto
                                    .getNotificationsIds()
                    );
        }


        /*
         * ========================================================
         * Récupération des rôles utilisateur
         * ========================================================
         */
        Set<RoleUtilisateur> utilisateurs =
                Collections.emptySet();

        if (utilisateurRequestDto
                .getUtilisateurRoleIds() != null
                && !utilisateurRequestDto
                .getUtilisateurRoleIds()
                .isEmpty()) {

            utilisateurs = roleUtilisateurRepository
                    .findAllById(
                            utilisateurRequestDto
                                    .getUtilisateurRoleIds()
                    )
                    .stream()
                    .collect(Collectors.toSet());
        }


        /*
         * ========================================================
         * Construction de l'entité Utilisateur
         * ========================================================
         */
        return Utilisateur.builder()

                // Informations principales
                .email(
                        utilisateurRequestDto.getEmail()
                )
                .passwordHash(
                        utilisateurRequestDto.getPassword()
                )
                .nom(
                        utilisateurRequestDto.getNom()
                )
                .prenom(
                        utilisateurRequestDto.getPrenom()
                )
                .telephone(
                        utilisateurRequestDto.getTelephone()
                )
                .fonction(
                        utilisateurRequestDto.getFonction()
                )
                .photoProfile(
                        utilisateurRequestDto.getPhotoProfile()
                )

                // Relations
                .entreprise(entreprise)
                .subscriptions(subscriptions)
                .messages(messages)
                .conversationsCommeVendeur(
                        conversationsCommeVendeur
                )
                .conversationsCommeAcheteur(
                        conversationsCommeAcheteur
                )
                .annonces(annonces)
                .documentConversations(
                        documentConversations
                )
                .notifications(notifications)
                .roles(utilisateurs)

                .build();
    }


    /**
     * ============================================================
     * ENTITY -> REQUEST DTO
     * ============================================================
     */
    @Override
    public UtilisateurRequestDto entityToRequest(
            Utilisateur utilisateur) {

        if (utilisateur == null) {
            return null;
        }


        /*
         * ========================================================
         * Extraction de l'ID de l'Entreprise
         * ========================================================
         */
        UUID entrepriseId = null;

        if (utilisateur.getEntreprise() != null) {

            entrepriseId = utilisateur
                    .getEntreprise()
                    .getEntrepriseId();
        }


        /*
         * ========================================================
         * Extraction des IDs des Subscriptions
         * ========================================================
         */
        List<UUID> subscriptionsIds =
                utilisateur.getSubscriptions() == null
                        ? Collections.emptyList()
                        : utilisateur.getSubscriptions()
                        .stream()
                        .map(Subscription::getSubscriptionId)
                        .collect(Collectors.toList());


        /*
         * ========================================================
         * Extraction des IDs des Messages
         * ========================================================
         */
        List<UUID> messageIds =
                utilisateur.getMessages() == null
                        ? Collections.emptyList()
                        : utilisateur.getMessages()
                        .stream()
                        .map(Message::getMessageId)
                        .collect(Collectors.toList());


        /*
         * ========================================================
         * Conversations comme Vendeur
         * ========================================================
         */
        List<UUID> conversationsCommeVendeurIds =
                utilisateur.getConversationsCommeVendeur() == null
                        ? Collections.emptyList()
                        : utilisateur
                        .getConversationsCommeVendeur()
                        .stream()
                        .map(Conversation::getConversationId)
                        .collect(Collectors.toList());


        /*
         * ========================================================
         * Conversations comme Acheteur
         * ========================================================
         */
        List<UUID> conversationsCommeAcheteurIds =
                utilisateur.getConversationsCommeAcheteur() == null
                        ? Collections.emptyList()
                        : utilisateur
                        .getConversationsCommeAcheteur()
                        .stream()
                        .map(Conversation::getConversationId)
                        .collect(Collectors.toList());


        /*
         * ========================================================
         * Extraction des IDs des Annonces
         * ========================================================
         */
        List<UUID> annoncesIds =
                utilisateur.getAnnonces() == null
                        ? Collections.emptyList()
                        : utilisateur.getAnnonces()
                        .stream()
                        .map(Annonce::getAnnonceId)
                        .collect(Collectors.toList());


        /*
         * ========================================================
         * Extraction des IDs des Documents
         * ========================================================
         */
        List<UUID> documentConversationsIds =
                utilisateur.getDocumentConversations() == null
                        ? Collections.emptyList()
                        : utilisateur
                        .getDocumentConversations()
                        .stream()
                        .map(DocumentConversation::getDocumentConversationId)
                        .collect(Collectors.toList());


        /*
         * ========================================================
         * Extraction des IDs des Notifications
         * ========================================================
         */
        List<UUID> notificationsIds =
                utilisateur.getNotifications() == null
                        ? Collections.emptyList()
                        : utilisateur
                        .getNotifications()
                        .stream()
                        .map(Notification::getNotificationId)
                        .collect(Collectors.toList());


        /*
         * ========================================================
         * Extraction des IDs des RoleUtilisateur
         * ========================================================
         */
        Set<UUID> utilisateurRoleIds =
                utilisateur.getRoles() == null
                        ? Collections.emptySet()
                        : utilisateur
                        .getRoles()
                        .stream()
                        .map(RoleUtilisateur::getRoleUtilisateurId)
                        .collect(Collectors.toSet());


        /*
         * ========================================================
         * Construction du Request DTO
         * ========================================================
         */
        return UtilisateurRequestDto.builder()

                // Relation Entreprise
                .entrepriseId(entrepriseId)

                // Informations principales
                .email(
                        utilisateur.getEmail()
                )
                .password(
                        utilisateur.getPasswordHash()
                )
                .nom(
                        utilisateur.getNom()
                )
                .prenom(
                        utilisateur.getPrenom()
                )
                .telephone(
                        utilisateur.getTelephone()
                )
                .fonction(
                        utilisateur.getFonction()
                )
                .photoProfile(
                        utilisateur.getPhotoProfile()
                )

                // Relations
                .subscriptionsIds(subscriptionsIds)
                .messageIds(messageIds)
                .conversationsCommeVendeurIds(
                        conversationsCommeVendeurIds
                )
                .conversationsCommeAcheteurIds(
                        conversationsCommeAcheteurIds
                )
                .annoncesIds(annoncesIds)
                .documentConversationsIds(
                        documentConversationsIds
                )
                .notificationsIds(notificationsIds)
                .utilisateurRoleIds(
                        utilisateurRoleIds
                )

                .build();
    }


    /**
     * ============================================================
     * ENTITY -> RESPONSE DTO
     * ============================================================
     */
    @Override
    public UtilisateurResponseDto entityToResponse(
            Utilisateur utilisateur) {

        if (utilisateur == null) {
            return null;
        }


        /*
         * ========================================================
         * Extraction de l'ID de l'Entreprise
         * ========================================================
         */
        UUID entrepriseId = null;

        if (utilisateur.getEntreprise() != null) {

            entrepriseId = utilisateur
                    .getEntreprise()
                    .getEntrepriseId();
        }


        /*
         * ========================================================
         * Extraction des IDs des relations
         * ========================================================
         */
        List<UUID> subscriptionsIds =
                utilisateur.getSubscriptions() == null
                        ? Collections.emptyList()
                        : utilisateur.getSubscriptions()
                        .stream()
                        .map(Subscription::getSubscriptionId)
                        .collect(Collectors.toList());


        List<UUID> messageIds =
                utilisateur.getMessages() == null
                        ? Collections.emptyList()
                        : utilisateur.getMessages()
                        .stream()
                        .map(Message::getMessageId)
                        .collect(Collectors.toList());


        List<UUID> conversationsCommeVendeurIds =
                utilisateur.getConversationsCommeVendeur() == null
                        ? Collections.emptyList()
                        : utilisateur
                        .getConversationsCommeVendeur()
                        .stream()
                        .map(Conversation::getConversationId)
                        .collect(Collectors.toList());


        List<UUID> conversationsCommeAcheteurIds =
                utilisateur.getConversationsCommeAcheteur() == null
                        ? Collections.emptyList()
                        : utilisateur
                        .getConversationsCommeAcheteur()
                        .stream()
                        .map(Conversation::getConversationId)
                        .collect(Collectors.toList());


        List<UUID> annoncesIds =
                utilisateur.getAnnonces() == null
                        ? Collections.emptyList()
                        : utilisateur.getAnnonces()
                        .stream()
                        .map(Annonce::getAnnonceId)
                        .collect(Collectors.toList());


        List<UUID> documentConversationsIds =
                utilisateur.getDocumentConversations() == null
                        ? Collections.emptyList()
                        : utilisateur
                        .getDocumentConversations()
                        .stream()
                        .map(DocumentConversation::getDocumentConversationId)
                        .collect(Collectors.toList());


        List<UUID> notificationsIds =
                utilisateur.getNotifications() == null
                        ? Collections.emptyList()
                        : utilisateur.getNotifications()
                        .stream()
                        .map(Notification::getNotificationId)
                        .collect(Collectors.toList());


        Set<UUID> utilisateurRoleIds =
                utilisateur.getRoles() == null
                        ? Collections.emptySet()
                        : utilisateur
                        .getRoles()
                        .stream()
                        .map(RoleUtilisateur::getRoleUtilisateurId)
                        .collect(Collectors.toSet());


        Set<UUID> roleIds =
                utilisateur.getRoles() == null
                        ? Collections.emptySet()
                        : utilisateur
                        .getRoles()
                        .stream()
                        .map(RoleUtilisateur::getRole)
                        .filter(Objects::nonNull)
                        .map(Role::getRoleId)
                        .collect(Collectors.toSet());


        Set<String> roleNames =
                utilisateur.getRoles() == null
                        ? Collections.emptySet()
                        : utilisateur
                        .getRoles()
                        .stream()
                        .map(RoleUtilisateur::getRole)
                        .filter(Objects::nonNull)
                        .map(Role::getCode)
                        .collect(Collectors.toSet());
        /*
         * ========================================================
         * Construction du Response DTO
         * ========================================================
         */
        return UtilisateurResponseDto.builder()

                // ID de l'Utilisateur
                .utilisateurId(
                        utilisateur.getUtilisateurId()
                )

                // Relation Entreprise
                .entrepriseId(entrepriseId)

                // Informations principales
                .email(
                        utilisateur.getEmail()
                )
                .nom(
                        utilisateur.getNom()
                )
                .prenom(
                        utilisateur.getPrenom()
                )
                .telephone(
                        utilisateur.getTelephone()
                )
                .fonction(
                        utilisateur.getFonction()
                )
                .validationStatus(
                        utilisateur.getValidationStatus()
                )
                .nombreChatsUtilises(
                        utilisateur.getNombreChatsUtilises()
                )
                .maxMessagesPossible(
                        utilisateur.getMaxMessagesPossible()
                )
                .photoProfile(
                        utilisateur.getPhotoProfile()
                )
                .authProvider(
                        utilisateur.getAuthProvider()
                )
                .createdAt(
                        utilisateur.getCreatedAt()
                )
                .updatedAt(
                        utilisateur.getUpdatedAt()
                )

                // IDs des relations
                .subscriptionsIds(subscriptionsIds)
                .messageIds(messageIds)
                .conversationsCommeVendeurIds(
                        conversationsCommeVendeurIds
                )
                .conversationsCommeAcheteurIds(
                        conversationsCommeAcheteurIds
                )
                .annoncesIds(annoncesIds)
                .documentConversationsIds(
                        documentConversationsIds
                )
                .notificationsIds(
                        notificationsIds
                )
                .utilisateurRoleIds(
                        utilisateurRoleIds
                )
                .roleIds(
                        roleIds
                )
                .roleNames(
                        roleNames
                )

                .build();
    }


    /**
     * ============================================================
     * RESPONSE DTO -> ENTITY
     * ============================================================
     */
    @Override
    public Utilisateur responseToEntity(
            UtilisateurResponseDto utilisateurResponseDto) {

        if (utilisateurResponseDto == null) {
            return null;
        }


        /*
         * ========================================================
         * Récupération de l'Entreprise
         * ========================================================
         */
        Entreprise entreprise = null;

        if (utilisateurResponseDto.getEntrepriseId() != null) {

            entreprise = entrepriseRepository
                    .findById(
                            utilisateurResponseDto
                                    .getEntrepriseId()
                    )
                    .orElse(null);
        }


        /*
         * ========================================================
         * Récupération des Subscriptions
         * ========================================================
         */
        List<Subscription> subscriptions =
                Collections.emptyList();

        if (utilisateurResponseDto.getSubscriptionsIds() != null
                && !utilisateurResponseDto
                .getSubscriptionsIds()
                .isEmpty()) {

            subscriptions = subscriptionRepository
                    .findAllById(
                            utilisateurResponseDto
                                    .getSubscriptionsIds()
                    );
        }


        /*
         * ========================================================
         * Récupération des Messages
         * ========================================================
         */
        List<Message> messages =
                Collections.emptyList();

        if (utilisateurResponseDto.getMessageIds() != null
                && !utilisateurResponseDto
                .getMessageIds()
                .isEmpty()) {

            messages = messageRepository
                    .findAllById(
                            utilisateurResponseDto
                                    .getMessageIds()
                    );
        }


        /*
         * ========================================================
         * Récupération des Conversations Vendeur
         * ========================================================
         */
        List<Conversation> conversationsCommeVendeur =
                Collections.emptyList();

        if (utilisateurResponseDto
                .getConversationsCommeVendeurIds() != null
                && !utilisateurResponseDto
                .getConversationsCommeVendeurIds()
                .isEmpty()) {

            conversationsCommeVendeur =
                    conversationRepository.findAllById(
                            utilisateurResponseDto
                                    .getConversationsCommeVendeurIds()
                    );
        }


        /*
         * ========================================================
         * Récupération des Conversations Acheteur
         * ========================================================
         */
        List<Conversation> conversationsCommeAcheteur =
                Collections.emptyList();

        if (utilisateurResponseDto
                .getConversationsCommeAcheteurIds() != null
                && !utilisateurResponseDto
                .getConversationsCommeAcheteurIds()
                .isEmpty()) {

            conversationsCommeAcheteur =
                    conversationRepository.findAllById(
                            utilisateurResponseDto
                                    .getConversationsCommeAcheteurIds()
                    );
        }


        /*
         * ========================================================
         * Récupération des Annonces
         * ========================================================
         */
        List<Annonce> annonces =
                Collections.emptyList();

        if (utilisateurResponseDto.getAnnoncesIds() != null
                && !utilisateurResponseDto
                .getAnnoncesIds()
                .isEmpty()) {

            annonces = annonceRepository
                    .findAllById(
                            utilisateurResponseDto
                                    .getAnnoncesIds()
                    );
        }


        /*
         * ========================================================
         * Récupération des Documents de Conversation
         * ========================================================
         */
        List<DocumentConversation> documentConversations =
                Collections.emptyList();

        if (utilisateurResponseDto
                .getDocumentConversationsIds() != null
                && !utilisateurResponseDto
                .getDocumentConversationsIds()
                .isEmpty()) {

            documentConversations =
                    documentConversationRepository.findAllById(
                            utilisateurResponseDto
                                    .getDocumentConversationsIds()
                    );
        }


        /*
         * ========================================================
         * Récupération des Notifications
         * ========================================================
         */
        List<Notification> notifications =
                Collections.emptyList();

        if (utilisateurResponseDto.getNotificationsIds() != null
                && !utilisateurResponseDto
                .getNotificationsIds()
                .isEmpty()) {

            notifications = notificationRepository
                    .findAllById(
                            utilisateurResponseDto
                                    .getNotificationsIds()
                    );
        }


        /*
         * ========================================================
         * Récupération des RoleUtilisateur
         * ========================================================
         */
        Set<RoleUtilisateur> utilisateurs =
                Collections.emptySet();

        if (utilisateurResponseDto
                .getUtilisateurRoleIds() != null
                && !utilisateurResponseDto
                .getUtilisateurRoleIds()
                .isEmpty()) {

            utilisateurs = roleUtilisateurRepository
                    .findAllById(
                            utilisateurResponseDto
                                    .getUtilisateurRoleIds()
                    )
                    .stream()
                    .collect(Collectors.toSet());
        }


        /*
         * ========================================================
         * Construction de l'entité Utilisateur
         * ========================================================
         */
        return Utilisateur.builder()

                // ID de l'utilisateur
                .utilisateurId(
                        utilisateurResponseDto
                                .getUtilisateurId()
                )

                // Informations principales
                .email(
                        utilisateurResponseDto.getEmail()
                )
                .nom(
                        utilisateurResponseDto.getNom()
                )
                .prenom(
                        utilisateurResponseDto.getPrenom()
                )
                .telephone(
                        utilisateurResponseDto.getTelephone()
                )
                .fonction(
                        utilisateurResponseDto.getFonction()
                )
                .validationStatus(
                        utilisateurResponseDto
                                .getValidationStatus()
                )
                .nombreChatsUtilises(
                        utilisateurResponseDto
                                .getNombreChatsUtilises()
                )
                .maxMessagesPossible(
                        utilisateurResponseDto
                                .getMaxMessagesPossible()
                )
                .authProvider(
                        utilisateurResponseDto
                                .getAuthProvider()
                )
                .photoProfile(
                        utilisateurResponseDto.getPhotoProfile()
                )
                .createdAt(
                        utilisateurResponseDto.getCreatedAt()
                )
                .updatedAt(
                        utilisateurResponseDto.getUpdatedAt()
                )

                // Relations
                .entreprise(entreprise)
                .subscriptions(subscriptions)
                .messages(messages)
                .conversationsCommeVendeur(
                        conversationsCommeVendeur
                )
                .conversationsCommeAcheteur(
                        conversationsCommeAcheteur
                )
                .annonces(annonces)
                .documentConversations(
                        documentConversations
                )
                .notifications(notifications)
                .roles(utilisateurs)

                .build();
    }
}