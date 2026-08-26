package com.commercial.Pont.Commercial.mappers.ImplementationMappers;

import com.commercial.Pont.Commercial.dtos.requestDtos.AbonnementRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.AbonnementResponseDto;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.AbonnementMapperInterface;
import com.commercial.Pont.Commercial.models.Abonnement;
import com.commercial.Pont.Commercial.models.Subscription;
import com.commercial.Pont.Commercial.repositories.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class AbonnementMapperImpl implements AbonnementMapperInterface {

    private final SubscriptionRepository subscriptionRepository;


    @Override
    public Abonnement requestToEntity(
            AbonnementRequestDto abonnementRequestDto) {

        if (abonnementRequestDto == null) {
            return null;
        }
        List<Subscription> subscriptions = Collections.emptyList();

        if (abonnementRequestDto.getSubscriptionIds() != null
                && !abonnementRequestDto.getSubscriptionIds().isEmpty()) {

            subscriptions = subscriptionRepository.findAllById(
                    abonnementRequestDto.getSubscriptionIds()
            );
        }
        return Abonnement.builder()
                .nom(abonnementRequestDto.getNom())
                .typeAbonnement(abonnementRequestDto.getTypeAbonnement())
                .dureeEnMois(abonnementRequestDto.getDureeEnMois())
                .montant(abonnementRequestDto.getMontant())
                .devise(abonnementRequestDto.getDevise())
                .statut(abonnementRequestDto.getStatut())
                .createdAt(abonnementRequestDto.getCreatedAt())
                .updatedAt(abonnementRequestDto.getUpdatedAt())
                .subscriptions(subscriptions)
                .build();
    }



    @Override
    public AbonnementRequestDto entityToRequest(
            Abonnement abonnement) {
        if (abonnement == null) {
            return null;
        }
        List<UUID> subscriptionIds = Collections.emptyList();

        if (abonnement.getSubscriptions() != null) {

            subscriptionIds = abonnement.getSubscriptions()
                    .stream()
                    .map(Subscription::getSubscriptionId)
                    .collect(Collectors.toList());
        }
        return AbonnementRequestDto.builder()
                .nom(abonnement.getNom())
                .typeAbonnement(abonnement.getTypeAbonnement())
                .dureeEnMois(abonnement.getDureeEnMois())
                .montant(abonnement.getMontant())
                .devise(abonnement.getDevise())
                .statut(abonnement.getStatut())
                .createdAt(abonnement.getCreatedAt())
                .updatedAt(abonnement.getUpdatedAt())
                .subscriptionIds(subscriptionIds)
                .build();
    }



    @Override
    public AbonnementResponseDto entityToResponse(
            Abonnement abonnement) {

        if (abonnement == null) {
            return null;
        }
        List<UUID> subscriptionIds = Collections.emptyList();

        if (abonnement.getSubscriptions() != null) {

            subscriptionIds = abonnement.getSubscriptions()
                    .stream()
                    .map(Subscription::getSubscriptionId)
                    .collect(Collectors.toList());
        }
        return AbonnementResponseDto.builder()
                .abonnementId(abonnement.getAbonnementId())
                .nom(abonnement.getNom())
                .typeAbonnement(abonnement.getTypeAbonnement())
                .dureeEnMois(abonnement.getDureeEnMois())
                .montant(abonnement.getMontant())
                .devise(abonnement.getDevise())
                .statut(abonnement.getStatut())
                .createdAt(abonnement.getCreatedAt())
                .updatedAt(abonnement.getUpdatedAt())
                .subscriptionIds(subscriptionIds)
                .build();
    }



    @Override
    public Abonnement responseToEntity(
            AbonnementResponseDto abonnementResponseDto) {

        if (abonnementResponseDto == null) {
            return null;
        }
        List<Subscription> subscriptions = Collections.emptyList();

        if (abonnementResponseDto.getSubscriptionIds() != null
                && !abonnementResponseDto.getSubscriptionIds().isEmpty()) {

            subscriptions = subscriptionRepository.findAllById(
                    abonnementResponseDto.getSubscriptionIds()
            );
        }
        return Abonnement.builder()
                .abonnementId(abonnementResponseDto.getAbonnementId())
                .nom(abonnementResponseDto.getNom())
                .typeAbonnement(abonnementResponseDto.getTypeAbonnement())
                .dureeEnMois(abonnementResponseDto.getDureeEnMois())
                .montant(abonnementResponseDto.getMontant())
                .devise(abonnementResponseDto.getDevise())
                .statut(abonnementResponseDto.getStatut())
                .createdAt(abonnementResponseDto.getCreatedAt())
                .updatedAt(abonnementResponseDto.getUpdatedAt())
                .subscriptions(subscriptions)
                .build();
    }
}
