package com.commercial.Pont.Commercial.services.ImplementationServices;

import com.commercial.Pont.Commercial.dtos.rabbitmq.NotificationEventDto;
import com.commercial.Pont.Commercial.models.Utilisateur;
import com.commercial.Pont.Commercial.repositories.UtilisateurRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class NotificationConsumer {

    private final UtilisateurRepository utilisateurRepository;

    private final NotificationServiceImpl notificationService;


    @RabbitListener(
            queues = "${notification.rabbitmq.queue}"
    )
    public void recevoirNotification(
            NotificationEventDto event
    ) {

        System.out.println(
                "========== NOTIFICATION RABBITMQ =========="
        );

        System.out.println(
                "Type : "
                        + event.getTypeNotification()
        );

        System.out.println(
                "Utilisateur : "
                        + event.getUtilisateurId()
        );


        Utilisateur utilisateur =
                utilisateurRepository
                        .findById(
                                event.getUtilisateurId()
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Utilisateur non trouvé."
                                )
                        );


        notificationService.sendEmail(
                utilisateur,
                event.getTypeNotification(),
                event.getSubject(),
                event.getEmailBody()
        );


        if (
                event.getSmsMessage() != null
                        &&
                        !event.getSmsMessage().isBlank()
        ) {

            notificationService.sendSms(
                    utilisateur,
                    event.getTypeNotification(),
                    event.getSmsMessage()
            );
        }


        System.out.println(
                "Notification RabbitMQ traitée."
        );

        System.out.println(
                "==========================================="
        );
    }
}