package com.commercial.Pont.Commercial.dtos.requestDtos;


import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateSubscriptionRequestDto {

    private UUID abonnementId;
}