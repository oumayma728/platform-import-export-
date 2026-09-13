package com.commercial.Pont.Commercial.services;


import com.commercial.Pont.Commercial.dtos.requestDtos.EntrepriseRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.EntrepriseResponseDto;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.EntrepriseMapperInterface;
import com.commercial.Pont.Commercial.models.Entreprise;
import com.commercial.Pont.Commercial.models.Location;
import com.commercial.Pont.Commercial.repositories.EntrepriseRepository;
import com.commercial.Pont.Commercial.repositories.LocationRepository;
import com.commercial.Pont.Commercial.services.ImplementationServices.EntrepriseServiceImpl;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EntrepriseServiceImplTest {

    @Mock
    private EntrepriseRepository entrepriseRepository;

    @Mock
    private EntrepriseMapperInterface entrepriseMapper;

    @Mock
    private LocationRepository locationRepository;

    @InjectMocks
    private EntrepriseServiceImpl entrepriseService;


    private UUID entrepriseId;
    private UUID locationId;

    private Entreprise entreprise;
    private Location location;

    private EntrepriseRequestDto requestDto;
    private EntrepriseResponseDto responseDto;


    @BeforeEach
    void setUp() {

        entrepriseId = UUID.randomUUID();
        locationId = UUID.randomUUID();

        entreprise = new Entreprise();

        location = new Location();
        location.setLocationId(locationId);

        requestDto = mock(EntrepriseRequestDto.class);
        responseDto = mock(EntrepriseResponseDto.class);
    }


    // =========================================================
    // CREATE
    // =========================================================

    @Test
    void create_ShouldCreateEntrepriseSuccessfully() {

        when(requestDto.getLocationId())
                .thenReturn(locationId);

        when(entrepriseMapper.requestToEntity(requestDto))
                .thenReturn(entreprise);

        when(locationRepository.findById(locationId))
                .thenReturn(Optional.of(location));

        when(entrepriseRepository.save(entreprise))
                .thenReturn(entreprise);

        when(entrepriseMapper.entityToResponse(entreprise))
                .thenReturn(responseDto);


        EntrepriseResponseDto result =
                entrepriseService.create(requestDto);


        assertNotNull(result);
        assertSame(responseDto, result);

        assertSame(
                location,
                entreprise.getLocation()
        );

        assertNotNull(
                entreprise.getCreatedAt()
        );

        assertNotNull(
                entreprise.getUpdatedAt()
        );


        verify(entrepriseMapper)
                .requestToEntity(requestDto);

        verify(locationRepository)
                .findById(locationId);

        verify(entrepriseRepository)
                .save(entreprise);

        verify(entrepriseMapper)
                .entityToResponse(entreprise);
    }


    @Test
    void create_ShouldThrowException_WhenLocationDoesNotExist() {

        when(requestDto.getLocationId())
                .thenReturn(locationId);

        when(entrepriseMapper.requestToEntity(requestDto))
                .thenReturn(entreprise);

        when(locationRepository.findById(locationId))
                .thenReturn(Optional.empty());


        EntityNotFoundException exception =
                assertThrows(
                        EntityNotFoundException.class,
                        () -> entrepriseService.create(requestDto)
                );


        assertTrue(
                exception.getMessage()
                        .contains(locationId.toString())
        );

        verify(locationRepository)
                .findById(locationId);

        verify(entrepriseRepository, never())
                .save(any());
    }


    // =========================================================
    // UPDATE
    // =========================================================

    @Test
    void update_ShouldUpdateEntrepriseWithoutChangingLocation() {

        entreprise.setLocation(location);

        LocalDateTime oldUpdatedAt =
                LocalDateTime.now()
                        .minusDays(1);

        entreprise.setUpdatedAt(oldUpdatedAt);


        when(requestDto.getNom())
                .thenReturn("Entreprise Updated");

        when(requestDto.getSiret())
                .thenReturn("SIRET-123");

        when(requestDto.getLocationId())
                .thenReturn(locationId);


        when(entrepriseRepository.findById(entrepriseId))
                .thenReturn(Optional.of(entreprise));

        when(entrepriseRepository.save(entreprise))
                .thenReturn(entreprise);

        when(entrepriseMapper.entityToResponse(entreprise))
                .thenReturn(responseDto);


        EntrepriseResponseDto result =
                entrepriseService.update(
                        entrepriseId,
                        requestDto
                );


        assertSame(
                responseDto,
                result
        );

        assertEquals(
                "Entreprise Updated",
                entreprise.getNom()
        );

        assertEquals(
                "SIRET-123",
                entreprise.getSiret()
        );

        assertSame(
                location,
                entreprise.getLocation()
        );

        assertNotNull(
                entreprise.getUpdatedAt()
        );

        assertTrue(
                entreprise.getUpdatedAt()
                        .isAfter(oldUpdatedAt)
        );


        /*
         * La location n'a pas changé,
         * donc aucun nouvel accès DB.
         */
        verify(locationRepository, never())
                .findById(any());

        verify(entrepriseRepository)
                .save(entreprise);
    }


    @Test
    void update_ShouldChangeLocation_WhenLocationIdChanged() {

        UUID newLocationId =
                UUID.randomUUID();

        Location newLocation =
                new Location();

        newLocation.setLocationId(
                newLocationId
        );


        entreprise.setLocation(
                location
        );


        when(requestDto.getLocationId())
                .thenReturn(newLocationId);

        when(entrepriseRepository.findById(entrepriseId))
                .thenReturn(Optional.of(entreprise));

        when(locationRepository.findById(newLocationId))
                .thenReturn(Optional.of(newLocation));

        when(entrepriseRepository.save(entreprise))
                .thenReturn(entreprise);

        when(entrepriseMapper.entityToResponse(entreprise))
                .thenReturn(responseDto);


        EntrepriseResponseDto result =
                entrepriseService.update(
                        entrepriseId,
                        requestDto
                );


        assertSame(
                responseDto,
                result
        );

        assertSame(
                newLocation,
                entreprise.getLocation()
        );


        verify(locationRepository)
                .findById(newLocationId);

        verify(entrepriseRepository)
                .save(entreprise);
    }


    @Test
    void update_ShouldThrowException_WhenNewLocationDoesNotExist() {

        UUID newLocationId =
                UUID.randomUUID();

        entreprise.setLocation(
                location
        );


        when(requestDto.getLocationId())
                .thenReturn(newLocationId);

        when(entrepriseRepository.findById(entrepriseId))
                .thenReturn(Optional.of(entreprise));

        when(locationRepository.findById(newLocationId))
                .thenReturn(Optional.empty());


        EntityNotFoundException exception =
                assertThrows(
                        EntityNotFoundException.class,
                        () ->
                                entrepriseService.update(
                                        entrepriseId,
                                        requestDto
                                )
                );


        assertTrue(
                exception.getMessage()
                        .contains(newLocationId.toString())
        );

        verify(entrepriseRepository, never())
                .save(any());
    }


    @Test
    void update_ShouldThrowException_WhenEntrepriseDoesNotExist() {

        when(entrepriseRepository.findById(entrepriseId))
                .thenReturn(Optional.empty());


        EntityNotFoundException exception =
                assertThrows(
                        EntityNotFoundException.class,
                        () ->
                                entrepriseService.update(
                                        entrepriseId,
                                        requestDto
                                )
                );


        assertTrue(
                exception.getMessage()
                        .contains(entrepriseId.toString())
        );

        verify(entrepriseRepository, never())
                .save(any());

        verifyNoInteractions(
                locationRepository
        );
    }


    // =========================================================
    // GET BY ID
    // =========================================================

    @Test
    void getById_ShouldReturnEntreprise_WhenExists() {

        when(entrepriseRepository.findById(entrepriseId))
                .thenReturn(Optional.of(entreprise));

        when(entrepriseMapper.entityToResponse(entreprise))
                .thenReturn(responseDto);


        EntrepriseResponseDto result =
                entrepriseService.getById(
                        entrepriseId
                );


        assertSame(
                responseDto,
                result
        );

        verify(entrepriseRepository)
                .findById(entrepriseId);

        verify(entrepriseMapper)
                .entityToResponse(entreprise);
    }


    @Test
    void getById_ShouldThrowException_WhenEntrepriseDoesNotExist() {

        when(entrepriseRepository.findById(entrepriseId))
                .thenReturn(Optional.empty());


        EntityNotFoundException exception =
                assertThrows(
                        EntityNotFoundException.class,
                        () ->
                                entrepriseService.getById(
                                        entrepriseId
                                )
                );


        assertTrue(
                exception.getMessage()
                        .contains(entrepriseId.toString())
        );

        verifyNoInteractions(
                entrepriseMapper
        );
    }


    // =========================================================
    // GET ALL
    // =========================================================

    @Test
    void getAll_ShouldReturnAllEntreprises() {

        Entreprise entreprise2 =
                new Entreprise();

        EntrepriseResponseDto responseDto2 =
                mock(EntrepriseResponseDto.class);


        when(entrepriseRepository.findAll())
                .thenReturn(
                        List.of(
                                entreprise,
                                entreprise2
                        )
                );

        when(entrepriseMapper.entityToResponse(entreprise))
                .thenReturn(responseDto);

        when(entrepriseMapper.entityToResponse(entreprise2))
                .thenReturn(responseDto2);


        List<EntrepriseResponseDto> result =
                entrepriseService.getAll();


        assertNotNull(result);

        assertEquals(
                2,
                result.size()
        );

        assertSame(
                responseDto,
                result.get(0)
        );

        assertSame(
                responseDto2,
                result.get(1)
        );

        verify(entrepriseRepository)
                .findAll();

        verify(entrepriseMapper, times(2))
                .entityToResponse(
                        any(Entreprise.class)
                );
    }


    @Test
    void getAll_ShouldReturnEmptyList_WhenNoEntrepriseExists() {

        when(entrepriseRepository.findAll())
                .thenReturn(List.of());


        List<EntrepriseResponseDto> result =
                entrepriseService.getAll();


        assertNotNull(result);
        assertTrue(result.isEmpty());

        verify(entrepriseRepository)
                .findAll();

        verifyNoInteractions(
                entrepriseMapper
        );
    }


    // =========================================================
    // DELETE
    // =========================================================

    @Test
    void delete_ShouldDeleteEntreprise_WhenExists() {

        when(entrepriseRepository.existsById(entrepriseId))
                .thenReturn(true);


        entrepriseService.delete(
                entrepriseId
        );


        verify(entrepriseRepository)
                .existsById(entrepriseId);

        verify(entrepriseRepository)
                .deleteById(entrepriseId);
    }


    @Test
    void delete_ShouldThrowException_WhenEntrepriseDoesNotExist() {

        when(entrepriseRepository.existsById(entrepriseId))
                .thenReturn(false);


        EntityNotFoundException exception =
                assertThrows(
                        EntityNotFoundException.class,
                        () ->
                                entrepriseService.delete(
                                        entrepriseId
                                )
                );


        assertTrue(
                exception.getMessage()
                        .contains(entrepriseId.toString())
        );

        verify(entrepriseRepository, never())
                .deleteById(any());
    }
}