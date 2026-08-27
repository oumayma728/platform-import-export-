package com.commercial.Pont.Commercial.services.ImplementationServices;

import com.commercial.Pont.Commercial.dtos.responseDtos.ExchangeRateResponse;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.CurrencyConversionServiceInterface;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class CurrencyConversionServiceImpl
        implements CurrencyConversionServiceInterface {

    private final RestTemplate restTemplate;

    private final RedisTemplate<String, Object> redisTemplate;

    @Value("${currency.api.key}")
    private String apiKey;

    @Value("${currency.api.url}")
    private String apiUrl;


    @Override
    public BigDecimal convertir(
            BigDecimal montant,
            String deviseSource,
            String deviseCible
    ) {

        // =========================================
        // 1. Validation du montant
        // =========================================

        if (montant == null) {

            throw new IllegalArgumentException(
                    "Le montant ne peut pas être null."
            );
        }


        // =========================================
        // 2. Validation des devises
        // =========================================

        if (deviseSource == null
                || deviseCible == null) {

            throw new IllegalArgumentException(
                    "Les devises ne peuvent pas être nulles."
            );
        }


        // =========================================
        // 3. Normalisation
        // =========================================

        deviseSource =
                deviseSource.toUpperCase();

        deviseCible =
                deviseCible.toUpperCase();


        // =========================================
        // 4. Même devise
        // =========================================

        if (deviseSource.equals(deviseCible)) {

            return montant;
        }


        // =========================================
        // 5. Récupérer les taux
        // =========================================

        Map<String, BigDecimal> taux =
                recupererTaux(deviseSource);


        // =========================================
        // 6. Récupérer le taux de la devise cible
        // =========================================

        BigDecimal tauxConversion =
                taux.get(deviseCible);


        if (tauxConversion == null) {

            throw new IllegalArgumentException(
                    "Devise non supportée : "
                            + deviseCible
            );
        }


        // =========================================
        // 7. Effectuer la conversion
        // =========================================

        return montant
                .multiply(tauxConversion)
                .setScale(
                        2,
                        RoundingMode.HALF_UP
                );
    }


    /**
     * Récupère les taux de change.
     *
     * Ordre :
     *
     * 1. Redis
     * 2. Si Redis indisponible ou cache MISS :
     *    ExchangeRate-API
     * 3. Essayer de sauvegarder le résultat dans Redis
     *
     * Redis est uniquement un cache.
     * Son indisponibilité ne doit jamais bloquer
     * la conversion.
     */
    private Map<String, BigDecimal> recupererTaux(
            String deviseSource
    ) {

        // =========================================
        // Clé Redis
        // =========================================

        String cacheKey =
                "currency:rates:" + deviseSource;


        // =========================================
        // 1. ESSAYER REDIS
        // =========================================

        try {

            Object cached =
                    redisTemplate
                            .opsForValue()
                            .get(cacheKey);


            // -----------------------------------------
            // Cache HIT
            // -----------------------------------------

            if (cached != null) {

                ExchangeRateResponse response =
                        (ExchangeRateResponse) cached;


                System.out.println(
                        "========================================"
                );

                System.out.println(
                        "Currency cache HIT"
                );

                System.out.println(
                        "Devise source : "
                                + deviseSource
                );

                System.out.println(
                        "Source : Redis"
                );

                System.out.println(
                        "========================================"
                );


                return response.getConversion_rates();
            }


            // -----------------------------------------
            // Cache MISS
            // -----------------------------------------

            System.out.println(
                    "========================================"
            );

            System.out.println(
                    "Currency cache MISS"
            );

            System.out.println(
                    "Devise source : "
                            + deviseSource
            );

            System.out.println(
                    "Redis ne contient pas le taux."
            );

            System.out.println(
                    "Utilisation de ExchangeRate-API."
            );

            System.out.println(
                    "========================================"
            );


        } catch (DataAccessException e) {

            // =========================================
            // Redis indisponible
            // =========================================

            System.out.println(
                    "========================================"
            );

            System.out.println(
                    "Redis indisponible."
            );

            System.out.println(
                    "Devise source : "
                            + deviseSource
            );

            System.out.println(
                    "Fallback vers ExchangeRate-API."
            );

            System.out.println(
                    "Erreur Redis : "
                            + e.getMessage()
            );

            System.out.println(
                    "========================================"
            );
        }


        // =========================================
        // 2. EXCHANGERATE-API
        // =========================================

        String url = String.format(
                "%s/%s/latest/%s",
                apiUrl,
                apiKey,
                deviseSource
        );


        System.out.println(
                "Appel ExchangeRate-API..."
        );


        ExchangeRateResponse response;

        try {

            response =
                    restTemplate.getForObject(
                            url,
                            ExchangeRateResponse.class
                    );

        } catch (Exception e) {

            throw new IllegalStateException(
                    "Impossible de contacter "
                            + "ExchangeRate-API.",
                    e
            );
        }


        // =========================================
        // 3. Vérifier la réponse API
        // =========================================

        if (response == null) {

            throw new IllegalStateException(
                    "ExchangeRate-API a retourné "
                            + "une réponse null."
            );
        }


        if (!"success".equals(
                response.getResult()
        )) {

            throw new IllegalStateException(
                    "ExchangeRate-API a retourné "
                            + "une réponse invalide."
            );
        }


        if (response.getConversion_rates()
                == null) {

            throw new IllegalStateException(
                    "Les taux de conversion sont absents "
                            + "de la réponse ExchangeRate-API."
            );
        }


        // =========================================
        // 4. ESSAYER DE SAUVEGARDER DANS REDIS
        // =========================================

        try {

            redisTemplate.opsForValue().set(
                    cacheKey,
                    response,
                    1,
                    TimeUnit.HOURS
            );


            System.out.println(
                    "========================================"
            );

            System.out.println(
                    "Taux sauvegardés dans Redis."
            );

            System.out.println(
                    "Devise source : "
                            + deviseSource
            );

            System.out.println(
                    "Expiration : 1 heure"
            );

            System.out.println(
                    "========================================"
            );


        } catch (DataAccessException e) {

            // =========================================
            // Redis toujours indisponible
            // =========================================
            //
            // Ce n'est PAS bloquant.
            // Les taux viennent déjà de l'API.
            // =========================================

            System.out.println(
                    "========================================"
            );

            System.out.println(
                    "Impossible de sauvegarder dans Redis."
            );

            System.out.println(
                    "La conversion continue normalement."
            );

            System.out.println(
                    "Source : ExchangeRate-API"
            );

            System.out.println(
                    "Erreur Redis : "
                            + e.getMessage()
            );

            System.out.println(
                    "========================================"
            );
        }


        // =========================================
        // 5. Retourner les taux
        // =========================================

        return response.getConversion_rates();
    }
}