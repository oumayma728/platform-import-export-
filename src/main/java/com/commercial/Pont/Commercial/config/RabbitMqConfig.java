package com.commercial.Pont.Commercial.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMqConfig {

    @Value("${notification.rabbitmq.exchange}")
    private String exchangeName;

    @Value("${notification.rabbitmq.queue}")
    private String queueName;

    @Value("${notification.rabbitmq.routing-key}")
    private String routingKey;


    @Bean
    public DirectExchange notificationExchange() {

        return new DirectExchange(
                exchangeName
        );
    }


    @Bean
    public Queue notificationQueue() {

        return QueueBuilder
                .durable(
                        queueName
                )
                .build();
    }


    @Bean
    public Binding notificationBinding(
            Queue notificationQueue,
            DirectExchange notificationExchange
    ) {

        return BindingBuilder
                .bind(notificationQueue)
                .to(notificationExchange)
                .with(routingKey);
    }


    @Bean
    public MessageConverter messageConverter() {

        return new Jackson2JsonMessageConverter();
    }
}