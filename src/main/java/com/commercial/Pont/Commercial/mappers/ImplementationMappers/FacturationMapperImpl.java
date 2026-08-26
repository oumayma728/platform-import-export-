package com.commercial.Pont.Commercial.mappers.ImplementationMappers;

import com.commercial.Pont.Commercial.dtos.requestDtos.FacturationRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.FacturationResponseDto;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.FacturationMapperInterface;
import com.commercial.Pont.Commercial.models.*;
import com.commercial.Pont.Commercial.repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class FacturationMapperImpl
        implements FacturationMapperInterface {

    private final SubscriptionRepository subscriptionRepository;

    private final ConversationRepository conversationRepository;

    private final PaiementRepository paiementRepository;

    private final UtilisateurRepository utilisateurRepository;

    private final PaymentUsageRepository paymentUsageRepository;




    /**
     * ============================================================
     * REQUEST DTO -> ENTITY
     * ============================================================
     *
     * FacturationRequestDto
     *          ↓
     * Facturation
     *
     * subscriptionId → Subscription
     * conversationId → Conversation
     * paiementIds    → List<Paiement>
     */
    @Override
    public Facturation requestToEntity(
            FacturationRequestDto facturationRequestDto) {

        if (facturationRequestDto == null) {
            return null;
        }


        /*
         * ========================================================
         * Récupération de la Subscription
         * ========================================================
         */
        Subscription subscription = null;

        if (facturationRequestDto.getSubscriptionId() != null) {

            subscription = subscriptionRepository
                    .findById(
                            facturationRequestDto
                                    .getSubscriptionId()
                    )
                    .orElse(null);
        }



        Utilisateur utilisateur = null;

        if (facturationRequestDto.getUtilisateurId() != null) {

            utilisateur = utilisateurRepository
                    .findById(
                            facturationRequestDto
                                    .getUtilisateurId()
                    )
                    .orElse(null);
        }


        PaymentUsage paymentUsage = null;

        if (facturationRequestDto.getPaymentUsageId() != null) {

            paymentUsage = paymentUsageRepository
                    .findById(
                            facturationRequestDto
                                    .getPaymentUsageId()
                    )
                    .orElse(null);
        }

        /*
         * ========================================================
         * Construction de l'entité Facturation
         * ========================================================
         */
        return Facturation.builder()

                // Informations principales
                .numeroFacture(
                        facturationRequestDto.getNumeroFacture()
                )
                .tva(
                        facturationRequestDto.getTva()
                )
                .paymentUsage(paymentUsage)
                .utilisateur(utilisateur)
                .statut(
                        facturationRequestDto.getStatut()
                )
                .methodePaiement(
                        facturationRequestDto.getMethodePaiement()
                )
                .prixFacturation(
                        facturationRequestDto.getPrixFacturation()
                )
                .createdAt(
                        facturationRequestDto.getCreatedAt()
                )
                .updatedAt(
                        facturationRequestDto.getUpdatedAt()
                )

                // Relations OneToOne
                .subscription(subscription)

                .build();
    }


    /**
     * ============================================================
     * ENTITY -> REQUEST DTO
     * ============================================================
     *
     * Facturation
     *      ↓
     * FacturationRequestDto
     *
     * subscription    → subscriptionId
     * conversation    → conversationId
     * paiements       → paiementIds
     */
    @Override
    public FacturationRequestDto entityToRequest(
            Facturation facturation) {

        if (facturation == null) {
            return null;
        }


        /*
         * ========================================================
         * Extraction de l'ID de la Subscription
         * ========================================================
         */
        UUID subscriptionId = null;

        if (facturation.getSubscription() != null) {

            subscriptionId = facturation
                    .getSubscription()
                    .getSubscriptionId();
        }




        /*
         * ========================================================
         * Construction du Request DTO
         * ========================================================
         */
        return FacturationRequestDto.builder()

                // IDs des relations
                .subscriptionId(subscriptionId)

                // Informations principales
                .numeroFacture(
                        facturation.getNumeroFacture()
                )
                .paymentUsageId(facturation.getPaymentUsage().getPaymentUsageId())
                .utilisateurId(
                        facturation.getUtilisateur().getUtilisateurId()
                )
                .tva(
                        facturation.getTva()
                )
                .statut(
                        facturation.getStatut()
                )
                .methodePaiement(
                        facturation.getMethodePaiement()
                )
                .prixFacturation(
                        facturation.getPrixFacturation()
                )
                .createdAt(
                        facturation.getCreatedAt()
                )
                .updatedAt(
                        facturation.getUpdatedAt()
                )

                .build();
    }


    /**
     * ============================================================
     * ENTITY -> RESPONSE DTO
     * ============================================================
     *
     * Facturation
     *      ↓
     * FacturationResponseDto
     *
     * subscription    → subscriptionId
     * conversation    → conversationId
     * paiements       → paiementIds
     */
    @Override
    public FacturationResponseDto entityToResponse(
            Facturation facturation) {

        if (facturation == null) {
            return null;
        }


        /*
         * ========================================================
         * Extraction de l'ID de la Subscription
         * ========================================================
         */
        UUID subscriptionId = null;

        if (facturation.getSubscription() != null) {

            subscriptionId = facturation
                    .getSubscription()
                    .getSubscriptionId();
        }




        /*
         * ========================================================
         * Construction du Response DTO
         * ========================================================
         */
        return FacturationResponseDto.builder()

                // IDs des relations
                .subscriptionId(subscriptionId)

                // ID de la Facturation
                .facturationId(
                        facturation.getFacturationId()
                )
                .utilisateurId(
                        facturation.getUtilisateur().getUtilisateurId()
                )
                .paymentUsageId(
                        facturation.getPaymentUsage().getPaymentUsageId()
                )

                // Informations principales
                .numeroFacture(
                        facturation.getNumeroFacture()
                )
                .tva(
                        facturation.getTva()
                )
                .statut(
                        facturation.getStatut()
                )
                .methodePaiement(
                        facturation.getMethodePaiement()
                )
                .prixFacturation(
                        facturation.getPrixFacturation()
                )
                .createdAt(
                        facturation.getCreatedAt()
                )
                .updatedAt(
                        facturation.getUpdatedAt()
                )

                .build();
    }


    /**
     * ============================================================
     * RESPONSE DTO -> ENTITY
     * ============================================================
     *
     * FacturationResponseDto
     *          ↓
     * Facturation
     *
     * subscriptionId → Subscription
     * conversationId → Conversation
     * paiementIds    → List<Paiement>
     */
    @Override
    public Facturation responseToEntity(
            FacturationResponseDto facturationResponseDto) {

        if (facturationResponseDto == null) {
            return null;
        }


        /*
         * ========================================================
         * Récupération de la Subscription
         * ========================================================
         */
        Subscription subscription = null;

        if (facturationResponseDto.getSubscriptionId() != null) {

            subscription = subscriptionRepository
                    .findById(
                            facturationResponseDto
                                    .getSubscriptionId()
                    )
                    .orElse(null);
        }


        Utilisateur utilisateur = null;

        if (facturationResponseDto.getUtilisateurId() != null) {

            utilisateur = utilisateurRepository
                    .findById(
                            facturationResponseDto
                                    .getUtilisateurId()
                    )
                    .orElse(null);
        }


        PaymentUsage paymentUsage = null;

        if (facturationResponseDto.getPaymentUsageId() != null) {

            paymentUsage = paymentUsageRepository
                    .findById(
                            facturationResponseDto
                                    .getPaymentUsageId()
                    )
                    .orElse(null);
        }




        /*
         * ========================================================
         * Construction de l'entité Facturation
         * ========================================================
         */
        return Facturation.builder()

                // ID de la Facturation
                .facturationId(
                        facturationResponseDto
                                .getFacturationId()
                )

                // Informations principales
                .numeroFacture(
                        facturationResponseDto
                                .getNumeroFacture()
                )
                .utilisateur(
                        utilisateur
                )
                .paymentUsage(
                        paymentUsage
                )
                .tva(
                        facturationResponseDto.getTva()
                )
                .statut(
                        facturationResponseDto.getStatut()
                )
                .methodePaiement(
                        facturationResponseDto
                                .getMethodePaiement()
                )
                .prixFacturation(
                        facturationResponseDto
                                .getPrixFacturation()
                )
                .createdAt(
                        facturationResponseDto.getCreatedAt()
                )
                .updatedAt(
                        facturationResponseDto.getUpdatedAt()
                )

                // Relations OneToOne
                .subscription(subscription)

                .build();
    }
}
