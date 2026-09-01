package com.commercial.Pont.Commercial.services.ImplementationServices;

import com.commercial.Pont.Commercial.services.ServiceInterfaces.EmailServiceInterface;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BrevoEmailServiceImpl
        implements EmailServiceInterface {

    @Value("${brevo.api-key}")
    private String brevoApiKey;

    @Value("${brevo.from-email}")
    private String fromEmail;

    @Value("${brevo.from-name}")
    private String fromName;


    @Override
    public void sendEmail(
            String to,
            String subject,
            String body
    ) {

        String url =
                "https://api.brevo.com/v3/smtp/email";


        RestTemplate restTemplate =
                new RestTemplate();


        HttpHeaders headers =
                new HttpHeaders();

        headers.setContentType(
                MediaType.APPLICATION_JSON
        );

        headers.set(
                "api-key",
                brevoApiKey
        );


        Map<String, Object> sender =
                Map.of(
                        "name", fromName,
                        "email", fromEmail
                );


        List<Map<String, String>> recipients =
                List.of(
                        Map.of(
                                "email",
                                to
                        )
                );


        Map<String, Object> requestBody =
                Map.of(
                        "sender",
                        sender,

                        "to",
                        recipients,

                        "subject",
                        subject,

                        "htmlContent",
                        body
                );


        HttpEntity<Map<String, Object>> request =
                new HttpEntity<>(
                        requestBody,
                        headers
                );


        try {

            System.out.println(
                    "========== ENVOI EMAIL BREVO =========="
            );

            System.out.println(
                    "Expéditeur (From) : "
                            + fromName
                            + " <"
                            + fromEmail
                            + ">"
            );

            System.out.println(
                    "Destinataire (To) : " + to
            );

            System.out.println(
                    "Sujet : " + subject
            );

            System.out.println(
                    "Contenu : " + body
            );


            ResponseEntity<String> response =
                    restTemplate.exchange(
                            url,
                            HttpMethod.POST,
                            request,
                            String.class
                    );


            System.out.println(
                    "Email envoyé avec succès."
            );

            System.out.println(
                    "Brevo status : "
                            + response.getStatusCode()
            );

            System.out.println(
                    "Réponse Brevo : "
                            + response.getBody()
            );

            System.out.println(
                    "========================================"
            );


        } catch (Exception e) {

            System.err.println(
                    "========== ERREUR EMAIL BREVO =========="
            );

            System.err.println(
                    "Expéditeur : "
                            + fromName
                            + " <"
                            + fromEmail
                            + ">"
            );

            System.err.println(
                    "Destinataire : " + to
            );

            System.err.println(
                    "Sujet : " + subject
            );

            System.err.println(
                    "Erreur : " + e.getMessage()
            );

            System.err.println(
                    "========================================="
            );


            throw new IllegalStateException(
                    "Erreur pendant l'envoi de l'email via Brevo : "
                            + e.getMessage(),
                    e
            );
        }
    }
}