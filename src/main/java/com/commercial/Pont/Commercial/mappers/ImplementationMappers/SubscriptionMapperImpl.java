package com.commercial.Pont.Commercial.mappers.ImplementationMappers;

import com.commercial.Pont.Commercial.dtos.requestDtos.SubscriptionRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.SubscriptionResponseDto;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.SubscriptionMapperInterface;
import com.commercial.Pont.Commercial.models.Abonnement;
import com.commercial.Pont.Commercial.models.Facturation;
import com.commercial.Pont.Commercial.models.Subscription;
import com.commercial.Pont.Commercial.models.Utilisateur;
import com.commercial.Pont.Commercial.repositories.AbonnementRepository;
import com.commercial.Pont.Commercial.repositories.FacturationRepository;
import com.commercial.Pont.Commercial.repositories.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class SubscriptionMapperImpl
        implements SubscriptionMapperInterface {

    private final UtilisateurRepository utilisateurRepository;

    private final AbonnementRepository abonnementRepository;

    private final FacturationRepository facturationRepository;


    /**
     * ============================================================
     * REQUEST DTO -> ENTITY
     * ============================================================
     *
     * SubscriptionRequestDto
     *          ↓
     *       Subscription
     *
     * utilisateurId  → Utilisateur
     * abonnementId   → Abonnement
     * facturationId  → Facturation
     */
    @Override
    public Subscription requestToEntity(
            SubscriptionRequestDto subscriptionRequestDto) {

        if (subscriptionRequestDto == null) {
            return null;
        }


        /*
         * ========================================================
         * Récupération de l'Utilisateur
         * ========================================================
         */
        Utilisateur utilisateur = null;

        if (subscriptionRequestDto.getUtilisateurId() != null) {

            utilisateur = utilisateurRepository
                    .findById(
                            subscriptionRequestDto
                                    .getUtilisateurId()
                    )
                    .orElse(null);
        }


        /*
         * ========================================================
         * Récupération de l'Abonnement
         * ========================================================
         */
        Abonnement abonnement = null;

        if (subscriptionRequestDto.getAbonnementId() != null) {

            abonnement = abonnementRepository
                    .findById(
                            subscriptionRequestDto
                                    .getAbonnementId()
                    )
                    .orElse(null);
        }


        /*
         * ========================================================
         * Récupération de la Facturation
         * ========================================================
         */
        Facturation facturation = null;

        if (subscriptionRequestDto.getFacturationId() != null) {

            facturation = facturationRepository
                    .findById(
                            subscriptionRequestDto
                                    .getFacturationId()
                    )
                    .orElse(null);
        }


        /*
         * ========================================================
         * Construction de l'entité Subscription
         * ========================================================
         */
        return Subscription.builder()

                // Relations
                .utilisateur(utilisateur)
                .abonnement(abonnement)
                .facturation(facturation)

                // Informations principales
                .dateDebut(
                        subscriptionRequestDto
                                .getDateDebut()
                )
                .dateFin(
                        subscriptionRequestDto
                                .getDateFin()
                )

                .build();
    }


    /**
     * ============================================================
     * ENTITY -> REQUEST DTO
     * ============================================================
     *
     * Subscription
     *       ↓
     * SubscriptionRequestDto
     *
     * utilisateur  → utilisateurId
     * abonnement   → abonnementId
     * facturation   → facturationId
     */
    @Override
    public SubscriptionRequestDto entityToRequest(
            Subscription subscription) {

        if (subscription == null) {
            return null;
        }


        /*
         * ========================================================
         * Extraction de l'ID de l'Utilisateur
         * ========================================================
         */
        UUID utilisateurId = null;

        if (subscription.getUtilisateur() != null) {

            utilisateurId = subscription
                    .getUtilisateur()
                    .getUtilisateurId();
        }


        /*
         * ========================================================
         * Extraction de l'ID de l'Abonnement
         * ========================================================
         */
        UUID abonnementId = null;

        if (subscription.getAbonnement() != null) {

            abonnementId = subscription
                    .getAbonnement()
                    .getAbonnementId();
        }


        /*
         * ========================================================
         * Extraction de l'ID de la Facturation
         * ========================================================
         */
        UUID facturationId = null;

        if (subscription.getFacturation() != null) {

            facturationId = subscription
                    .getFacturation()
                    .getFacturationId();
        }


        /*
         * ========================================================
         * Construction du Request DTO
         * ========================================================
         */
        return SubscriptionRequestDto.builder()

                // IDs des relations
                .utilisateurId(utilisateurId)
                .abonnementId(abonnementId)
                .facturationId(facturationId)

                // Informations principales
                .dateDebut(
                        subscription.getDateDebut()
                )
                .dateFin(
                        subscription.getDateFin()
                )

                .build();
    }


    /**
     * ============================================================
     * ENTITY -> RESPONSE DTO
     * ============================================================
     *
     * Subscription
     *       ↓
     * SubscriptionResponseDto
     *
     * utilisateur  → utilisateurId
     * abonnement   → abonnementId
     * facturation   → facturationId
     */
    @Override
    public SubscriptionResponseDto entityToResponse(
            Subscription subscription) {

        if (subscription == null) {
            return null;
        }


        /*
         * ========================================================
         * Extraction de l'ID de l'Utilisateur
         * ========================================================
         */
        UUID utilisateurId = null;

        if (subscription.getUtilisateur() != null) {

            utilisateurId = subscription
                    .getUtilisateur()
                    .getUtilisateurId();
        }


        /*
         * ========================================================
         * Extraction de l'ID de l'Abonnement
         * ========================================================
         */
        UUID abonnementId = null;

        if (subscription.getAbonnement() != null) {

            abonnementId = subscription
                    .getAbonnement()
                    .getAbonnementId();
        }


        /*
         * ========================================================
         * Extraction de l'ID de la Facturation
         * ========================================================
         */
        UUID facturationId = null;

        if (subscription.getFacturation() != null) {

            facturationId = subscription
                    .getFacturation()
                    .getFacturationId();
        }


        /*
         * ========================================================
         * Construction du Response DTO
         * ========================================================
         */
        return SubscriptionResponseDto.builder()

                // IDs des relations
                .utilisateurId(utilisateurId)
                .abonnementId(abonnementId)
                .facturationId(facturationId)

                // ID de la Subscription
                .subscriptionId(
                        subscription.getSubscriptionId()
                )

                // Informations principales
                .dateDebut(
                        subscription.getDateDebut()
                )
                .dateFin(
                        subscription.getDateFin()
                )

                .build();
    }


    /**
     * ============================================================
     * RESPONSE DTO -> ENTITY
     * ============================================================
     *
     * SubscriptionResponseDto
     *          ↓
     *       Subscription
     *
     * utilisateurId  → Utilisateur
     * abonnementId   → Abonnement
     * facturationId  → Facturation
     */
    @Override
    public Subscription responseToEntity(
            SubscriptionResponseDto subscriptionResponseDto) {

        if (subscriptionResponseDto == null) {
            return null;
        }


        /*
         * ========================================================
         * Récupération de l'Utilisateur
         * ========================================================
         */
        Utilisateur utilisateur = null;

        if (subscriptionResponseDto.getUtilisateurId() != null) {

            utilisateur = utilisateurRepository
                    .findById(
                            subscriptionResponseDto
                                    .getUtilisateurId()
                    )
                    .orElse(null);
        }


        /*
         * ========================================================
         * Récupération de l'Abonnement
         * ========================================================
         */
        Abonnement abonnement = null;

        if (subscriptionResponseDto.getAbonnementId() != null) {

            abonnement = abonnementRepository
                    .findById(
                            subscriptionResponseDto
                                    .getAbonnementId()
                    )
                    .orElse(null);
        }


        /*
         * ========================================================
         * Récupération de la Facturation
         * ========================================================
         */
        Facturation facturation = null;

        if (subscriptionResponseDto.getFacturationId() != null) {

            facturation = facturationRepository
                    .findById(
                            subscriptionResponseDto
                                    .getFacturationId()
                    )
                    .orElse(null);
        }


        /*
         * ========================================================
         * Construction de l'entité Subscription
         * ========================================================
         */
        return Subscription.builder()

                // ID de la Subscription
                .subscriptionId(
                        subscriptionResponseDto
                                .getSubscriptionId()
                )

                // Relations
                .utilisateur(utilisateur)
                .abonnement(abonnement)
                .facturation(facturation)

                // Informations principales
                .dateDebut(
                        subscriptionResponseDto
                                .getDateDebut()
                )
                .dateFin(
                        subscriptionResponseDto
                                .getDateFin()
                )

                .build();
    }
}