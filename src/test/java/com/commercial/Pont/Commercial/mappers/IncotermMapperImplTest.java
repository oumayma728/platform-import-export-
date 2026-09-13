package com.commercial.Pont.Commercial.mappers;

import com.commercial.Pont.Commercial.dtos.requestDtos.IncotermRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.IncotermResponseDto;
import com.commercial.Pont.Commercial.mappers.ImplementationMappers.IncotermMapperImpl;
import com.commercial.Pont.Commercial.models.Incoterm;
import com.commercial.Pont.Commercial.models.IncotermAnnonce;
import com.commercial.Pont.Commercial.repositories.IncotermAnnonceRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class IncotermMapperImplTest {

    @Mock
    private IncotermAnnonceRepository incotermAnnonceRepository;

    @InjectMocks
    private IncotermMapperImpl mapper;

    @Test
    void nullInputs_ShouldReturnNull() {
        assertNull(mapper.requestToEntity(null));
        assertNull(mapper.entityToRequest(null));
        assertNull(mapper.entityToResponse(null));
        assertNull(mapper.responseToEntity(null));
    }

    @Test
    void requestToEntity_ShouldResolveIncotermAnnonces() {
        UUID id = UUID.randomUUID();
        IncotermAnnonce relation = mock(IncotermAnnonce.class);
        IncotermRequestDto dto = mock(IncotermRequestDto.class);

        when(dto.getIncotermAnnonceIds()).thenReturn(Set.of(id));
        when(incotermAnnonceRepository.findAllById(Set.of(id)))
                .thenReturn(List.of(relation));

        Incoterm result = mapper.requestToEntity(dto);

        assertEquals(Set.of(relation), result.getIncoterms());
    }

    @Test
    void requestToEntity_WithoutRelations_ShouldUseEmptySet() {
        IncotermRequestDto dto = mock(IncotermRequestDto.class);

        Incoterm result = mapper.requestToEntity(dto);

        assertNotNull(result);
        assertTrue(result.getIncoterms().isEmpty());
    }

    @Test
    void entityToDtos_ShouldExtractRelationIds() {
        UUID id = UUID.randomUUID();
        IncotermAnnonce relation = mock(IncotermAnnonce.class);
        when(relation.getIncotermAnnonceId()).thenReturn(id);

        Incoterm incoterm = mock(Incoterm.class);
        when(incoterm.getIncoterms()).thenReturn(Set.of(relation));

        IncotermRequestDto request = mapper.entityToRequest(incoterm);
        IncotermResponseDto response = mapper.entityToResponse(incoterm);

        assertEquals(Set.of(id), request.getIncotermAnnonceIds());
        assertEquals(Set.of(id), response.getIncotermAnnonceIds());
    }

    @Test
    void responseToEntity_ShouldResolveRelations() {
        UUID id = UUID.randomUUID();
        IncotermAnnonce relation = mock(IncotermAnnonce.class);
        IncotermResponseDto dto = mock(IncotermResponseDto.class);

        when(dto.getIncotermAnnonceIds()).thenReturn(Set.of(id));
        when(incotermAnnonceRepository.findAllById(Set.of(id)))
                .thenReturn(List.of(relation));

        Incoterm result = mapper.responseToEntity(dto);

        assertEquals(Set.of(relation), result.getIncoterms());
    }
}
