package com.commercial.Pont.Commercial.mappers.InterfaceMappers;

import com.commercial.Pont.Commercial.dtos.requestDtos.AnnonceRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.AnnonceResponseDto;
import com.commercial.Pont.Commercial.models.Annonce;

public interface AnnonceMapperInterface {


    Annonce requestToEntity(AnnonceRequestDto annonceRequestDto);


    AnnonceRequestDto entityToRequest(Annonce annonce);


    AnnonceResponseDto entityToResponse(Annonce annonce);


    Annonce responseToEntity(AnnonceResponseDto annonceResponseDto);
}
