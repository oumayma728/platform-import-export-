package com.commercial.Pont.Commercial.services;

import com.commercial.Pont.Commercial.dtos.responseDtos.ExchangeRateResponse;
import com.commercial.Pont.Commercial.services.ImplementationServices.CurrencyConversionServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CurrencyConversionServiceImplTest {

    @Mock private RestTemplate restTemplate;
    @Mock private RedisTemplate<String, Object> redisTemplate;
    @Mock private ValueOperations<String, Object> valueOperations;

    private CurrencyConversionServiceImpl service;

    @BeforeEach
    void setUp() {

        service = new CurrencyConversionServiceImpl(
                restTemplate,
                redisTemplate
        );

        ReflectionTestUtils.setField(
                service,
                "apiKey",
                "test-key"
        );

        ReflectionTestUtils.setField(
                service,
                "apiUrl",
                "https://v6.exchangerate-api.com/v6"
        );

        lenient()
                .when(redisTemplate.opsForValue())
                .thenReturn(valueOperations);
    }

    @Test
    void convertir_ShouldThrow_WhenAmountNull() {
        assertThrows(
                IllegalArgumentException.class,
                () -> service.convertir(null, "MAD", "EUR")
        );
    }

    @Test
    void convertir_ShouldThrow_WhenSourceCurrencyNull() {
        assertThrows(
                IllegalArgumentException.class,
                () -> service.convertir(
                        BigDecimal.TEN,
                        null,
                        "EUR"
                )
        );
    }

    @Test
    void convertir_ShouldReturnSameAmount_WhenCurrenciesEqual() {
        BigDecimal amount = new BigDecimal("123.45");

        assertEquals(
                amount,
                service.convertir(amount, "mad", "MAD")
        );

        verifyNoInteractions(restTemplate);
    }

    @Test
    void convertir_ShouldUseRedis_WhenCacheHit() {
        ExchangeRateResponse cached = mock(ExchangeRateResponse.class);
        when(cached.getConversion_rates())
                .thenReturn(Map.of(
                        "EUR",
                        new BigDecimal("0.090")
                ));
        when(valueOperations.get("currency:rates:MAD"))
                .thenReturn(cached);

        BigDecimal result =
                service.convertir(
                        new BigDecimal("100"),
                        "mad",
                        "eur"
                );

        assertEquals(new BigDecimal("9.00"), result);
        verifyNoInteractions(restTemplate);
    }

    @Test
    void convertir_ShouldCallApiAndCache_WhenCacheMiss() {
        ExchangeRateResponse response = mock(ExchangeRateResponse.class);

        when(valueOperations.get("currency:rates:MAD"))
                .thenReturn(null);
        when(restTemplate.getForObject(
                "https://v6.exchangerate-api.com/v6/test-key/latest/MAD",
                ExchangeRateResponse.class))
                .thenReturn(response);
        when(response.getResult()).thenReturn("success");
        when(response.getConversion_rates())
                .thenReturn(Map.of(
                        "EUR",
                        new BigDecimal("0.09")
                ));

        BigDecimal result =
                service.convertir(
                        new BigDecimal("100"),
                        "MAD",
                        "EUR"
                );

        assertEquals(new BigDecimal("9.00"), result);

        verify(valueOperations).set(
                "currency:rates:MAD",
                response,
                1,
                TimeUnit.HOURS
        );
    }

    @Test
    void convertir_ShouldFallbackToApi_WhenRedisUnavailable() {
        ExchangeRateResponse response = mock(ExchangeRateResponse.class);

        when(valueOperations.get("currency:rates:MAD"))
                .thenThrow(new RedisConnectionFailureException("down"));
        when(restTemplate.getForObject(
                anyString(),
                eq(ExchangeRateResponse.class)))
                .thenReturn(response);
        when(response.getResult()).thenReturn("success");
        when(response.getConversion_rates())
                .thenReturn(Map.of(
                        "USD",
                        new BigDecimal("0.10")
                ));

        doThrow(new RedisConnectionFailureException("still down"))
                .when(valueOperations)
                .set(
                        anyString(),
                        any(),
                        anyLong(),
                        any(TimeUnit.class)
                );

        BigDecimal result =
                service.convertir(
                        new BigDecimal("50"),
                        "MAD",
                        "USD"
                );

        assertEquals(new BigDecimal("5.00"), result);
    }

    @Test
    void convertir_ShouldThrow_WhenTargetCurrencyUnsupported() {
        ExchangeRateResponse cached = mock(ExchangeRateResponse.class);
        when(cached.getConversion_rates())
                .thenReturn(Map.of("USD", BigDecimal.ONE));
        when(valueOperations.get("currency:rates:MAD"))
                .thenReturn(cached);

        assertThrows(
                IllegalArgumentException.class,
                () -> service.convertir(
                        BigDecimal.TEN,
                        "MAD",
                        "XYZ"
                )
        );
    }

    @Test
    void convertir_ShouldThrow_WhenApiFails() {
        when(valueOperations.get("currency:rates:MAD"))
                .thenReturn(null);
        when(restTemplate.getForObject(
                anyString(),
                eq(ExchangeRateResponse.class)))
                .thenThrow(new RuntimeException("network"));

        assertThrows(
                IllegalStateException.class,
                () -> service.convertir(
                        BigDecimal.TEN,
                        "MAD",
                        "EUR"
                )
        );
    }

    @Test
    void convertir_ShouldThrow_WhenApiReturnsNull() {
        when(valueOperations.get("currency:rates:MAD"))
                .thenReturn(null);
        when(restTemplate.getForObject(
                anyString(),
                eq(ExchangeRateResponse.class)))
                .thenReturn(null);

        assertThrows(
                IllegalStateException.class,
                () -> service.convertir(
                        BigDecimal.TEN,
                        "MAD",
                        "EUR"
                )
        );
    }

    @Test
    void convertir_ShouldThrow_WhenApiResultNotSuccess() {
        ExchangeRateResponse response = mock(ExchangeRateResponse.class);

        when(valueOperations.get("currency:rates:MAD"))
                .thenReturn(null);
        when(restTemplate.getForObject(
                anyString(),
                eq(ExchangeRateResponse.class)))
                .thenReturn(response);
        when(response.getResult()).thenReturn("error");

        assertThrows(
                IllegalStateException.class,
                () -> service.convertir(
                        BigDecimal.TEN,
                        "MAD",
                        "EUR"
                )
        );
    }

    @Test
    void convertir_ShouldThrow_WhenRatesMissing() {
        ExchangeRateResponse response = mock(ExchangeRateResponse.class);

        when(valueOperations.get("currency:rates:MAD"))
                .thenReturn(null);
        when(restTemplate.getForObject(
                anyString(),
                eq(ExchangeRateResponse.class)))
                .thenReturn(response);
        when(response.getResult()).thenReturn("success");
        when(response.getConversion_rates()).thenReturn(null);

        assertThrows(
                IllegalStateException.class,
                () -> service.convertir(
                        BigDecimal.TEN,
                        "MAD",
                        "EUR"
                )
        );
    }
}
