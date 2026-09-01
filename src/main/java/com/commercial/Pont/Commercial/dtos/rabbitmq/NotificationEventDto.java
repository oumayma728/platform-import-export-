package com.commercial.Pont.Commercial.dtos.rabbitmq;

import com.commercial.Pont.Commercial.enums.NotificationType;
import lombok.*;

import java.io.Serializable;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationEventDto
        implements Serializable {

    private UUID utilisateurId;

    private NotificationType typeNotification;

    private String subject;

    private String emailBody;

    private String smsMessage;
}