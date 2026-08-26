package com.commercial.Pont.Commercial.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;

@Configuration
@Getter
public class BillingConfig {

    @Value("${billing.message-price}")
    private BigDecimal messagePrice;

    @Value("${billing.currency}")
    private String currency;


}