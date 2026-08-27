package com.commercial.Pont.Commercial.controllers;

import com.commercial.Pont.Commercial.services.ServiceInterfaces.CurrencyConversionServiceInterface;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/currency")
@RequiredArgsConstructor
public class CurrencyController {

    private final CurrencyConversionServiceInterface
            currencyConversionService;

    @GetMapping("/convert")
    public ResponseEntity<BigDecimal> convertir(
            @RequestParam BigDecimal amount,
            @RequestParam String from,
            @RequestParam String to
    ) {

        BigDecimal montantConverti =
                currencyConversionService.convertir(
                        amount,
                        from,
                        to
                );

        return ResponseEntity.ok(montantConverti);
    }
}