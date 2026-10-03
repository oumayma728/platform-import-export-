package com.commercial.Pont.Commercial.services.ServiceInterfaces;

import com.commercial.Pont.Commercial.dtos.requestDtos.CategorieRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.CategorieResponseDto;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;
import java.util.UUID;

public interface CategorieServiceInterface {

    @PreAuthorize("hasRole('ADMIN')")
    CategorieResponseDto create(CategorieRequestDto categorieRequestDto);

    @PreAuthorize("hasRole('ADMIN')")
    CategorieResponseDto update(
            UUID categorieId,
            CategorieRequestDto categorieRequestDto
    );

    @PreAuthorize("hasAnyRole('ADMIN', 'IMPORTATEUR', 'EXPORTATEUR')")
    CategorieResponseDto getById(UUID categorieId);

    @PreAuthorize("hasAnyRole('ADMIN', 'IMPORTATEUR', 'EXPORTATEUR')")
    List<CategorieResponseDto> getAll();

    @PreAuthorize("hasRole('ADMIN')")
    void delete(UUID categorieId);
}