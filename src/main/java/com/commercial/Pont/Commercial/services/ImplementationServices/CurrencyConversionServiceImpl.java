package com.commercial.Pont.Commercial.services.ImplementationServices;

import com.commercial.Pont.Commercial.services.ServiceInterfaces.CurrencyConversionServiceInterface;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class CurrencyConversionServiceImpl implements CurrencyConversionServiceInterface {

    /*
     * Conversion temporaire pour les tests.
     *
     * Plus tard :
     * remplacer cette classe par une vraie API
     * de conversion de devises.
     */

    private static final BigDecimal EUR_TO_MAD =
            BigDecimal.valueOf(11);

    @Override
    public BigDecimal convertir(
            BigDecimal montant,
            String deviseSource,
            String deviseCible
    ) {

        if (montant == null) {
            throw new IllegalArgumentException(
                    "Le montant ne peut pas être null."
            );
        }

        if (deviseSource == null
                || deviseCible == null) {

            throw new IllegalArgumentException(
                    "Les devises ne peuvent pas être nulles."
            );
        }

        deviseSource =
                deviseSource.toUpperCase();

        deviseCible =
                deviseCible.toUpperCase();


        // =========================================
        // Même devise
        // =========================================

        if (deviseSource.equals(deviseCible)) {

            return montant;
        }


        // =========================================
        // EUR -> MAD
        // =========================================

        if ("EUR".equals(deviseSource)
                && "MAD".equals(deviseCible)) {

            return montant
                    .multiply(EUR_TO_MAD)
                    .setScale(
                            2,
                            RoundingMode.HALF_UP
                    );
        }


        // =========================================
        // MAD -> EUR
        // =========================================

        if ("MAD".equals(deviseSource)
                && "EUR".equals(deviseCible)) {

            return montant
                    .divide(
                            EUR_TO_MAD,
                            2,
                            RoundingMode.HALF_UP
                    );
        }


        throw new IllegalArgumentException(
                "Conversion non supportée : "
                        + deviseSource
                        + " -> "
                        + deviseCible
        );
    }
}