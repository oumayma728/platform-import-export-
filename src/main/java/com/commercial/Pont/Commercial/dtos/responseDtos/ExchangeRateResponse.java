package com.commercial.Pont.Commercial.dtos.responseDtos;


import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
public class ExchangeRateResponse {

    private String result;

    private String base_code;

    private Map<String, BigDecimal> conversion_rates;
}