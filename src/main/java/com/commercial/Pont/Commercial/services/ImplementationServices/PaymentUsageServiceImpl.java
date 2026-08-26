package com.commercial.Pont.Commercial.services.ImplementationServices;

import com.commercial.Pont.Commercial.config.BillingConfig;
import com.commercial.Pont.Commercial.config.StripeMoneyUtils;
import com.commercial.Pont.Commercial.dtos.requestDtos.PaymentUsageRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.CreatePaymentUsageResponseDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.PaymentUsageRecommendationResponseDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.PaymentUsageResponseDto;
import com.commercial.Pont.Commercial.enums.AbonnementStatus;
import com.commercial.Pont.Commercial.enums.FacturationStatus;
import com.commercial.Pont.Commercial.enums.FacturationType;
import com.commercial.Pont.Commercial.enums.PaiementStatus;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.PaymentUsageMapperInterface;
import com.commercial.Pont.Commercial.models.*;
import com.commercial.Pont.Commercial.repositories.*;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.CurrencyConversionServiceInterface;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.PaymentUsageServiceInterface;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class PaymentUsageServiceImpl
        implements PaymentUsageServiceInterface {

    private final PaymentUsageRepository paymentUsageRepository;

    private final PaymentUsageMapperInterface paymentUsageMapper;

    private final UtilisateurRepository utilisateurRepository;

    private final AbonnementRepository abonnementRepository;

    private final PaiementRepository paiementRepository;

    private final FacturationRepository facturationRepository;

    private final SubscriptionRepository subscriptionRepository;

    private final BillingConfig billingConfig;

    private final CurrencyConversionServiceInterface currencyConversionService;





    // =========================================================
    // UPDATE
    // =========================================================

    @Override
    public PaymentUsageResponseDto updatePaymentUsage(
            UUID paymentUsageId,
            PaymentUsageRequestDto requestDto
    ) {

        PaymentUsage paymentUsage =
                paymentUsageRepository
                        .findById(paymentUsageId)
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "PaymentUsage non trouvé avec l'id : "
                                                + paymentUsageId
                                )
                        );

        PaymentUsage updatedPaymentUsage =
                paymentUsageMapper.toEntity(requestDto);

        paymentUsage.setUtilisateur(
                updatedPaymentUsage.getUtilisateur()
        );

        paymentUsage.setNombreMessagesAchetes(
                updatedPaymentUsage
                        .getNombreMessagesAchetes()
        );

        paymentUsage.setUpdatedAt(
                LocalDateTime.now()
        );

        PaymentUsage savedPaymentUsage =
                paymentUsageRepository.save(paymentUsage);

        return paymentUsageMapper.toResponseDto(
                savedPaymentUsage
        );
    }


    // =========================================================
    // DELETE
    // =========================================================

    @Override
    public void deletePaymentUsage(
            UUID paymentUsageId
    ) {

        if (!paymentUsageRepository.existsById(
                paymentUsageId
        )) {

            throw new EntityNotFoundException(
                    "PaymentUsage non trouvé avec l'id : "
                            + paymentUsageId
            );
        }

        paymentUsageRepository.deleteById(
                paymentUsageId
        );
    }






    // =========================================================
    // 1. RECOMMANDATION
    // =========================================================

    @Override
    @Transactional(readOnly = true)
    public PaymentUsageRecommendationResponseDto
    recommanderAbonnement(
            PaymentUsageRequestDto requestDto,
            Authentication authentication
    ) {

        // =====================================================
        // Récupérer utilisateur connecté
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
        // Nombre de messages
        // =====================================================

        Integer nombreMessages =
                requestDto.getNombreMessagesAchetes();

        if (nombreMessages == null
                || nombreMessages <= 0) {

            throw new IllegalArgumentException(
                    "Le nombre de messages doit être supérieur à 0."
            );
        }


        // =====================================================
        // Prix d'un message
        // =====================================================

        BigDecimal prixParMessage =
                billingConfig.getMessagePrice();


        // =====================================================
        // Devise du billing
        // =====================================================

        String deviseBilling =
                billingConfig.getCurrency()
                        .toUpperCase();


        // =====================================================
        // Calcul prix total
        // =====================================================

        BigDecimal montantMessages =
                prixParMessage.multiply(
                        BigDecimal.valueOf(
                                nombreMessages
                        )
                );


        // =====================================================
        // Chercher les abonnements ACTIVE
        // =====================================================

        List<Abonnement> abonnementsActifs =
                abonnementRepository.findByStatut(
                        AbonnementStatus.ACTIVE
                );


        // =====================================================
        // Chercher le meilleur abonnement
        // moins cher que l'achat
        // =====================================================

        Optional<AbonnementRecommendation>
                meilleureRecommendation =
                abonnementsActifs
                        .stream()
                        .map(abonnement ->
                                creerRecommendation(
                                        abonnement,
                                        montantMessages,
                                        deviseBilling
                                )
                        )
                        .filter(Optional::isPresent)
                        .map(Optional::get)
                        .min(
                                Comparator.comparing(
                                        AbonnementRecommendation
                                                ::montantConverti
                                )
                        );


        // =====================================================
        // Aucune recommandation
        // =====================================================

        if (meilleureRecommendation.isEmpty()) {

            return PaymentUsageRecommendationResponseDto
                    .builder()
                    .nombreMessages(nombreMessages)
                    .montantMessages(montantMessages)
                    .devise(deviseBilling)
                    .abonnementRecommande(false)
                    .message(
                            "L'achat de "
                                    + nombreMessages
                                    + " messages est "
                                    + "plus avantageux que les "
                                    + "abonnements disponibles."
                    )
                    .build();
        }


        // =====================================================
        // Recommandation trouvée
        // =====================================================

        AbonnementRecommendation recommendation =
                meilleureRecommendation.get();

        Abonnement abonnement =
                recommendation.abonnement();


        return PaymentUsageRecommendationResponseDto
                .builder()
                .nombreMessages(nombreMessages)
                .montantMessages(montantMessages)
                .devise(deviseBilling)
                .abonnementRecommande(true)
                .abonnementId(
                        abonnement.getAbonnementId()
                )
                .abonnementNom(
                        abonnement.getNom()
                )
                .montantAbonnement(
                        abonnement.getMontant()
                )
                .deviseAbonnement(
                        abonnement.getDevise()
                )
                .message(
                        "L'abonnement "
                                + abonnement.getNom()
                                + " est plus avantageux. "
                                + "Son prix est de "
                                + abonnement.getMontant()
                                + " "
                                + abonnement.getDevise()
                                + " contre "
                                + montantMessages
                                + " "
                                + deviseBilling
                                + " pour "
                                + nombreMessages
                                + " messages."
                )
                .build();
    }


    // =========================================================
    // Méthode interne pour recommandation
    // =========================================================

    private Optional<AbonnementRecommendation>
    creerRecommendation(
            Abonnement abonnement,
            BigDecimal montantMessages,
            String deviseBilling
    ) {

        if (abonnement.getMontant() == null
                || abonnement.getDevise() == null
                || abonnement.getDevise().isBlank()) {

            return Optional.empty();
        }


        BigDecimal montantAbonnementConverti =
                currencyConversionService.convertir(
                        abonnement.getMontant(),
                        abonnement.getDevise(),
                        deviseBilling
                );


        /*
         * L'abonnement doit coûter MOINS
         * que l'achat de messages.
         */

        if (montantAbonnementConverti
                .compareTo(montantMessages) >= 0) {

            return Optional.empty();
        }


        return Optional.of(
                new AbonnementRecommendation(
                        abonnement,
                        montantAbonnementConverti
                )
        );
    }


    // =========================================================
    // Objet interne de recommandation
    // =========================================================

    private record AbonnementRecommendation(
            Abonnement abonnement,
            BigDecimal montantConverti
    ) {
    }


    // =========================================================
    // 2. CRÉER PAYMENTINTENT
    // =========================================================

    @Override
    public CreatePaymentUsageResponseDto
    creerPaiementPaymentUsage(
            PaymentUsageRequestDto requestDto,
            Authentication authentication
    ) {

        // =====================================================
        // Utilisateur connecté
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
        // Nombre messages
        // =====================================================

        Integer nombreMessages =
                requestDto.getNombreMessagesAchetes();

        if (nombreMessages == null
                || nombreMessages <= 0) {

            throw new IllegalArgumentException(
                    "Le nombre de messages doit être supérieur à 0."
            );
        }


        // =====================================================
        // Vérifier si utilisateur est déjà abonné
        // =====================================================

        Optional<Subscription> subscriptionActive =
                subscriptionRepository
                        .findFirstByUtilisateurAndDateFinAfterOrderByDateFinDesc(
                                utilisateur,
                                LocalDateTime.now()
                        );

        if (subscriptionActive.isPresent()) {

            throw new IllegalStateException(
                    "Vous avez déjà un abonnement actif. "
                            + "L'achat de messages supplémentaires "
                            + "n'est pas nécessaire."
            );
        }


        // =====================================================
        // Prix
        // =====================================================

        BigDecimal prixParMessage =
                billingConfig.getMessagePrice();

        String devise =
                billingConfig.getCurrency()
                        .toUpperCase();


        BigDecimal montant =
                prixParMessage.multiply(
                        BigDecimal.valueOf(
                                nombreMessages
                        )
                );


        // =====================================================
        // Conversion Stripe
        // =====================================================

        long montantStripe =
                StripeMoneyUtils.toStripeAmount(
                        montant,
                        devise
                );


        // =====================================================
        // Créer Paiement local
        // =====================================================

        LocalDateTime now =
                LocalDateTime.now();

        Paiement paiement =
                Paiement.builder()
                        .montant(montant)
                        .devise(devise)
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
        // Créer PaymentIntent Stripe
        // =====================================================

        PaymentIntentCreateParams params =
                PaymentIntentCreateParams
                        .builder()
                        .setAmount(montantStripe)
                        .setCurrency(
                                devise.toLowerCase()
                        )

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
                                "type",
                                "PAYMENT_USAGE"
                        )

                        .putMetadata(
                                "paiementId",
                                paiement
                                        .getPaiementId()
                                        .toString()
                        )

                        .putMetadata(
                                "utilisateurId",
                                utilisateur
                                        .getUtilisateurId()
                                        .toString()
                        )

                        .putMetadata(
                                "nombreMessagesAchetes",
                                nombreMessages.toString()
                        )

                        .build();


        try {

            PaymentIntent paymentIntent =
                    PaymentIntent.create(
                            params
                    );


            // =================================================
            // Sauvegarder PaymentIntent
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
            // Retour frontend
            // =================================================

            return CreatePaymentUsageResponseDto
                    .builder()
                    .paiementId(
                            paiement.getPaiementId()
                    )
                    .nombreMessagesAchetes(
                            nombreMessages
                    )
                    .montant(
                            montantStripe
                    )
                    .montantDecimal(
                            montant
                    )
                    .devise(
                            devise
                    )
                    .paymentIntentId(
                            paymentIntent.getId()
                    )
                    .clientSecret(
                            paymentIntent.getClientSecret()
                    )
                    .statut(
                            paymentIntent.getStatus()
                    )
                    .build();

        } catch (Exception e) {

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


    // =========================================================
    // 3. WEBHOOK PAYMENT_USAGE
    // =========================================================

    @Override
    public void traiterPaiementUsageReussi(
            String paymentIntentId
    ) {

        // =====================================================
        // Récupérer Paiement
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
        // Idempotence
        // =====================================================

        if (paiement.getStatutPaiement()
                == PaiementStatus.REUSSI) {

            return;
        }


        // =====================================================
        // Récupérer PaymentIntent Stripe
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
        // Vérifier paiement réussi
        // =====================================================

        if (!"succeeded".equals(
                paymentIntent.getStatus()
        )) {

            throw new IllegalStateException(
                    "Le paiement Stripe n'est pas réussi."
            );
        }


        // =====================================================
        // Vérifier metadata
        // =====================================================

        String type =
                paymentIntent
                        .getMetadata()
                        .get("type");

        if (!"PAYMENT_USAGE".equals(type)) {

            throw new IllegalStateException(
                    "Le PaymentIntent n'est pas de type PAYMENT_USAGE."
            );
        }


        String utilisateurIdString =
                paymentIntent
                        .getMetadata()
                        .get("utilisateurId");

        String nombreMessagesString =
                paymentIntent
                        .getMetadata()
                        .get("nombreMessagesAchetes");


        if (utilisateurIdString == null
                || nombreMessagesString == null) {

            throw new IllegalStateException(
                    "Metadata PaymentUsage manquantes."
            );
        }


        UUID utilisateurId =
                UUID.fromString(
                        utilisateurIdString
                );

        Integer nombreMessages =
                Integer.valueOf(
                        nombreMessagesString
                );


        // =====================================================
        // Récupérer utilisateur
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
        // Paiement REUSSI
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
        // Vérifier si PaymentUsage existe déjà
        // =====================================================

        Optional<PaymentUsage> usageExistant =
                paymentUsageRepository
                        .findByStripePaymentIntentId(
                                paymentIntentId
                        );

        if (usageExistant.isPresent()) {

            return;
        }


        // =====================================================
        // Créer PaymentUsage
        // =====================================================

        LocalDateTime now =
                LocalDateTime.now();

        PaymentUsage paymentUsage =
                PaymentUsage.builder()
                        .stripePaymentIntentId(
                                paymentIntentId
                        )
                        .utilisateur(
                                utilisateur
                        )
                        .nombreMessagesAchetes(
                                nombreMessages
                        )
                        .montant(
                                paiement.getMontant()
                        )
                        .devise(
                                paiement.getDevise()
                        )
                        .dateAchat(
                                now
                        )
                        .createdAt(
                                now
                        )
                        .updatedAt(
                                now
                        )
                        .paiement(
                                paiement
                        )
                        .build();


        paymentUsage =
                paymentUsageRepository.save(
                        paymentUsage
                );


        // =====================================================
        // Augmenter maxMessagesPossible
        // =====================================================

        Integer maximumActuel =
                utilisateur
                        .getMaxMessagesPossible();

        if (maximumActuel == null) {

            maximumActuel = 50;
        }


        utilisateur.setMaxMessagesPossible(
                maximumActuel + nombreMessages
        );


        utilisateurRepository.save(
                utilisateur
        );


        // =====================================================
        // Créer Facturation
        // =====================================================

        Facturation facturation =
                Facturation.builder()
                        .utilisateur(
                                utilisateur
                        )
                        .paymentUsage(
                                paymentUsage
                        )
                        .statut(
                                FacturationStatus.PAIEMENT_USAGE
                        )
                        .type(
                                FacturationType.PAYMENT_USAGE
                        )
                        .methodePaiement(
                                "STRIPE"
                        )
                        .prixFacturation(
                                paymentUsage.getMontant()
                        )
                        .createdAt(
                                now
                        )
                        .updatedAt(
                                now
                        )
                        .build();


        facturation =
                facturationRepository.save(
                        facturation
                );


        // =====================================================
        // Relation inverse
        // =====================================================

        paymentUsage.setFacturation(
                facturation
        );

        paymentUsageRepository.save(
                paymentUsage
        );
    }


    // =========================================================
    // GET BY ID
    // =========================================================

    @Override
    @Transactional(readOnly = true)
    public PaymentUsageResponseDto
    getPaymentUsageById(
            UUID paymentUsageId
    ) {

        PaymentUsage paymentUsage =
                paymentUsageRepository
                        .findById(paymentUsageId)
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "PaymentUsage non trouvé avec l'id : "
                                                + paymentUsageId
                                )
                        );

        return paymentUsageMapper.toResponseDto(
                paymentUsage
        );
    }


    // =========================================================
    // GET ALL
    // =========================================================

    @Override
    @Transactional(readOnly = true)
    public List<PaymentUsageResponseDto>
    getAllPaymentUsages() {

        return paymentUsageRepository
                .findAll()
                .stream()
                .map(
                        paymentUsageMapper::toResponseDto
                )
                .toList();
    }


    // =========================================================
    // GET BY UTILISATEUR
    // =========================================================

    @Override
    @Transactional(readOnly = true)
    public List<PaymentUsageResponseDto>
    getPaymentUsagesByUtilisateur(
            UUID utilisateurId
    ) {

        return paymentUsageRepository
                .findByUtilisateurUtilisateurId(
                        utilisateurId
                )
                .stream()
                .map(
                        paymentUsageMapper::toResponseDto
                )
                .toList();
    }

}