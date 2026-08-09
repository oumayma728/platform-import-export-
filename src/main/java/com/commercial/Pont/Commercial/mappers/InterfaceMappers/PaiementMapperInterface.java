package com.commercial.Pont.Commercial.mappers.InterfaceMappers;

import com.commercial.Pont.Commercial.dtos.requestDtos.PaiementRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.PaiementResponseDto;
import com.commercial.Pont.Commercial.models.Paiement;

public interface PaiementMapperInterface {

    /**
     * Convertir PaiementRequestDto vers Paiement
     */
    Paiement requestToEntity(
            PaiementRequestDto paiementRequestDto
    );

    /**
     * Convertir Paiement vers PaiementRequestDto
     */
    PaiementRequestDto entityToRequest(
            Paiement paiement
    );

    /**
     * Convertir Paiement vers PaiementResponseDto
     */
    PaiementResponseDto entityToResponse(
            Paiement paiement
    );

    /**
     * Convertir PaiementResponseDto vers Paiement
     */
    Paiement responseToEntity(
            PaiementResponseDto paiementResponseDto
    );
}