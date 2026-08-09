package com.commercial.Pont.Commercial.mappers.ImplementationMappers;

import com.commercial.Pont.Commercial.dtos.requestDtos.PaiementRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.PaiementResponseDto;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.PaiementMapperInterface;
import com.commercial.Pont.Commercial.models.Facturation;
import com.commercial.Pont.Commercial.models.Paiement;
import com.commercial.Pont.Commercial.repositories.FacturationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class PaiementMapperImpl
        implements PaiementMapperInterface {

    private final FacturationRepository facturationRepository;


    /**
     * ============================================================
     * REQUEST DTO -> ENTITY
     * ============================================================
     *
     * PaiementRequestDto
     *          ↓
     *       Paiement
     *
     * facturationId → Facturation
     */
    @Override
    public Paiement requestToEntity(
            PaiementRequestDto paiementRequestDto) {

        if (paiementRequestDto == null) {
            return null;
        }


        /*
         * ========================================================
         * Récupération de la Facturation
         * ========================================================
         */
        Facturation facturation = null;

        if (paiementRequestDto.getFacturationId() != null) {

            facturation = facturationRepository
                    .findById(
                            paiementRequestDto
                                    .getFacturationId()
                    )
                    .orElse(null);
        }


        /*
         * ========================================================
         * Construction de l'entité Paiement
         * ========================================================
         */
        return Paiement.builder()

                // Informations principales
                .montant(
                        paiementRequestDto.getMontant()
                )
                .devise(
                        paiementRequestDto.getDevise()
                )
                .stripePaymentIntentId(
                        paiementRequestDto
                                .getStripePaymentIntentId()
                )
                .stripeChargeId(
                        paiementRequestDto
                                .getStripeChargeId()
                )
                .statutPaiement(
                        paiementRequestDto
                                .getStatutPaiement()
                )
                .datePaiement(
                        paiementRequestDto.getDatePaiement()
                )
                .messageErreur(
                        paiementRequestDto.getMessageErreur()
                )
                .createdAt(
                        paiementRequestDto.getCreatedAt()
                )
                .updatedAt(
                        paiementRequestDto.getUpdatedAt()
                )

                // Relation avec Facturation
                .facturation(facturation)

                .build();
    }


    /**
     * ============================================================
     * ENTITY -> REQUEST DTO
     * ============================================================
     *
     * Paiement
     *    ↓
     * PaiementRequestDto
     *
     * facturation → facturationId
     */
    @Override
    public PaiementRequestDto entityToRequest(
            Paiement paiement) {

        if (paiement == null) {
            return null;
        }


        /*
         * ========================================================
         * Extraction de l'ID de la Facturation
         * ========================================================
         */
        UUID facturationId = null;

        if (paiement.getFacturation() != null) {

            facturationId = paiement
                    .getFacturation()
                    .getFacturationId();
        }


        /*
         * ========================================================
         * Construction du Request DTO
         * ========================================================
         */
        return PaiementRequestDto.builder()

                // ID de la relation
                .facturationId(facturationId)

                // Informations principales
                .montant(
                        paiement.getMontant()
                )
                .devise(
                        paiement.getDevise()
                )
                .stripePaymentIntentId(
                        paiement.getStripePaymentIntentId()
                )
                .stripeChargeId(
                        paiement.getStripeChargeId()
                )
                .statutPaiement(
                        paiement.getStatutPaiement()
                )
                .datePaiement(
                        paiement.getDatePaiement()
                )
                .messageErreur(
                        paiement.getMessageErreur()
                )
                .createdAt(
                        paiement.getCreatedAt()
                )
                .updatedAt(
                        paiement.getUpdatedAt()
                )

                .build();
    }


    /**
     * ============================================================
     * ENTITY -> RESPONSE DTO
     * ============================================================
     *
     * Paiement
     *    ↓
     * PaiementResponseDto
     *
     * facturation → facturationId
     */
    @Override
    public PaiementResponseDto entityToResponse(
            Paiement paiement) {

        if (paiement == null) {
            return null;
        }


        /*
         * ========================================================
         * Extraction de l'ID de la Facturation
         * ========================================================
         */
        UUID facturationId = null;

        if (paiement.getFacturation() != null) {

            facturationId = paiement
                    .getFacturation()
                    .getFacturationId();
        }


        /*
         * ========================================================
         * Construction du Response DTO
         * ========================================================
         */
        return PaiementResponseDto.builder()

                // ID de la Facturation
                .facturationId(facturationId)

                // ID du Paiement
                .paiementId(
                        paiement.getPaiementId()
                )

                // Informations principales
                .montant(
                        paiement.getMontant()
                )
                .devise(
                        paiement.getDevise()
                )
                .stripePaymentIntentId(
                        paiement.getStripePaymentIntentId()
                )
                .stripeChargeId(
                        paiement.getStripeChargeId()
                )
                .statutPaiement(
                        paiement.getStatutPaiement()
                )
                .datePaiement(
                        paiement.getDatePaiement()
                )
                .messageErreur(
                        paiement.getMessageErreur()
                )
                .createdAt(
                        paiement.getCreatedAt()
                )
                .updatedAt(
                        paiement.getUpdatedAt()
                )

                .build();
    }


    /**
     * ============================================================
     * RESPONSE DTO -> ENTITY
     * ============================================================
     *
     * PaiementResponseDto
     *          ↓
     *       Paiement
     *
     * facturationId → Facturation
     */
    @Override
    public Paiement responseToEntity(
            PaiementResponseDto paiementResponseDto) {

        if (paiementResponseDto == null) {
            return null;
        }


        /*
         * ========================================================
         * Récupération de la Facturation
         * ========================================================
         */
        Facturation facturation = null;

        if (paiementResponseDto.getFacturationId() != null) {

            facturation = facturationRepository
                    .findById(
                            paiementResponseDto
                                    .getFacturationId()
                    )
                    .orElse(null);
        }


        /*
         * ========================================================
         * Construction de l'entité Paiement
         * ========================================================
         */
        return Paiement.builder()

                // ID du Paiement
                .paiementId(
                        paiementResponseDto
                                .getPaiementId()
                )

                // Informations principales
                .montant(
                        paiementResponseDto.getMontant()
                )
                .devise(
                        paiementResponseDto.getDevise()
                )
                .stripePaymentIntentId(
                        paiementResponseDto
                                .getStripePaymentIntentId()
                )
                .stripeChargeId(
                        paiementResponseDto
                                .getStripeChargeId()
                )
                .statutPaiement(
                        paiementResponseDto
                                .getStatutPaiement()
                )
                .datePaiement(
                        paiementResponseDto.getDatePaiement()
                )
                .messageErreur(
                        paiementResponseDto.getMessageErreur()
                )
                .createdAt(
                        paiementResponseDto.getCreatedAt()
                )
                .updatedAt(
                        paiementResponseDto.getUpdatedAt()
                )

                // Relation avec Facturation
                .facturation(facturation)

                .build();
    }
}