package com.commercial.Pont.Commercial.mappers;

import com.commercial.Pont.Commercial.dtos.requestDtos.LocationRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.LocationResponseDto;
import com.commercial.Pont.Commercial.mappers.ImplementationMappers.LocationMapperImpl;
import com.commercial.Pont.Commercial.models.Annonce;
import com.commercial.Pont.Commercial.models.Entreprise;
import com.commercial.Pont.Commercial.models.Location;
import com.commercial.Pont.Commercial.repositories.AnnonceRepository;
import com.commercial.Pont.Commercial.repositories.EntrepriseRepository;
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
class LocationMapperImplTest {

    @Mock private AnnonceRepository annonceRepository;
    @Mock private EntrepriseRepository entrepriseRepository;

    @InjectMocks
    private LocationMapperImpl mapper;

    @Test
    void nullInputs_ShouldReturnNull() {
        assertNull(mapper.requestToEntity(null));
        assertNull(mapper.entityToRequest(null));
        assertNull(mapper.entityToResponse(null));
        assertNull(mapper.responseToEntity(null));
    }

    @Test
    void requestToEntity_ShouldResolveRelations() {
        UUID annonceId = UUID.randomUUID();
        UUID entrepriseId = UUID.randomUUID();

        Annonce annonce = mock(Annonce.class);
        Entreprise entreprise = mock(Entreprise.class);
        LocationRequestDto dto = mock(LocationRequestDto.class);

        when(dto.getAnnoncesOriginesIds()).thenReturn(List.of(annonceId));
        when(dto.getEntreprisesIds()).thenReturn(List.of(entrepriseId));
        when(annonceRepository.findAllById(List.of(annonceId))).thenReturn(List.of(annonce));
        when(entrepriseRepository.findAllById(List.of(entrepriseId))).thenReturn(List.of(entreprise));

        Location result = mapper.requestToEntity(dto);

        assertEquals(List.of(annonce), result.getAnnoncesOrigines());
        assertEquals(List.of(entreprise), result.getEntreprises());
    }

    @Test
    void requestToEntity_WithoutRelations_ShouldUseEmptyLists() {
        LocationRequestDto dto = mock(LocationRequestDto.class);

        Location result = mapper.requestToEntity(dto);

        assertTrue(result.getAnnoncesOrigines().isEmpty());
        assertTrue(result.getEntreprises().isEmpty());
    }

    @Test
    void entityToDtos_ShouldExtractRelationIds() {
        UUID annonceId = UUID.randomUUID();
        UUID entrepriseId = UUID.randomUUID();

        Annonce annonce = mock(Annonce.class);
        Entreprise entreprise = mock(Entreprise.class);
        when(annonce.getAnnonceId()).thenReturn(annonceId);
        when(entreprise.getEntrepriseId()).thenReturn(entrepriseId);

        Location location = mock(Location.class);
        when(location.getAnnoncesOrigines()).thenReturn(List.of(annonce));
        when(location.getEntreprises()).thenReturn(List.of(entreprise));

        LocationRequestDto request = mapper.entityToRequest(location);
        LocationResponseDto response = mapper.entityToResponse(location);

        assertEquals(List.of(annonceId), request.getAnnoncesOriginesIds());
        assertEquals(List.of(entrepriseId), request.getEntreprisesIds());
        assertEquals(List.of(annonceId), response.getAnnoncesOriginesIds());
        assertEquals(List.of(entrepriseId), response.getEntreprisesIds());
    }

    @Test
    void responseToEntity_ShouldResolveRelations() {
        UUID annonceId = UUID.randomUUID();
        UUID entrepriseId = UUID.randomUUID();

        Annonce annonce = mock(Annonce.class);
        Entreprise entreprise = mock(Entreprise.class);
        LocationResponseDto dto = mock(LocationResponseDto.class);

        when(dto.getAnnoncesOriginesIds()).thenReturn(List.of(annonceId));
        when(dto.getEntreprisesIds()).thenReturn(List.of(entrepriseId));
        when(annonceRepository.findAllById(List.of(annonceId))).thenReturn(List.of(annonce));
        when(entrepriseRepository.findAllById(List.of(entrepriseId))).thenReturn(List.of(entreprise));

        Location result = mapper.responseToEntity(dto);

        assertEquals(List.of(annonce), result.getAnnoncesOrigines());
        assertEquals(List.of(entreprise), result.getEntreprises());
    }
}
