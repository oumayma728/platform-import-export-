package com.commercial.Pont.Commercial.services.ServiceInterfaces;

public interface SmsServiceInterface {

    void sendSms(
            String phone,
            String message
    );
}