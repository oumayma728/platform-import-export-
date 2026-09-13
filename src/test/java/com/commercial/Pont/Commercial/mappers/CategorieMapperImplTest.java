package com.commercial.Pont.Commercial.mappers;

import com.commercial.Pont.Commercial.dtos.requestDtos.CategorieRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.CategorieResponseDto;
import com.commercial.Pont.Commercial.mappers.ImplementationMappers.CategorieMapperImpl;
import com.commercial.Pont.Commercial.models.Annonce;
import com.commercial.Pont.Commercial.models.Categorie;
import com.commercial.Pont.Commercial.repositories.AnnonceRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategorieMapperImplTest {

    @Mock
    private AnnonceRepository annonceRepository;

    @InjectMocks
    private CategorieMapperImpl mapper;

    @Test
    void nullInputs_ShouldReturnNull() {
        assertNull(mapper.requestToEntity(null));
        assertNull(mapper.entityToRequest(null));
        assertNull(mapper.entityToResponse(null));
        assertNull(mapper.responseToEntity(null));
    }

    @Test
    void requestToEntity_ShouldResolveAnnonces() {
        UUID annonceId = UUID.randomUUID();
        Annonce annonce = mock(Annonce.class);
        CategorieRequestDto dto = mock(CategorieRequestDto.class);

        when(dto.getAnnonceIds()).thenReturn(List.of(annonceId));
        when(annonceRepository.findAllById(List.of(annonceId)))
                .thenReturn(List.of(annonce));

        Categorie result = mapper.requestToEntity(dto);

        assertEquals(List.of(annonce), result.getAnnonces());
    }

    @Test
    void requestToEntity_WithoutAnnonces_ShouldUseEmptyList() {
        CategorieRequestDto dto = mock(CategorieRequestDto.class);

        Categorie result = mapper.requestToEntity(dto);

        assertNotNull(result);
        assertTrue(result.getAnnonces().isEmpty());
        verifyNoInteractions(annonceRepository);
    }

    @Test
    void entityToDtos_ShouldExtractAnnonceIds() {
        UUID annonceId = UUID.randomUUID();
        Annonce annonce = mock(Annonce.class);
        when(annonce.getAnnonceId()).thenReturn(annonceId);

        Categorie categorie = mock(Categorie.class);
        when(categorie.getAnnonces()).thenReturn(List.of(annonce));

        CategorieRequestDto request = mapper.entityToRequest(categorie);
        CategorieResponseDto response = mapper.entityToResponse(categorie);

        assertEquals(List.of(annonceId), request.getAnnonceIds());
        assertEquals(List.of(annonceId), response.getAnnonceIds());
    }

    @Test
    void responseToEntity_ShouldResolveAnnonces() {
        UUID annonceId = UUID.randomUUID();
        Annonce annonce = mock(Annonce.class);
        CategorieResponseDto dto = mock(CategorieResponseDto.class);

        when(dto.getAnnonceIds()).thenReturn(List.of(annonceId));
        when(annonceRepository.findAllById(List.of(annonceId)))
                .thenReturn(List.of(annonce));

        Categorie result = mapper.responseToEntity(dto);

        assertEquals(List.of(annonce), result.getAnnonces());
    }
}
