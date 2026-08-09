package com.commercial.Pont.Commercial.services;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendPasswordResetCode(
            String email,
            String code
    ) {

        SimpleMailMessage message =
                new SimpleMailMessage();

        message.setTo(email);

        message.setSubject(
                "Réinitialisation de votre mot de passe"
        );

        message.setText(
                "Bonjour,\n\n" +
                        "Votre code de réinitialisation est : "
                        + code +
                        "\n\n" +
                        "Ce code est valable pendant 10 minutes.\n\n" +
                        "Si vous n'êtes pas à l'origine de cette demande, " +
                        "ignorez cet email."
        );

        mailSender.send(message);
    }





    public void sendPasswordChangedConfirmation(
            String email
    ) {

        SimpleMailMessage message =
                new SimpleMailMessage();

        message.setTo(email);

        message.setSubject(
                "Modification de votre mot de passe"
        );

        message.setText(
                "Bonjour,\n\n" +
                        "Votre mot de passe a été modifié avec succès.\n\n" +
                        "Si vous êtes à l'origine de cette modification, " +
                        "aucune action supplémentaire n'est nécessaire.\n\n" +
                        "Si vous n'êtes pas à l'origine de cette modification, " +
                        "contactez immédiatement l'administrateur.\n\n" +
                        "Cordialement,\n"
        );

        mailSender.send(message);
    }
}
