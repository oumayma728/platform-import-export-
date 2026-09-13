package com.commercial.Pont.Commercial.services;


import com.commercial.Pont.Commercial.services.ImplementationServices.BrevoEmailServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.MockedConstruction;
import org.springframework.http.*;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class BrevoEmailServiceImplTest {

    private BrevoEmailServiceImpl emailService;


    @BeforeEach
    void setUp() {

        emailService =
                new BrevoEmailServiceImpl();


        /*
         * Simulation des propriétés @Value
         */
        ReflectionTestUtils.setField(
                emailService,
                "brevoApiKey",
                "test-api-key"
        );

        ReflectionTestUtils.setField(
                emailService,
                "fromEmail",
                "noreply@test.com"
        );

        ReflectionTestUtils.setField(
                emailService,
                "fromName",
                "Pont Commercial"
        );
    }


    // =========================================================
    // SUCCESS
    // =========================================================

    @Test
    void sendEmail_ShouldSendEmailSuccessfully() {

        try (
                MockedConstruction<RestTemplate> mockedConstruction =
                        mockConstruction(
                                RestTemplate.class,
                                (mock, context) -> {

                                    when(
                                            mock.exchange(
                                                    eq(
                                                            "https://api.brevo.com/v3/smtp/email"
                                                    ),
                                                    eq(HttpMethod.POST),
                                                    any(HttpEntity.class),
                                                    eq(String.class)
                                            )
                                    )
                                            .thenReturn(
                                                    ResponseEntity
                                                            .status(
                                                                    HttpStatus.CREATED
                                                            )
                                                            .body(
                                                                    """
                                                                    {
                                                                      "messageId": "test-message-id"
                                                                    }
                                                                    """
                                                            )
                                            );
                                }
                        )
        ) {

            assertDoesNotThrow(
                    () ->
                            emailService.sendEmail(
                                    "client@test.com",
                                    "Test email",
                                    "<h1>Hello</h1>"
                            )
            );


            assertEquals(
                    1,
                    mockedConstruction
                            .constructed()
                            .size()
            );


            RestTemplate createdRestTemplate =
                    mockedConstruction
                            .constructed()
                            .get(0);


            verify(createdRestTemplate)
                    .exchange(
                            eq(
                                    "https://api.brevo.com/v3/smtp/email"
                            ),
                            eq(HttpMethod.POST),
                            any(HttpEntity.class),
                            eq(String.class)
                    );
        }
    }


    // =========================================================
    // VERIFY REQUEST
    // =========================================================

    @Test
    void sendEmail_ShouldSendCorrectHttpRequest() {

        try (
                MockedConstruction<RestTemplate> mockedConstruction =
                        mockConstruction(
                                RestTemplate.class,
                                (mock, context) -> {

                                    when(
                                            mock.exchange(
                                                    anyString(),
                                                    any(HttpMethod.class),
                                                    any(HttpEntity.class),
                                                    eq(String.class)
                                            )
                                    )
                                            .thenAnswer(
                                                    invocation -> {

                                                        HttpEntity<?> entity =
                                                                invocation.getArgument(2);

                                                        HttpHeaders headers =
                                                                entity.getHeaders();


                                                        assertEquals(
                                                                MediaType.APPLICATION_JSON,
                                                                headers.getContentType()
                                                        );


                                                        assertEquals(
                                                                "test-api-key",
                                                                headers.getFirst(
                                                                        "api-key"
                                                                )
                                                        );


                                                        String body =
                                                                entity.getBody()
                                                                        .toString();


                                                        assertTrue(
                                                                body.contains(
                                                                        "client@test.com"
                                                                )
                                                        );

                                                        assertTrue(
                                                                body.contains(
                                                                        "Test email"
                                                                )
                                                        );

                                                        assertTrue(
                                                                body.contains(
                                                                        "<h1>Hello</h1>"
                                                                )
                                                        );

                                                        assertTrue(
                                                                body.contains(
                                                                        "noreply@test.com"
                                                                )
                                                        );


                                                        return ResponseEntity
                                                                .status(
                                                                        HttpStatus.CREATED
                                                                )
                                                                .body(
                                                                        """
                                                                        {
                                                                          "messageId": "123"
                                                                        }
                                                                        """
                                                                );
                                                    }
                                            );
                                }
                        )
        ) {

            emailService.sendEmail(
                    "client@test.com",
                    "Test email",
                    "<h1>Hello</h1>"
            );


            assertEquals(
                    1,
                    mockedConstruction
                            .constructed()
                            .size()
            );
        }
    }


    // =========================================================
    // BREVO ERROR
    // =========================================================

    @Test
    void sendEmail_ShouldThrowIllegalStateException_WhenBrevoFails() {

        try (
                MockedConstruction<RestTemplate> mockedConstruction =
                        mockConstruction(
                                RestTemplate.class,
                                (mock, context) -> {

                                    when(
                                            mock.exchange(
                                                    anyString(),
                                                    any(HttpMethod.class),
                                                    any(HttpEntity.class),
                                                    eq(String.class)
                                            )
                                    )
                                            .thenThrow(
                                                    new RuntimeException(
                                                            "Brevo unavailable"
                                                    )
                                            );
                                }
                        )
        ) {

            IllegalStateException exception =
                    assertThrows(
                            IllegalStateException.class,
                            () ->
                                    emailService.sendEmail(
                                            "client@test.com",
                                            "Test",
                                            "Hello"
                                    )
                    );


            assertTrue(
                    exception
                            .getMessage()
                            .contains(
                                    "Erreur pendant l'envoi de l'email via Brevo"
                            )
            );

            assertTrue(
                    exception
                            .getMessage()
                            .contains(
                                    "Brevo unavailable"
                            )
            );
        }
    }
}