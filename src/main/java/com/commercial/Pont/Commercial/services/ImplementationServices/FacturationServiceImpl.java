package com.commercial.Pont.Commercial.services.ImplementationServices;

import com.commercial.Pont.Commercial.dtos.requestDtos.FacturationRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.FacturationResponseDto;
import com.commercial.Pont.Commercial.enums.FacturationStatus;
import com.commercial.Pont.Commercial.enums.FacturationType;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.FacturationMapperInterface;
import com.commercial.Pont.Commercial.models.Facturation;
import com.commercial.Pont.Commercial.models.Subscription;
import com.commercial.Pont.Commercial.models.Utilisateur;
import com.commercial.Pont.Commercial.repositories.FacturationRepository;
import com.commercial.Pont.Commercial.repositories.SubscriptionRepository;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.FacturationServiceInterface;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class FacturationServiceImpl
        implements FacturationServiceInterface {

    private final FacturationRepository facturationRepository;

    private final FacturationMapperInterface facturationMapper;

    private final SubscriptionRepository subscriptionRepository;



    // =========================
    // CREATE
    // =========================

    @Override
    public FacturationResponseDto create(
            FacturationRequestDto facturationRequestDto
    ) {

        Facturation facturation =
                facturationMapper.requestToEntity(
                        facturationRequestDto
                );


        // =========================
        // Recherche de la Subscription
        // =========================

        if (facturationRequestDto.getSubscriptionId() != null) {

            Subscription subscription =
                    subscriptionRepository.findById(
                                    facturationRequestDto
                                            .getSubscriptionId()
                            )
                            .orElseThrow(() ->
                                    new EntityNotFoundException(
                                            "Subscription non trouvée avec l'id : "
                                                    + facturationRequestDto
                                                    .getSubscriptionId()
                                    )
                            );

            facturation.setSubscription(
                    subscription
            );
        }



        // =========================
        // Gestion des dates
        // =========================

        LocalDateTime now =
                LocalDateTime.now();

        facturation.setCreatedAt(
                now
        );

        facturation.setUpdatedAt(
                now
        );


        Facturation savedFacturation =
                facturationRepository.save(
                        facturation
                );

        return facturationMapper.entityToResponse(
                savedFacturation
        );
    }


    // =========================
    // UPDATE
    // =========================

    @Override
    public FacturationResponseDto update(
            UUID facturationId,
            FacturationRequestDto facturationRequestDto
    ) {

        Facturation existingFacturation =
                facturationRepository.findById(
                                facturationId
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Facturation non trouvée avec l'id : "
                                                + facturationId
                                )
                        );


        // =========================
        // Mise à jour des informations
        // =========================

        existingFacturation.setNumeroFacture(
                facturationRequestDto.getNumeroFacture()
        );

        existingFacturation.setTva(
                facturationRequestDto.getTva()
        );

        existingFacturation.setStatut(
                facturationRequestDto.getStatut()
        );

        existingFacturation.setMethodePaiement(
                facturationRequestDto.getMethodePaiement()
        );

        existingFacturation.setPrixFacturation(
                facturationRequestDto.getPrixFacturation()
        );


        // =========================
        // Mise à jour de Subscription
        // =========================

        if (facturationRequestDto.getSubscriptionId() != null) {

            boolean subscriptionChanged =
                    existingFacturation.getSubscription() == null
                            ||
                            !facturationRequestDto
                                    .getSubscriptionId()
                                    .equals(
                                            existingFacturation
                                                    .getSubscription()
                                                    .getSubscriptionId()
                                    );

            if (subscriptionChanged) {

                Subscription subscription =
                        subscriptionRepository.findById(
                                        facturationRequestDto
                                                .getSubscriptionId()
                                )
                                .orElseThrow(() ->
                                        new EntityNotFoundException(
                                                "Subscription non trouvée avec l'id : "
                                                        + facturationRequestDto
                                                        .getSubscriptionId()
                                        )
                                );

                existingFacturation.setSubscription(
                        subscription
                );
            }
        }

        // =========================
        // Mise à jour automatique
        // =========================

        existingFacturation.setUpdatedAt(
                LocalDateTime.now()
        );


        Facturation updatedFacturation =
                facturationRepository.save(
                        existingFacturation
                );

        return facturationMapper.entityToResponse(
                updatedFacturation
        );
    }


    // =========================
    // GET BY ID
    // =========================

    @Override
    @Transactional(readOnly = true)
    public FacturationResponseDto getById(
            UUID facturationId
    ) {

        Facturation facturation =
                facturationRepository.findById(
                                facturationId
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Facturation non trouvée avec l'id : "
                                                + facturationId
                                )
                        );

        return facturationMapper.entityToResponse(
                facturation
        );
    }


    // =========================
    // GET ALL
    // =========================

    @Override
    @Transactional(readOnly = true)
    public List<FacturationResponseDto> getAll() {

        return facturationRepository.findAll()
                .stream()
                .map(
                        facturationMapper::entityToResponse
                )
                .toList();
    }


    // =========================
    // DELETE
    // =========================

    @Override
    public void delete(
            UUID facturationId
    ) {

        if (
                !facturationRepository
                        .existsById(
                                facturationId
                        )
        ) {

            throw new EntityNotFoundException(
                    "Facturation non trouvée avec l'id : "
                            + facturationId
            );
        }

        facturationRepository.deleteById(
                facturationId
        );
    }









    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void mettreFacturationLimiteAtteinte(
            Utilisateur utilisateur
    ) {

        Optional<Facturation> optionalFacturation =
                facturationRepository
                        .findFirstByUtilisateurUtilisateurIdAndTypeNotOrderByCreatedAtDesc(
                                utilisateur.getUtilisateurId(),
                                FacturationType.ABONNEMENT
                        );

        if (optionalFacturation.isPresent()) {

            Facturation facturation =
                    optionalFacturation.get();

            facturation.setStatut(
                    FacturationStatus.LIMITE_ATTEINTE
            );

            facturation.setUpdatedAt(
                    LocalDateTime.now()
            );

            facturationRepository.save(facturation);
        }
    }
}