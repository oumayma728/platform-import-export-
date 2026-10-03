package com.commercial.Pont.Commercial.services.ServiceInterfaces;

import java.math.BigDecimal;
import org.springframework.security.access.prepost.PreAuthorize;
public interface CurrencyConversionServiceInterface {

    @PreAuthorize("hasAnyRole('ADMIN', 'IMPORTATEUR', 'EXPORTATEUR')")
    BigDecimal convertir(
            BigDecimal montant,
            String deviseSource,
            String deviseCible
    );
}
