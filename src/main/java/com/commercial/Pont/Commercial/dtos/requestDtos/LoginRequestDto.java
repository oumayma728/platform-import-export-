package com.commercial.Pont.Commercial.dtos.requestDtos;

import lombok.Data;

@Data
public class LoginRequestDto {

    private String email;

    private String password;
}