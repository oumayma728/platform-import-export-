/*package com.commercial.Pont.Commercial.services.ImplementationServices;


import com.commercial.Pont.Commercial.services.ServiceInterfaces.EmailServiceInterface;
import com.sendgrid.*;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Service
@RequiredArgsConstructor
public class SendGridEmailServiceImpl
        implements EmailServiceInterface {

    @Value("${sendgrid.api-key}")
    private String sendGridApiKey;

    @Value("${sendgrid.from-email}")
    private String fromEmail;


    @Override
    public void sendEmail(
            String to,
            String subject,
            String body
    ) {

        try {

            Email from =
                    new Email(fromEmail);

            Email recipient =
                    new Email(to);

            Content content =
                    new Content(
                            "text/html",
                            body
                    );

            Mail mail =
                    new Mail(
                            from,
                            subject,
                            recipient,
                            content
                    );


            SendGrid sendGrid =
                    new SendGrid(
                            sendGridApiKey
                    );


            Request request =
                    new Request();

            request.setMethod(
                    Method.POST
            );

            request.setEndpoint(
                    "mail/send"
            );

            request.setBody(
                    mail.build()
            );


            Response response =
                    sendGrid.api(
                            request
                    );


            int statusCode =
                    response.getStatusCode();


            System.out.println(
                    "SendGrid status : "
                            + statusCode
            );


            if (
                    statusCode < 200
                            ||
                            statusCode >= 300
            ) {

                throw new IllegalStateException(
                        "Erreur SendGrid. HTTP "
                                + statusCode
                                + " : "
                                + response.getBody()
                );
            }


        } catch (IOException e) {

            throw new IllegalStateException(
                    "Impossible d'envoyer l'email via SendGrid.",
                    e
            );
        }
    }
}*/