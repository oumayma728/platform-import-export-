package com.commercial.Pont.Commercial.mappers.InterfaceMappers;

import com.commercial.Pont.Commercial.dtos.requestDtos.DocumentAnnonceRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.DocumentAnnonceResponseDto;
import com.commercial.Pont.Commercial.models.DocumentAnnonce;

public interface DocumentAnnonceMapperInterface {

    /**
     * Convertir DocumentAnnonceRequestDto vers DocumentAnnonce
     */
    DocumentAnnonce requestToEntity(
            DocumentAnnonceRequestDto documentAnnonceRequestDto
    );

    /**
     * Convertir DocumentAnnonce vers DocumentAnnonceRequestDto
     */
    DocumentAnnonceRequestDto entityToRequest(
            DocumentAnnonce documentAnnonce
    );

    /**
     * Convertir DocumentAnnonce vers DocumentAnnonceResponseDto
     */
    DocumentAnnonceResponseDto entityToResponse(
            DocumentAnnonce documentAnnonce
    );

    /**
     * Convertir DocumentAnnonceResponseDto vers DocumentAnnonce
     */
    DocumentAnnonce responseToEntity(
            DocumentAnnonceResponseDto documentAnnonceResponseDto
    );
}
