package com.commercial.Pont.Commercial.services.ServiceInterfaces;

import java.math.BigDecimal;

public interface CurrencyConversionServiceInterface {

    BigDecimal convertir(
            BigDecimal montant,
            String deviseSource,
            String deviseCible
    );
}
