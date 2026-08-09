package com.commercial.Pont.Commercial.services.ImplementationServices;

import com.commercial.Pont.Commercial.dtos.requestDtos.SubscriptionRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.SubscriptionResponseDto;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.SubscriptionMapperInterface;
import com.commercial.Pont.Commercial.models.Abonnement;
import com.commercial.Pont.Commercial.models.Facturation;
import com.commercial.Pont.Commercial.models.Subscription;
import com.commercial.Pont.Commercial.models.Utilisateur;
import com.commercial.Pont.Commercial.repositories.AbonnementRepository;
import com.commercial.Pont.Commercial.repositories.FacturationRepository;
import com.commercial.Pont.Commercial.repositories.SubscriptionRepository;
import com.commercial.Pont.Commercial.repositories.UtilisateurRepository;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.SubscriptionServiceInterface;
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
public class SubscriptionServiceImpl
        implements SubscriptionServiceInterface {

    private final SubscriptionRepository subscriptionRepository;

    private final SubscriptionMapperInterface subscriptionMapper;

    private final UtilisateurRepository utilisateurRepository;

    private final AbonnementRepository abonnementRepository;

    private final FacturationRepository facturationRepository;


    // =========================
    // CREATE
    // =========================

    @Override
    public SubscriptionResponseDto create(
            SubscriptionRequestDto subscriptionRequestDto
    ) {

        Subscription subscription =
                subscriptionMapper.requestToEntity(
                        subscriptionRequestDto
                );


        // =========================
        // Recherche de l'utilisateur
        // =========================

        Utilisateur utilisateur =
                utilisateurRepository.findById(
                                subscriptionRequestDto
                                        .getUtilisateurId()
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Utilisateur non trouvé avec l'id : "
                                                + subscriptionRequestDto
                                                .getUtilisateurId()
                                )
                        );


        // =========================
        // Recherche de l'abonnement
        // =========================

        Abonnement abonnement =
                abonnementRepository.findById(
                                subscriptionRequestDto
                                        .getAbonnementId()
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Abonnement non trouvé avec l'id : "
                                                + subscriptionRequestDto
                                                .getAbonnementId()
                                )
                        );


        // =========================
        // Association
        // =========================

        subscription.setUtilisateur(
                utilisateur
        );

        subscription.setAbonnement(
                abonnement
        );


        // =========================
        // Date de début
        // =========================

        if (
                subscription.getDateDebut() == null
        ) {

            subscription.setDateDebut(
                    LocalDateTime.now()
            );
        }


        // =========================
        // Facturation optionnelle
        // =========================

        if (
                subscriptionRequestDto.getFacturationId() != null
        ) {

            Facturation facturation =
                    facturationRepository.findById(
                                    subscriptionRequestDto
                                            .getFacturationId()
                            )
                            .orElseThrow(() ->
                                    new EntityNotFoundException(
                                            "Facturation non trouvée avec l'id : "
                                                    + subscriptionRequestDto
                                                    .getFacturationId()
                                    )
                            );

            subscription.setFacturation(
                    facturation
            );
        }


        // =========================
        // Sauvegarde
        // =========================

        Subscription savedSubscription =
                subscriptionRepository.save(
                        subscription
                );

        return subscriptionMapper.entityToResponse(
                savedSubscription
        );
    }


    // =========================
    // UPDATE
    // =========================

    @Override
    public SubscriptionResponseDto update(
            UUID subscriptionId,
            SubscriptionRequestDto subscriptionRequestDto
    ) {

        Subscription existingSubscription =
                subscriptionRepository.findById(
                                subscriptionId
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Subscription non trouvée avec l'id : "
                                                + subscriptionId
                                )
                        );


        // =========================
        // Mise à jour des dates
        // =========================

        if (
                subscriptionRequestDto.getDateDebut() != null
        ) {

            existingSubscription.setDateDebut(
                    subscriptionRequestDto
                            .getDateDebut()
            );
        }

        existingSubscription.setDateFin(
                subscriptionRequestDto
                        .getDateFin()
        );


        // =========================
        // Mise à jour de l'utilisateur
        // =========================

        if (
                subscriptionRequestDto.getUtilisateurId() != null
                        &&
                        (
                                existingSubscription.getUtilisateur() == null
                                        ||
                                        !subscriptionRequestDto
                                                .getUtilisateurId()
                                                .equals(
                                                        existingSubscription
                                                                .getUtilisateur()
                                                                .getUtilisateurId()
                                                )
                        )
        ) {

            Utilisateur utilisateur =
                    utilisateurRepository.findById(
                                    subscriptionRequestDto
                                            .getUtilisateurId()
                            )
                            .orElseThrow(() ->
                                    new EntityNotFoundException(
                                            "Utilisateur non trouvé avec l'id : "
                                                    + subscriptionRequestDto
                                                    .getUtilisateurId()
                                    )
                            );

            existingSubscription.setUtilisateur(
                    utilisateur
            );
        }


        // =========================
        // Mise à jour de l'abonnement
        // =========================

        if (
                subscriptionRequestDto.getAbonnementId() != null
                        &&
                        (
                                existingSubscription.getAbonnement() == null
                                        ||
                                        !subscriptionRequestDto
                                                .getAbonnementId()
                                                .equals(
                                                        existingSubscription
                                                                .getAbonnement()
                                                                .getAbonnementId()
                                                )
                        )
        ) {

            Abonnement abonnement =
                    abonnementRepository.findById(
                                    subscriptionRequestDto
                                            .getAbonnementId()
                            )
                            .orElseThrow(() ->
                                    new EntityNotFoundException(
                                            "Abonnement non trouvé avec l'id : "
                                                    + subscriptionRequestDto
                                                    .getAbonnementId()
                                    )
                            );

            existingSubscription.setAbonnement(
                    abonnement
            );
        }


        // =========================
        // Mise à jour de la facturation
        // =========================

        if (
                subscriptionRequestDto.getFacturationId() != null
                        &&
                        (
                                existingSubscription.getFacturation() == null
                                        ||
                                        !subscriptionRequestDto
                                                .getFacturationId()
                                                .equals(
                                                        existingSubscription
                                                                .getFacturation()
                                                                .getFacturationId()
                                                )
                        )
        ) {

            Facturation facturation =
                    facturationRepository.findById(
                                    subscriptionRequestDto
                                            .getFacturationId()
                            )
                            .orElseThrow(() ->
                                    new EntityNotFoundException(
                                            "Facturation non trouvée avec l'id : "
                                                    + subscriptionRequestDto
                                                    .getFacturationId()
                                    )
                            );

            existingSubscription.setFacturation(
                    facturation
            );
        }


        // =========================
        // Sauvegarde
        // =========================

        Subscription updatedSubscription =
                subscriptionRepository.save(
                        existingSubscription
                );

        return subscriptionMapper.entityToResponse(
                updatedSubscription
        );
    }


    // =========================
    // GET BY ID
    // =========================

    @Override
    @Transactional(readOnly = true)
    public SubscriptionResponseDto getById(
            UUID subscriptionId
    ) {

        Subscription subscription =
                subscriptionRepository.findById(
                                subscriptionId
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Subscription non trouvée avec l'id : "
                                                + subscriptionId
                                )
                        );

        return subscriptionMapper.entityToResponse(
                subscription
        );
    }


    // =========================
    // GET ALL
    // =========================

    @Override
    @Transactional(readOnly = true)
    public List<SubscriptionResponseDto> getAll() {

        return subscriptionRepository.findAll()
                .stream()
                .map(
                        subscriptionMapper::entityToResponse
                )
                .toList();
    }


    // =========================
    // DELETE
    // =========================

    @Override
    public void delete(
            UUID subscriptionId
    ) {

        if (
                !subscriptionRepository
                        .existsById(
                                subscriptionId
                        )
        ) {

            throw new EntityNotFoundException(
                    "Subscription non trouvée avec l'id : "
                            + subscriptionId
            );
        }

        subscriptionRepository.deleteById(
                subscriptionId
        );
    }
}