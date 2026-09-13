package com.commercial.Pont.Commercial.mappers;

import com.commercial.Pont.Commercial.dtos.requestDtos.DocumentAnnonceRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.DocumentAnnonceResponseDto;
import com.commercial.Pont.Commercial.mappers.ImplementationMappers.DocumentAnnonceMapperImpl;
import com.commercial.Pont.Commercial.models.Annonce;
import com.commercial.Pont.Commercial.models.DocumentAnnonce;
import com.commercial.Pont.Commercial.repositories.AnnonceRepository;
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
class DocumentAnnonceMapperImplTest {

    @Mock
    private AnnonceRepository annonceRepository;

    @InjectMocks
    private DocumentAnnonceMapperImpl mapper;

    @Test
    void nullInputs_ShouldReturnNull() {
        assertNull(mapper.requestToEntity(null));
        assertNull(mapper.entityToRequest(null));
        assertNull(mapper.entityToResponse(null));
        assertNull(mapper.responseToEntity(null));
    }

    @Test
    void requestToEntity_ShouldResolveAnnonce() {
        UUID annonceId = UUID.randomUUID();
        Annonce annonce = mock(Annonce.class);
        DocumentAnnonceRequestDto dto = mock(DocumentAnnonceRequestDto.class);

        when(dto.getAnnonceId()).thenReturn(annonceId);
        when(annonceRepository.findById(annonceId)).thenReturn(Optional.of(annonce));

        DocumentAnnonce result = mapper.requestToEntity(dto);

        assertSame(annonce, result.getAnnonce());
    }

    @Test
    void entityToDtos_ShouldExtractAnnonceId() {
        UUID annonceId = UUID.randomUUID();
        Annonce annonce = mock(Annonce.class);
        when(annonce.getAnnonceId()).thenReturn(annonceId);

        DocumentAnnonce document = mock(DocumentAnnonce.class);
        when(document.getAnnonce()).thenReturn(annonce);

        DocumentAnnonceRequestDto request = mapper.entityToRequest(document);
        DocumentAnnonceResponseDto response = mapper.entityToResponse(document);

        assertEquals(annonceId, request.getAnnonceId());
        assertEquals(annonceId, response.getAnnonceId());
    }

    @Test
    void entityToDtos_WithoutAnnonce_ShouldReturnNullAnnonceId() {
        DocumentAnnonce document = mock(DocumentAnnonce.class);

        assertNull(mapper.entityToRequest(document).getAnnonceId());
        assertNull(mapper.entityToResponse(document).getAnnonceId());
    }

    @Test
    void responseToEntity_ShouldResolveAnnonce() {
        UUID annonceId = UUID.randomUUID();
        Annonce annonce = mock(Annonce.class);
        DocumentAnnonceResponseDto dto = mock(DocumentAnnonceResponseDto.class);

        when(dto.getAnnonceId()).thenReturn(annonceId);
        when(annonceRepository.findById(annonceId)).thenReturn(Optional.of(annonce));

        DocumentAnnonce result = mapper.responseToEntity(dto);

        assertSame(annonce, result.getAnnonce());
    }
}
