package com.commercial.Pont.Commercial.services.ImplementationServices;

import com.commercial.Pont.Commercial.dtos.requestDtos.PaiementRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.PaiementResponseDto;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.PaiementMapperInterface;
import com.commercial.Pont.Commercial.models.Facturation;
import com.commercial.Pont.Commercial.models.Paiement;
import com.commercial.Pont.Commercial.repositories.FacturationRepository;
import com.commercial.Pont.Commercial.repositories.PaiementRepository;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.PaiementServiceInterface;
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
public class PaiementServiceImpl implements PaiementServiceInterface {

    private final PaiementRepository paiementRepository;

    private final PaiementMapperInterface paiementMapper;

    private final FacturationRepository facturationRepository;


    // =========================
    // CREATE
    // =========================

    @Override
    public PaiementResponseDto create(
            PaiementRequestDto paiementRequestDto
    ) {

        Paiement paiement =
                paiementMapper.requestToEntity(
                        paiementRequestDto
                );


        // =========================
        // Recherche de la facturation
        // =========================

        Facturation facturation =
                facturationRepository.findById(
                                paiementRequestDto
                                        .getFacturationId()
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Facturation non trouvée avec l'id : "
                                                + paiementRequestDto
                                                .getFacturationId()
                                )
                        );


        // =========================
        // Association
        // =========================

        paiement.setFacturation(
                facturation
        );


        // =========================
        // Gestion des dates
        // =========================

        LocalDateTime now =
                LocalDateTime.now();

        paiement.setCreatedAt(
                now
        );

        paiement.setUpdatedAt(
                now
        );


        // =========================
        // Date de paiement
        // =========================

        if (
                paiement.getDatePaiement() == null
        ) {

            paiement.setDatePaiement(
                    now
            );
        }


        // =========================
        // Sauvegarde
        // =========================

        Paiement savedPaiement =
                paiementRepository.save(
                        paiement
                );

        return paiementMapper.entityToResponse(
                savedPaiement
        );
    }


    // =========================
    // UPDATE
    // =========================

    @Override
    public PaiementResponseDto update(
            UUID paiementId,
            PaiementRequestDto paiementRequestDto
    ) {

        Paiement existingPaiement =
                paiementRepository.findById(
                                paiementId
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Paiement non trouvé avec l'id : "
                                                + paiementId
                                )
                        );


        // =========================
        // Mise à jour des informations
        // =========================

        existingPaiement.setMontant(
                paiementRequestDto.getMontant()
        );

        existingPaiement.setDevise(
                paiementRequestDto.getDevise()
        );

        existingPaiement.setStripePaymentIntentId(
                paiementRequestDto
                        .getStripePaymentIntentId()
        );

        existingPaiement.setStripeChargeId(
                paiementRequestDto
                        .getStripeChargeId()
        );

        existingPaiement.setStatutPaiement(
                paiementRequestDto
                        .getStatutPaiement()
        );

        existingPaiement.setDatePaiement(
                paiementRequestDto
                        .getDatePaiement()
        );

        existingPaiement.setMessageErreur(
                paiementRequestDto
                        .getMessageErreur()
        );


        // =========================
        // Mise à jour de la facturation
        // =========================

        if (
                paiementRequestDto.getFacturationId() != null
                        &&
                        (
                                existingPaiement.getFacturation() == null
                                        ||
                                        !paiementRequestDto
                                                .getFacturationId()
                                                .equals(
                                                        existingPaiement
                                                                .getFacturation()
                                                                .getFacturationId()
                                                )
                        )
        ) {

            Facturation facturation =
                    facturationRepository.findById(
                                    paiementRequestDto
                                            .getFacturationId()
                            )
                            .orElseThrow(() ->
                                    new EntityNotFoundException(
                                            "Facturation non trouvée avec l'id : "
                                                    + paiementRequestDto
                                                    .getFacturationId()
                                    )
                            );

            existingPaiement.setFacturation(
                    facturation
            );
        }


        // =========================
        // Mise à jour automatique
        // =========================

        existingPaiement.setUpdatedAt(
                LocalDateTime.now()
        );


        // =========================
        // Sauvegarde
        // =========================

        Paiement updatedPaiement =
                paiementRepository.save(
                        existingPaiement
                );

        return paiementMapper.entityToResponse(
                updatedPaiement
        );
    }


    // =========================
    // GET BY ID
    // =========================

    @Override
    @Transactional(readOnly = true)
    public PaiementResponseDto getById(
            UUID paiementId
    ) {

        Paiement paiement =
                paiementRepository.findById(
                                paiementId
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Paiement non trouvé avec l'id : "
                                                + paiementId
                                )
                        );

        return paiementMapper.entityToResponse(
                paiement
        );
    }


    // =========================
    // GET ALL
    // =========================

    @Override
    @Transactional(readOnly = true)
    public List<PaiementResponseDto> getAll() {

        return paiementRepository.findAll()
                .stream()
                .map(
                        paiementMapper::entityToResponse
                )
                .toList();
    }


    // =========================
    // DELETE
    // =========================

    @Override
    public void delete(
            UUID paiementId
    ) {

        if (
                !paiementRepository
                        .existsById(
                                paiementId
                        )
        ) {

            throw new EntityNotFoundException(
                    "Paiement non trouvé avec l'id : "
                            + paiementId
            );
        }

        paiementRepository.deleteById(
                paiementId
        );
    }
}