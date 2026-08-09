package com.commercial.Pont.Commercial.mappers.ImplementationMappers;

import com.commercial.Pont.Commercial.dtos.requestDtos.FacturationRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.FacturationResponseDto;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.FacturationMapperInterface;
import com.commercial.Pont.Commercial.models.Conversation;
import com.commercial.Pont.Commercial.models.Facturation;
import com.commercial.Pont.Commercial.models.Paiement;
import com.commercial.Pont.Commercial.models.Subscription;
import com.commercial.Pont.Commercial.repositories.ConversationRepository;
import com.commercial.Pont.Commercial.repositories.PaiementRepository;
import com.commercial.Pont.Commercial.repositories.SubscriptionRepository;
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


        /*
         * ========================================================
         * Récupération de la Conversation
         * ========================================================
         */
        Conversation conversation = null;

        if (facturationRequestDto.getConversationId() != null) {

            conversation = conversationRepository
                    .findById(
                            facturationRequestDto
                                    .getConversationId()
                    )
                    .orElse(null);
        }


        /*
         * ========================================================
         * Récupération des Paiements
         * ========================================================
         */
        List<Paiement> paiements =
                Collections.emptyList();

        if (facturationRequestDto.getPaiementIds() != null
                && !facturationRequestDto
                .getPaiementIds()
                .isEmpty()) {

            paiements = paiementRepository.findAllById(
                    facturationRequestDto.getPaiementIds()
            );
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
                .conversation(conversation)

                // Relation OneToMany
                .paiements(paiements)

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
         * Extraction de l'ID de la Conversation
         * ========================================================
         */
        UUID conversationId = null;

        if (facturation.getConversation() != null) {

            conversationId = facturation
                    .getConversation()
                    .getConversationId();
        }


        /*
         * ========================================================
         * Extraction des IDs des Paiements
         * ========================================================
         */
        List<UUID> paiementIds =
                Collections.emptyList();

        if (facturation.getPaiements() != null) {

            paiementIds = facturation
                    .getPaiements()
                    .stream()
                    .map(Paiement::getPaiementId)
                    .collect(Collectors.toList());
        }


        /*
         * ========================================================
         * Construction du Request DTO
         * ========================================================
         */
        return FacturationRequestDto.builder()

                // IDs des relations
                .subscriptionId(subscriptionId)
                .conversationId(conversationId)

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

                // IDs des paiements
                .paiementIds(paiementIds)

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
         * Extraction de l'ID de la Conversation
         * ========================================================
         */
        UUID conversationId = null;

        if (facturation.getConversation() != null) {

            conversationId = facturation
                    .getConversation()
                    .getConversationId();
        }


        /*
         * ========================================================
         * Extraction des IDs des Paiements
         * ========================================================
         */
        List<UUID> paiementIds =
                Collections.emptyList();

        if (facturation.getPaiements() != null) {

            paiementIds = facturation
                    .getPaiements()
                    .stream()
                    .map(Paiement::getPaiementId)
                    .collect(Collectors.toList());
        }


        /*
         * ========================================================
         * Construction du Response DTO
         * ========================================================
         */
        return FacturationResponseDto.builder()

                // IDs des relations
                .subscriptionId(subscriptionId)
                .conversationId(conversationId)

                // ID de la Facturation
                .facturationId(
                        facturation.getFacturationId()
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

                // IDs des paiements
                .paiementIds(paiementIds)

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


        /*
         * ========================================================
         * Récupération de la Conversation
         * ========================================================
         */
        Conversation conversation = null;

        if (facturationResponseDto.getConversationId() != null) {

            conversation = conversationRepository
                    .findById(
                            facturationResponseDto
                                    .getConversationId()
                    )
                    .orElse(null);
        }


        /*
         * ========================================================
         * Récupération des Paiements
         * ========================================================
         */
        List<Paiement> paiements =
                Collections.emptyList();

        if (facturationResponseDto.getPaiementIds() != null
                && !facturationResponseDto
                .getPaiementIds()
                .isEmpty()) {

            paiements = paiementRepository.findAllById(
                    facturationResponseDto.getPaiementIds()
            );
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
                .conversation(conversation)

                // Relation OneToMany
                .paiements(paiements)

                .build();
    }
}
