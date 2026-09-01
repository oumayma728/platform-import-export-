package com.commercial.Pont.Commercial.services.ImplementationServices;

import com.commercial.Pont.Commercial.config.StripeMoneyUtils;
import com.commercial.Pont.Commercial.dtos.requestDtos.SubscriptionRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.CreateSubscriptionResponseDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.SubscriptionResponseDto;
import com.commercial.Pont.Commercial.enums.AbonnementStatus;
import com.commercial.Pont.Commercial.enums.FacturationStatus;
import com.commercial.Pont.Commercial.enums.FacturationType;
import com.commercial.Pont.Commercial.enums.PaiementStatus;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.SubscriptionMapperInterface;
import com.commercial.Pont.Commercial.models.*;
import com.commercial.Pont.Commercial.repositories.*;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.NotificationServiceInterface;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.SubscriptionServiceInterface;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
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

    private final PaiementRepository paiementRepository;

    private final NotificationServiceInterface notificationService;


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




    private boolean estUtilisateurAbonne(Utilisateur utilisateur) {

        return subscriptionRepository
                .findFirstByUtilisateurAndDateFinAfterOrderByDateFinDesc(
                        utilisateur,
                        LocalDateTime.now()
                )
                .isPresent();
    }





    private void verifierLimiteMessages(Utilisateur utilisateur) {

        boolean abonne = estUtilisateurAbonne(utilisateur);

        if (abonne) {
            return;
        }

        Integer utilise = utilisateur.getNombreChatsUtilises();
        Integer maximum = utilisateur.getMaxMessagesPossible();

        if (utilise == null) {
            utilise = 0;
        }

        if (maximum == null) {
            maximum = 50;
        }

        if (utilise >= maximum) {
            throw new IllegalStateException(
                    "Vous avez atteint votre limite de messages."
            );
        }
    }











    private void incrementerNombreChats(
            Utilisateur utilisateur,
            boolean abonne
    ) {

        Integer nombreActuel =
                utilisateur.getNombreChatsUtilises();

        if (nombreActuel == null) {
            nombreActuel = 0;
        }

        utilisateur.setNombreChatsUtilises(
                nombreActuel + 1
        );

        // =====================================
        // ABONNÉ
        // =====================================

        if (abonne) {

            Integer maximum =
                    utilisateur.getMaxMessagesPossible();

            if (maximum == null) {
                maximum = 0;
            }

            utilisateur.setMaxMessagesPossible(
                    maximum + 1
            );
        }
    }



    @Override
    @Transactional
    public CreateSubscriptionResponseDto creerPaiementSubscription(
            UUID abonnementId,
            Authentication authentication
    ) {

        // =====================================================
        // 1. Récupérer l'utilisateur connecté
        // =====================================================

        String email = authentication.getName();

        Utilisateur utilisateur =
                utilisateurRepository
                        .findByEmail(email)
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Utilisateur non trouvé."
                                )
                        );


        // =====================================================
        // 2. Récupérer l'abonnement
        // =====================================================

        Abonnement abonnement =
                abonnementRepository
                        .findById(abonnementId)
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Abonnement non trouvé avec l'id : "
                                                + abonnementId
                                )
                        );


        // =====================================================
        // 3. Vérifier que l'abonnement est ACTIVE
        // =====================================================

        if (abonnement.getStatut()
                != AbonnementStatus.ACTIVE) {

            throw new IllegalStateException(
                    "Cet abonnement n'est pas disponible."
            );
        }


        // =====================================================
        // 4. Vérifier que la durée est correcte
        // =====================================================

        if (abonnement.getDureeEnMois() == null
                || abonnement.getDureeEnMois() <= 0) {

            throw new IllegalStateException(
                    "La durée de l'abonnement est invalide."
            );
        }





        // =====================================================
        // 6. Vérifier que l'utilisateur n'a pas déjà
        //    un abonnement actif
        // =====================================================

        Optional<Subscription> subscriptionActive =
                subscriptionRepository
                        .findFirstByUtilisateurAndDateFinAfterOrderByDateFinDesc(
                                utilisateur,
                                LocalDateTime.now()
                        );

        if (subscriptionActive.isPresent()) {

            throw new IllegalStateException(
                    "Vous avez déjà un abonnement actif."
            );
        }


        // =====================================================
        // 7. Créer le paiement local
        // =====================================================

        LocalDateTime now =
                LocalDateTime.now();

        Paiement paiement =
                Paiement.builder()
                        .montant(
                                abonnement.getMontant()
                        )
                        .devise(abonnement.getDevise())
                        .statutPaiement(
                                PaiementStatus.EN_ATTENTE
                        )
                        .createdAt(now)
                        .updatedAt(now)
                        .build();


        paiement =
                paiementRepository.save(
                        paiement
                );


        // =====================================================
        // 8. Conversion devise
        // =====================================================

        long montantStripe =
                StripeMoneyUtils.toStripeAmount(
                        abonnement.getMontant(),
                        abonnement.getDevise()
                );

        // =====================================================
        // 9. Créer PaymentIntent Stripe
        // =====================================================

        PaymentIntentCreateParams params =
                PaymentIntentCreateParams
                        .builder()
                        .setAmount(montantStripe)
                        .setCurrency(abonnement.getDevise().toLowerCase())

                        .setAutomaticPaymentMethods(
                                PaymentIntentCreateParams
                                        .AutomaticPaymentMethods
                                        .builder()
                                        .setEnabled(true)
                                        .setAllowRedirects(
                                                PaymentIntentCreateParams
                                                        .AutomaticPaymentMethods
                                                        .AllowRedirects
                                                        .NEVER
                                        )
                                        .build()
                        )

                        .putMetadata(
                                "paiementId",
                                paiement.getPaiementId().toString()
                        )
                        .putMetadata(
                                "type",
                                "SUBSCRIPTION"
                        )
                        .putMetadata(
                                "utilisateurId",
                                utilisateur
                                        .getUtilisateurId()
                                        .toString()
                        )

                        .putMetadata(
                                "abonnementId",
                                abonnement
                                        .getAbonnementId()
                                        .toString()
                        )

                        .build();


        try {

            PaymentIntent paymentIntent =
                    PaymentIntent.create(
                            params
                    );


            // =================================================
            // 10. Sauvegarder ID PaymentIntent
            // =================================================

            paiement.setStripePaymentIntentId(
                    paymentIntent.getId()
            );

            paiement.setUpdatedAt(
                    LocalDateTime.now()
            );

            paiementRepository.save(
                    paiement
            );


            // =================================================
            // 11. Retourner au frontend
            // =================================================

            return CreateSubscriptionResponseDto
                    .builder()
                    .paiementId(
                            paiement.getPaiementId()
                    )
                    .abonnementId(
                            abonnement.getAbonnementId()
                    )
                    .paymentIntentId(
                            paymentIntent.getId()
                    )
                    .clientSecret(
                            paymentIntent.getClientSecret()
                    )
                    .montant(
                            montantStripe
                    )
                    .devise("MAD")
                    .statut(
                            paymentIntent.getStatus()
                    )
                    .build();

        } catch (Exception e) {

            // =================================================
            // Stripe a rencontré une erreur
            // =================================================

            paiement.setStatutPaiement(
                    PaiementStatus.ECHOUE
            );

            paiement.setMessageErreur(
                    e.getMessage()
            );

            paiement.setUpdatedAt(
                    LocalDateTime.now()
            );

            paiementRepository.save(
                    paiement
            );

            throw new IllegalStateException(
                    "Impossible de créer le paiement Stripe.",
                    e
            );
        }
    }













    @Override
    @Transactional
    public void traiterPaiementSubscriptionReussi(
            String paymentIntentId
    ) {

        // =====================================================
        // 1. Récupérer le paiement local
        // =====================================================

        Paiement paiement =
                paiementRepository
                        .findByStripePaymentIntentId(
                                paymentIntentId
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Paiement non trouvé pour le PaymentIntent : "
                                                + paymentIntentId
                                )
                        );


        // =====================================================
        // 2. Éviter de traiter deux fois
        // =====================================================

        if (paiement.getStatutPaiement()
                == PaiementStatus.REUSSI) {

            return;
        }


        // =====================================================
        // 3. Récupérer PaymentIntent depuis Stripe
        // =====================================================

        PaymentIntent paymentIntent;

        try {

            paymentIntent =
                    PaymentIntent.retrieve(
                            paymentIntentId
                    );

        } catch (Exception e) {

            throw new IllegalStateException(
                    "Impossible de récupérer le PaymentIntent Stripe.",
                    e
            );
        }


        // =====================================================
        // 4. Vérifier réellement le paiement
        // =====================================================

        if (!"succeeded".equals(
                paymentIntent.getStatus()
        )) {

            throw new IllegalStateException(
                    "Le paiement Stripe n'est pas réussi."
            );
        }


        // =====================================================
        // 5. Récupérer metadata
        // =====================================================

        String utilisateurIdString =
                paymentIntent
                        .getMetadata()
                        .get("utilisateurId");

        String abonnementIdString =
                paymentIntent
                        .getMetadata()
                        .get("abonnementId");


        if (utilisateurIdString == null
                || abonnementIdString == null) {

            throw new IllegalStateException(
                    "Metadata Stripe manquantes."
            );
        }


        UUID utilisateurId =
                UUID.fromString(
                        utilisateurIdString
                );

        UUID abonnementId =
                UUID.fromString(
                        abonnementIdString
                );


        // =====================================================
        // 6. Récupérer utilisateur
        // =====================================================

        Utilisateur utilisateur =
                utilisateurRepository
                        .findById(
                                utilisateurId
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Utilisateur non trouvé."
                                )
                        );


        // =====================================================
        // 7. Récupérer abonnement
        // =====================================================

        Abonnement abonnement =
                abonnementRepository
                        .findById(
                                abonnementId
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Abonnement non trouvé."
                                )
                        );


        // =====================================================
        // 8. Vérifier que l'abonnement est toujours ACTIVE
        // =====================================================

        if (abonnement.getStatut()
                != AbonnementStatus.ACTIVE) {

            throw new IllegalStateException(
                    "L'abonnement n'est plus disponible."
            );
        }


        // =====================================================
        // 9. Paiement → SUCCES
        // =====================================================

        paiement.setStatutPaiement(
                PaiementStatus.REUSSI
        );

        paiement.setDatePaiement(
                LocalDateTime.now()
        );

        paiement.setUpdatedAt(
                LocalDateTime.now()
        );

        paiementRepository.save(
                paiement
        );


        // =====================================================
        // 10. Vérifier encore qu'il n'existe pas déjà
        //     de subscription active
        // =====================================================

        Optional<Subscription> subscriptionActive =
                subscriptionRepository
                        .findFirstByUtilisateurAndDateFinAfterOrderByDateFinDesc(
                                utilisateur,
                                LocalDateTime.now()
                        );

        if (subscriptionActive.isPresent()) {

            throw new IllegalStateException(
                    "L'utilisateur possède déjà un abonnement actif."
            );
        }


        // =====================================================
        // 11. Calcul dates
        // =====================================================

        LocalDateTime dateDebut =
                LocalDateTime.now();

        LocalDateTime dateFin =
                dateDebut.plusMonths(
                        abonnement.getDureeEnMois()
                );


        // =====================================================
        // 12. Créer Subscription
        // =====================================================

        Subscription subscription =
                Subscription.builder()
                        .utilisateur(
                                utilisateur
                        )
                        .abonnement(
                                abonnement
                        )
                        .paiement(
                                paiement
                        )
                        .dateDebut(
                                dateDebut
                        )
                        .dateFin(
                                dateFin
                        )
                        .stripePaymentIntentId(
                                paymentIntentId
                        )
                        .build();


        subscription =
                subscriptionRepository.save(
                        subscription
                );


        // =====================================================
        // 13. Créer Facturation
        // =====================================================

        LocalDateTime now =
                LocalDateTime.now();

        Facturation facturation =
                Facturation.builder()
                        .utilisateur(
                                utilisateur
                        )
                        .subscription(
                                subscription
                        )
                        .statut(
                                FacturationStatus.ABONNE
                        )
                        .type(
                                FacturationType.ABONNEMENT
                        )
                        .methodePaiement(
                                "STRIPE"
                        )
                        .prixFacturation(
                                abonnement
                                        .getMontant()
                        )
                        .createdAt(
                                now
                        )
                        .updatedAt(
                                now
                        )
                        .build();


        facturationRepository.save(
                facturation
        );


        // =====================================================
        // 14. Relation inverse
        // =====================================================

        subscription.setFacturation(
                facturation
        );

        subscriptionRepository.save(
                subscription
        );


        notificationService
                .notifierPaiementConfirme(
                        utilisateur
                );
    }







    @Override
    @Transactional
    public void traiterPaiementSubscriptionEchec(
            String paymentIntentId
    ) {

        Paiement paiement =
                paiementRepository
                        .findByStripePaymentIntentId(
                                paymentIntentId
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Paiement non trouvé."
                                )
                        );


        PaymentIntent paymentIntent;

        try {

            paymentIntent =
                    PaymentIntent.retrieve(
                            paymentIntentId
                    );

        } catch (Exception e) {

            throw new IllegalStateException(
                    "Impossible de récupérer le paiement Stripe.",
                    e
            );
        }


        paiement.setStatutPaiement(
                PaiementStatus.ECHOUE
        );


        if (paymentIntent.getLastPaymentError() != null) {

            paiement.setMessageErreur(
                    paymentIntent
                            .getLastPaymentError()
                            .getMessage()
            );

        } else {

            paiement.setMessageErreur(
                    "Paiement Stripe échoué."
            );
        }


        paiement.setUpdatedAt(
                LocalDateTime.now()
        );


        paiementRepository.save(
                paiement
        );
    }



}