package com.commercial.Pont.Commercial.services.ServiceInterfaces;

import com.commercial.Pont.Commercial.dtos.requestDtos.CategorieRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.CategorieResponseDto;

import java.util.List;
import java.util.UUID;

public interface CategorieServiceInterface {

    CategorieResponseDto create(CategorieRequestDto categorieRequestDto);

    CategorieResponseDto update(
            UUID categorieId,
            CategorieRequestDto categorieRequestDto
    );

    CategorieResponseDto getById(UUID categorieId);

    List<CategorieResponseDto> getAll();

    void delete(UUID categorieId);
}