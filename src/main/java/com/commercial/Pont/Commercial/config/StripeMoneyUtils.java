package com.commercial.Pont.Commercial.config;

import java.math.BigDecimal;
import java.util.Currency;

public final class StripeMoneyUtils {

    private StripeMoneyUtils() {
    }

    public static long toStripeAmount(
            BigDecimal amount,
            String currency
    ) {

        if (amount == null) {
            throw new IllegalArgumentException(
                    "Le montant ne peut pas être null."
            );
        }

        if (currency == null || currency.isBlank()) {
            throw new IllegalArgumentException(
                    "La devise ne peut pas être vide."
            );
        }

        Currency javaCurrency =
                Currency.getInstance(
                        currency.toUpperCase()
                );

        int fractionDigits =
                javaCurrency.getDefaultFractionDigits();

        return amount
                .movePointRight(fractionDigits)
                .longValueExact();
    }
}