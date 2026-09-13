package com.commercial.Pont.Commercial.mappers;

import com.commercial.Pont.Commercial.dtos.requestDtos.IncotermAnnonceRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.IncotermAnnonceResponseDto;
import com.commercial.Pont.Commercial.mappers.ImplementationMappers.IncotermAnnonceMapperImpl;
import com.commercial.Pont.Commercial.models.Annonce;
import com.commercial.Pont.Commercial.models.Incoterm;
import com.commercial.Pont.Commercial.models.IncotermAnnonce;
import com.commercial.Pont.Commercial.repositories.AnnonceRepository;
import com.commercial.Pont.Commercial.repositories.IncotermRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class IncotermAnnonceMapperImplTest {

    @Mock private IncotermRepository incotermRepository;
    @Mock private AnnonceRepository annonceRepository;

    @InjectMocks
    private IncotermAnnonceMapperImpl mapper;

    @Test
    void nullInputs_ShouldReturnNull() {
        assertNull(mapper.requestToEntity(null));
        assertNull(mapper.entityToRequest(null));
        assertNull(mapper.entityToResponse(null));
        assertNull(mapper.responseToEntity(null));
    }

    @Test
    void requestToEntity_ShouldResolveRelations() {
        UUID incotermId = UUID.randomUUID();
        UUID annonceId = UUID.randomUUID();

        Incoterm incoterm = mock(Incoterm.class);
        Annonce annonce = mock(Annonce.class);
        IncotermAnnonceRequestDto dto = mock(IncotermAnnonceRequestDto.class);

        when(dto.getIncotermId()).thenReturn(incotermId);
        when(dto.getAnnonceId()).thenReturn(annonceId);
        when(incotermRepository.findById(incotermId)).thenReturn(Optional.of(incoterm));
        when(annonceRepository.findById(annonceId)).thenReturn(Optional.of(annonce));

        IncotermAnnonce result = mapper.requestToEntity(dto);

        assertSame(incoterm, result.getIncoterm());
        assertSame(annonce, result.getAnnonce());
    }

    @Test
    void entityToDtos_ShouldExtractRelationIds() {
        UUID incotermId = UUID.randomUUID();
        UUID annonceId = UUID.randomUUID();

        Incoterm incoterm = mock(Incoterm.class);
        Annonce annonce = mock(Annonce.class);
        when(incoterm.getIncotermId()).thenReturn(incotermId);
        when(annonce.getAnnonceId()).thenReturn(annonceId);

        IncotermAnnonce entity = mock(IncotermAnnonce.class);
        when(entity.getIncoterm()).thenReturn(incoterm);
        when(entity.getAnnonce()).thenReturn(annonce);

        IncotermAnnonceRequestDto request = mapper.entityToRequest(entity);
        IncotermAnnonceResponseDto response = mapper.entityToResponse(entity);

        assertEquals(incotermId, request.getIncotermId());
        assertEquals(annonceId, request.getAnnonceId());
        assertEquals(incotermId, response.getIncotermId());
        assertEquals(annonceId, response.getAnnonceId());
    }

    @Test
    void entityToDtos_WithoutRelations_ShouldReturnNullIds() {
        IncotermAnnonce entity = mock(IncotermAnnonce.class);

        assertNull(mapper.entityToRequest(entity).getIncotermId());
        assertNull(mapper.entityToRequest(entity).getAnnonceId());
        assertNull(mapper.entityToResponse(entity).getIncotermId());
        assertNull(mapper.entityToResponse(entity).getAnnonceId());
    }

    @Test
    void responseToEntity_ShouldResolveRelations() {
        UUID incotermId = UUID.randomUUID();
        UUID annonceId = UUID.randomUUID();

        Incoterm incoterm = mock(Incoterm.class);
        Annonce annonce = mock(Annonce.class);
        IncotermAnnonceResponseDto dto = mock(IncotermAnnonceResponseDto.class);

        when(dto.getIncotermId()).thenReturn(incotermId);
        when(dto.getAnnonceId()).thenReturn(annonceId);
        when(incotermRepository.findById(incotermId)).thenReturn(Optional.of(incoterm));
        when(annonceRepository.findById(annonceId)).thenReturn(Optional.of(annonce));

        IncotermAnnonce result = mapper.responseToEntity(dto);

        assertSame(incoterm, result.getIncoterm());
        assertSame(annonce, result.getAnnonce());
    }
}
