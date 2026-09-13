package com.commercial.Pont.Commercial.services;

import com.commercial.Pont.Commercial.services.ImplementationServices.TwilioSmsServiceImpl;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.rest.api.v2010.account.MessageCreator;
import com.twilio.type.PhoneNumber;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class TwilioSmsServiceImplTest {

    private TwilioSmsServiceImpl smsService;


    @BeforeEach
    void setUp() {

        smsService =
                new TwilioSmsServiceImpl();


        /*
         * Injecte manuellement la valeur normalement
         * fournie par @Value("${twilio.phone-number}")
         */
        ReflectionTestUtils.setField(
                smsService,
                "twilioPhoneNumber",
                "+212600000000"
        );
    }


    // =========================================================
    // SUCCESS
    // =========================================================

    @Test
    void sendSms_ShouldSendSmsSuccessfully() {

        String destination =
                "+212611111111";

        String message =
                "Test SMS Pont Commercial";


        MessageCreator creator =
                mock(MessageCreator.class);

        Message twilioMessage =
                mock(Message.class);


        /*
         * Quand Twilio appelle creator.create(),
         * on retourne un faux Message.
         */
        when(creator.create())
                .thenReturn(
                        twilioMessage
                );


        when(twilioMessage.getSid())
                .thenReturn(
                        "SM123456789"
                );


        /*
         * Ton service affiche aussi le status.
         *
         * On peut retourner null ici,
         * car on veut seulement vérifier
         * que la méthode fonctionne.
         */
        when(twilioMessage.getStatus())
                .thenReturn(null);


        /*
         * On mock la méthode statique Message.creator(...)
         * pour empêcher tout vrai appel vers Twilio.
         */
        try (
                MockedStatic<Message> mockedMessage =
                        mockStatic(Message.class)
        ) {

            mockedMessage
                    .when(
                            () ->
                                    Message.creator(
                                            any(PhoneNumber.class),
                                            any(PhoneNumber.class),
                                            eq(message)
                                    )
                    )
                    .thenReturn(
                            creator
                    );


            assertDoesNotThrow(
                    () ->
                            smsService.sendSms(
                                    destination,
                                    message
                            )
            );


            verify(creator)
                    .create();


            verify(twilioMessage)
                    .getSid();


            verify(twilioMessage)
                    .getStatus();
        }
    }


    // =========================================================
    // VERIFY TWILIO CREATOR
    // =========================================================

    @Test
    void sendSms_ShouldCallTwilioCreator() {

        String destination =
                "+212611111111";

        String content =
                "Bonjour Jamal";


        MessageCreator creator =
                mock(MessageCreator.class);

        Message twilioMessage =
                mock(Message.class);


        when(creator.create())
                .thenReturn(
                        twilioMessage
                );


        try (
                MockedStatic<Message> mockedMessage =
                        mockStatic(Message.class)
        ) {

            mockedMessage
                    .when(
                            () ->
                                    Message.creator(
                                            any(PhoneNumber.class),
                                            any(PhoneNumber.class),
                                            eq(content)
                                    )
                    )
                    .thenReturn(
                            creator
                    );


            smsService.sendSms(
                    destination,
                    content
            );


            /*
             * Vérifie que Message.creator(...)
             * a bien été appelé.
             */
            mockedMessage.verify(
                    () ->
                            Message.creator(
                                    any(PhoneNumber.class),
                                    any(PhoneNumber.class),
                                    eq(content)
                            ),
                    times(1)
            );


            /*
             * Vérifie ensuite l'appel réel
             * creator.create().
             */
            verify(creator)
                    .create();
        }
    }


    // =========================================================
    // ERREUR AU MOMENT DE CREATE()
    // =========================================================

    @Test
    void sendSms_ShouldThrowIllegalStateException_WhenTwilioFails() {

        String destination =
                "+212611111111";

        String message =
                "Test erreur";


        MessageCreator creator =
                mock(MessageCreator.class);


        /*
         * Simulation d'une erreur Twilio.
         */
        when(creator.create())
                .thenThrow(
                        new RuntimeException(
                                "Twilio API unavailable"
                        )
                );


        try (
                MockedStatic<Message> mockedMessage =
                        mockStatic(Message.class)
        ) {

            mockedMessage
                    .when(
                            () ->
                                    Message.creator(
                                            any(PhoneNumber.class),
                                            any(PhoneNumber.class),
                                            eq(message)
                                    )
                    )
                    .thenReturn(
                            creator
                    );


            IllegalStateException exception =
                    assertThrows(
                            IllegalStateException.class,
                            () ->
                                    smsService.sendSms(
                                            destination,
                                            message
                                    )
                    );


            assertEquals(
                    "Impossible d'envoyer le SMS via Twilio.",
                    exception.getMessage()
            );


            assertNotNull(
                    exception.getCause()
            );


            assertEquals(
                    "Twilio API unavailable",
                    exception
                            .getCause()
                            .getMessage()
            );


            verify(creator)
                    .create();
        }
    }


    // =========================================================
    // ERREUR DANS Message.creator(...)
    // =========================================================

    @Test
    void sendSms_ShouldWrapException_WhenMessageCreatorFails() {

        String destination =
                "+212611111111";

        String message =
                "Test";


        try (
                MockedStatic<Message> mockedMessage =
                        mockStatic(Message.class)
        ) {

            /*
             * Ici l'erreur arrive avant même create().
             */
            mockedMessage
                    .when(
                            () ->
                                    Message.creator(
                                            any(PhoneNumber.class),
                                            any(PhoneNumber.class),
                                            eq(message)
                                    )
                    )
                    .thenThrow(
                            new RuntimeException(
                                    "Erreur création Twilio"
                            )
                    );


            IllegalStateException exception =
                    assertThrows(
                            IllegalStateException.class,
                            () ->
                                    smsService.sendSms(
                                            destination,
                                            message
                                    )
                    );


            assertEquals(
                    "Impossible d'envoyer le SMS via Twilio.",
                    exception.getMessage()
            );


            assertNotNull(
                    exception.getCause()
            );


            assertEquals(
                    "Erreur création Twilio",
                    exception
                            .getCause()
                            .getMessage()
            );
        }
    }
}