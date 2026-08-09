package com.commercial.Pont.Commercial.mappers.InterfaceMappers;

import com.commercial.Pont.Commercial.dtos.requestDtos.AbonnementRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.AbonnementResponseDto;
import com.commercial.Pont.Commercial.models.Abonnement;

public interface AbonnementMapperInterface {

    Abonnement requestToEntity(AbonnementRequestDto abonnementRequestDto);

    AbonnementRequestDto entityToRequest(Abonnement abonnement);

    AbonnementResponseDto entityToResponse(Abonnement abonnement);

    Abonnement responseToEntity(AbonnementResponseDto abonnementResponseDto);
}
