package com.commercial.Pont.Commercial.services.ServiceInterfaces;

public interface EmailServiceInterface {

    void sendEmail(
            String to,
            String subject,
            String body
    );
}