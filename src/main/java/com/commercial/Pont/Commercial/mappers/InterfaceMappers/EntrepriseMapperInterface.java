package com.commercial.Pont.Commercial.mappers.InterfaceMappers;

import com.commercial.Pont.Commercial.dtos.requestDtos.EntrepriseRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.EntrepriseResponseDto;
import com.commercial.Pont.Commercial.models.Entreprise;

public interface EntrepriseMapperInterface {

    /**
     * Convertir EntrepriseRequestDto vers Entreprise
     */
    Entreprise requestToEntity(
            EntrepriseRequestDto entrepriseRequestDto
    );

    /**
     * Convertir Entreprise vers EntrepriseRequestDto
     */
    EntrepriseRequestDto entityToRequest(
            Entreprise entreprise
    );

    /**
     * Convertir Entreprise vers EntrepriseResponseDto
     */
    EntrepriseResponseDto entityToResponse(
            Entreprise entreprise
    );

    /**
     * Convertir EntrepriseResponseDto vers Entreprise
     */
    Entreprise responseToEntity(
            EntrepriseResponseDto entrepriseResponseDto
    );
}
