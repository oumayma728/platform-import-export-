package com.commercial.Pont.Commercial.services.ImplementationServices;

import com.commercial.Pont.Commercial.dtos.rabbitmq.NotificationEventDto;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NotificationProducer {

    private final RabbitTemplate rabbitTemplate;


    @Value("${notification.rabbitmq.exchange}")
    private String exchange;


    @Value("${notification.rabbitmq.routing-key}")
    private String routingKey;


    public void envoyerNotification(
            NotificationEventDto event
    ) {

        rabbitTemplate.convertAndSend(
                exchange,
                routingKey,
                event
        );

        System.out.println(
                "Notification ajoutée dans RabbitMQ : "
                        + event.getTypeNotification()
                        + " | utilisateur : "
                        + event.getUtilisateurId()
        );
    }
}