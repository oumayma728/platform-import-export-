package com.commercial.Pont.Commercial.services;

import com.commercial.Pont.Commercial.dtos.requestDtos.IncotermAnnonceRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.IncotermAnnonceResponseDto;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.IncotermAnnonceMapperInterface;
import com.commercial.Pont.Commercial.models.Annonce;
import com.commercial.Pont.Commercial.models.Incoterm;
import com.commercial.Pont.Commercial.models.IncotermAnnonce;
import com.commercial.Pont.Commercial.repositories.AnnonceRepository;
import com.commercial.Pont.Commercial.repositories.IncotermAnnonceRepository;
import com.commercial.Pont.Commercial.repositories.IncotermRepository;
import com.commercial.Pont.Commercial.services.ImplementationServices.IncotermAnnonceServiceImpl;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class IncotermAnnonceServiceImplTest {

    @Mock private IncotermAnnonceRepository incotermAnnonceRepository;
    @Mock private IncotermAnnonceMapperInterface incotermAnnonceMapper;
    @Mock private IncotermRepository incotermRepository;
    @Mock private AnnonceRepository annonceRepository;

    @InjectMocks
    private IncotermAnnonceServiceImpl service;

    private UUID incotermId;
    private UUID annonceId;
    private Incoterm incoterm;
    private Annonce annonce;

    @BeforeEach
    void setUp() {
        incotermId = UUID.randomUUID();
        annonceId = UUID.randomUUID();

        incoterm = new Incoterm();
        incoterm.setIncotermId(incotermId);

        annonce = new Annonce();
        annonce.setAnnonceId(annonceId);
    }

    @Test
    void create_ShouldCreateRelation() {
        IncotermAnnonceRequestDto request =
                mock(IncotermAnnonceRequestDto.class);
        IncotermAnnonce relation = new IncotermAnnonce();
        IncotermAnnonceResponseDto response =
                mock(IncotermAnnonceResponseDto.class);

        when(request.getIncotermId()).thenReturn(incotermId);
        when(request.getAnnonceId()).thenReturn(annonceId);
        when(incotermAnnonceMapper.requestToEntity(request))
                .thenReturn(relation);
        when(incotermRepository.findById(incotermId))
                .thenReturn(Optional.of(incoterm));
        when(annonceRepository.findById(annonceId))
                .thenReturn(Optional.of(annonce));
        when(incotermAnnonceRepository.save(relation))
                .thenReturn(relation);
        when(incotermAnnonceMapper.entityToResponse(relation))
                .thenReturn(response);

        assertSame(response, service.create(request));
        assertSame(incoterm, relation.getIncoterm());
        assertSame(annonce, relation.getAnnonce());
        assertNotNull(relation.getCreatedAt());
        assertNotNull(relation.getUpdatedAt());
    }

    @Test
    void create_ShouldThrow_WhenIncotermMissing() {
        IncotermAnnonceRequestDto request =
                mock(IncotermAnnonceRequestDto.class);

        when(request.getIncotermId()).thenReturn(incotermId);
        when(incotermAnnonceMapper.requestToEntity(request))
                .thenReturn(new IncotermAnnonce());
        when(incotermRepository.findById(incotermId))
                .thenReturn(Optional.empty());

        assertThrows(
                EntityNotFoundException.class,
                () -> service.create(request)
        );
    }

    @Test
    void create_ShouldThrow_WhenAnnonceMissing() {
        IncotermAnnonceRequestDto request =
                mock(IncotermAnnonceRequestDto.class);

        when(request.getIncotermId()).thenReturn(incotermId);
        when(request.getAnnonceId()).thenReturn(annonceId);
        when(incotermAnnonceMapper.requestToEntity(request))
                .thenReturn(new IncotermAnnonce());
        when(incotermRepository.findById(incotermId))
                .thenReturn(Optional.of(incoterm));
        when(annonceRepository.findById(annonceId))
                .thenReturn(Optional.empty());

        assertThrows(
                EntityNotFoundException.class,
                () -> service.create(request)
        );
    }

    @Test
    void update_ShouldChangeRelations() {
        UUID relationId = UUID.randomUUID();
        UUID newIncotermId = UUID.randomUUID();
        UUID newAnnonceId = UUID.randomUUID();

        Incoterm newIncoterm = new Incoterm();
        newIncoterm.setIncotermId(newIncotermId);

        Annonce newAnnonce = new Annonce();
        newAnnonce.setAnnonceId(newAnnonceId);

        IncotermAnnonce existing = new IncotermAnnonce();
        existing.setIncoterm(incoterm);
        existing.setAnnonce(annonce);

        IncotermAnnonceRequestDto request =
                mock(IncotermAnnonceRequestDto.class);
        when(request.getIncotermId()).thenReturn(newIncotermId);
        when(request.getAnnonceId()).thenReturn(newAnnonceId);

        when(incotermAnnonceRepository.findById(relationId))
                .thenReturn(Optional.of(existing));
        when(incotermRepository.findById(newIncotermId))
                .thenReturn(Optional.of(newIncoterm));
        when(annonceRepository.findById(newAnnonceId))
                .thenReturn(Optional.of(newAnnonce));
        when(incotermAnnonceRepository.save(existing))
                .thenReturn(existing);

        service.update(relationId, request);

        assertSame(newIncoterm, existing.getIncoterm());
        assertSame(newAnnonce, existing.getAnnonce());
        assertNotNull(existing.getUpdatedAt());
    }

    @Test
    void update_ShouldNotReload_WhenIdsAreSame() {
        UUID relationId = UUID.randomUUID();

        IncotermAnnonce existing = new IncotermAnnonce();
        existing.setIncoterm(incoterm);
        existing.setAnnonce(annonce);

        IncotermAnnonceRequestDto request =
                mock(IncotermAnnonceRequestDto.class);
        when(request.getIncotermId()).thenReturn(incotermId);
        when(request.getAnnonceId()).thenReturn(annonceId);

        when(incotermAnnonceRepository.findById(relationId))
                .thenReturn(Optional.of(existing));
        when(incotermAnnonceRepository.save(existing))
                .thenReturn(existing);

        service.update(relationId, request);

        verifyNoInteractions(incotermRepository, annonceRepository);
    }

    @Test
    void getById_ShouldReturnMappedRelation() {
        UUID id = UUID.randomUUID();
        IncotermAnnonce relation = new IncotermAnnonce();
        IncotermAnnonceResponseDto dto =
                mock(IncotermAnnonceResponseDto.class);

        when(incotermAnnonceRepository.findById(id))
                .thenReturn(Optional.of(relation));
        when(incotermAnnonceMapper.entityToResponse(relation))
                .thenReturn(dto);

        assertSame(dto, service.getById(id));
    }

    @Test
    void getById_ShouldThrow_WhenMissing() {
        UUID id = UUID.randomUUID();
        when(incotermAnnonceRepository.findById(id))
                .thenReturn(Optional.empty());

        assertThrows(
                EntityNotFoundException.class,
                () -> service.getById(id)
        );
    }

    @Test
    void getAll_ShouldMapAll() {
        when(incotermAnnonceRepository.findAll())
                .thenReturn(List.of(
                        new IncotermAnnonce(),
                        new IncotermAnnonce()
                ));
        when(incotermAnnonceMapper.entityToResponse(any()))
                .thenReturn(mock(IncotermAnnonceResponseDto.class));

        assertEquals(2, service.getAll().size());
    }

    @Test
    void delete_ShouldDelete_WhenExists() {
        UUID id = UUID.randomUUID();
        when(incotermAnnonceRepository.existsById(id))
                .thenReturn(true);

        service.delete(id);

        verify(incotermAnnonceRepository).deleteById(id);
    }

    @Test
    void delete_ShouldThrow_WhenMissing() {
        UUID id = UUID.randomUUID();
        when(incotermAnnonceRepository.existsById(id))
                .thenReturn(false);

        assertThrows(
                EntityNotFoundException.class,
                () -> service.delete(id)
        );
    }
}
