package com.commercial.Pont.Commercial.mappers.InterfaceMappers;

import com.commercial.Pont.Commercial.dtos.requestDtos.CategorieRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.CategorieResponseDto;
import com.commercial.Pont.Commercial.models.Categorie;

public interface CategorieMapperInterface {

    Categorie requestToEntity(CategorieRequestDto categorieRequestDto);


    CategorieRequestDto entityToRequest(Categorie categorie);


    CategorieResponseDto entityToResponse(Categorie categorie);

    Categorie responseToEntity(CategorieResponseDto categorieResponseDto);
}
