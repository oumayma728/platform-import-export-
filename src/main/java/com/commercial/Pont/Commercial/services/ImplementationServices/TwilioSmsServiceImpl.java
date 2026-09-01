package com.commercial.Pont.Commercial.services.ImplementationServices;


import com.commercial.Pont.Commercial.services.ServiceInterfaces.SmsServiceInterface;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TwilioSmsServiceImpl
        implements SmsServiceInterface {

    @Value("${twilio.phone-number}")
    private String twilioPhoneNumber;


    @Override
    public void sendSms(
            String phone,
            String message
    ) {

        try {

            System.out.println(
                    "========== ENVOI SMS TWILIO =========="
            );

            System.out.println(
                    "Expéditeur (From) : " + twilioPhoneNumber
            );

            System.out.println(
                    "Destinataire (To) : " + phone
            );

            System.out.println(
                    "Message : " + message
            );

            Message twilioMessage =
                    Message.creator(
                            new PhoneNumber(phone),
                            new PhoneNumber(twilioPhoneNumber),
                            message
                    ).create();


            System.out.println(
                    "SMS envoyé avec succès."
            );

            System.out.println(
                    "SID Twilio : " + twilioMessage.getSid()
            );

            System.out.println(
                    "Status : " + twilioMessage.getStatus()
            );

            System.out.println(
                    "======================================"
            );


        } catch (Exception e) {

            System.err.println(
                    "========== ERREUR SMS TWILIO =========="
            );

            System.err.println(
                    "Expéditeur : " + twilioPhoneNumber
            );

            System.err.println(
                    "Destinataire : " + phone
            );

            System.err.println(
                    "Erreur : " + e.getMessage()
            );

            System.err.println(
                    "========================================"
            );

            throw new IllegalStateException(
                    "Impossible d'envoyer le SMS via Twilio.",
                    e
            );
        }
    }
}