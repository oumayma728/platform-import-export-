package com.commercial.Pont.Commercial.services;

import com.commercial.Pont.Commercial.dtos.requestDtos.LocationRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.LocationResponseDto;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.LocationMapperInterface;
import com.commercial.Pont.Commercial.models.Location;
import com.commercial.Pont.Commercial.repositories.LocationRepository;
import com.commercial.Pont.Commercial.services.ImplementationServices.LocationServiceImpl;
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
class LocationServiceImplTest {

    @Mock
    private LocationRepository locationRepository;

    @Mock
    private LocationMapperInterface locationMapper;

    @InjectMocks
    private LocationServiceImpl locationService;


    private UUID locationId;

    private Location location;

    private LocationRequestDto requestDto;

    private LocationResponseDto responseDto;


    @BeforeEach
    void setUp() {

        locationId = UUID.randomUUID();

        location = new Location();
        location.setLocationId(locationId);

        requestDto =
                mock(LocationRequestDto.class);

        responseDto =
                mock(LocationResponseDto.class);
    }


    // =========================================================
    // CREATE
    // =========================================================

    @Test
    void create_ShouldCreateLocationSuccessfully() {

        when(locationMapper.requestToEntity(requestDto))
                .thenReturn(location);

        when(locationRepository.save(location))
                .thenReturn(location);

        when(locationMapper.entityToResponse(location))
                .thenReturn(responseDto);


        LocationResponseDto result =
                locationService.create(requestDto);


        assertNotNull(result);

        assertSame(
                responseDto,
                result
        );


        verify(locationMapper)
                .requestToEntity(requestDto);

        verify(locationRepository)
                .save(location);

        verify(locationMapper)
                .entityToResponse(location);
    }


    @Test
    void create_ShouldThrowIllegalArgumentException_WhenRequestIsNull() {

        IllegalArgumentException exception =
                assertThrows(
                        IllegalArgumentException.class,
                        () ->
                                locationService.create(null)
                );


        assertEquals(
                "Les données de la location sont obligatoires",
                exception.getMessage()
        );


        verifyNoInteractions(
                locationRepository,
                locationMapper
        );
    }


    // =========================================================
    // UPDATE
    // =========================================================

    @Test
    void update_ShouldUpdateLocationSuccessfully() {

        when(requestDto.getPays())
                .thenReturn("Maroc");

        when(requestDto.getVille())
                .thenReturn("Agadir");

        when(requestDto.getCodePostal())
                .thenReturn("80000");

        when(requestDto.getAdresse())
                .thenReturn("Hay Mohammadi");

        when(requestDto.getRegion())
                .thenReturn("Souss-Massa");


        when(locationRepository.findById(locationId))
                .thenReturn(
                        Optional.of(location)
                );

        when(locationRepository.save(location))
                .thenReturn(location);

        when(locationMapper.entityToResponse(location))
                .thenReturn(responseDto);


        LocationResponseDto result =
                locationService.update(
                        locationId,
                        requestDto
                );


        assertSame(
                responseDto,
                result
        );


        assertEquals(
                "Maroc",
                location.getPays()
        );

        assertEquals(
                "Agadir",
                location.getVille()
        );

        assertEquals(
                "80000",
                location.getCodePostal()
        );

        assertEquals(
                "Hay Mohammadi",
                location.getAdresse()
        );

        assertEquals(
                "Souss-Massa",
                location.getRegion()
        );


        verify(locationRepository)
                .findById(locationId);

        verify(locationRepository)
                .save(location);

        verify(locationMapper)
                .entityToResponse(location);
    }


    @Test
    void update_ShouldThrowIllegalArgumentException_WhenIdIsNull() {

        IllegalArgumentException exception =
                assertThrows(
                        IllegalArgumentException.class,
                        () ->
                                locationService.update(
                                        null,
                                        requestDto
                                )
                );


        assertEquals(
                "L'identifiant de la location est obligatoire",
                exception.getMessage()
        );


        verifyNoInteractions(
                locationRepository
        );
    }


    @Test
    void update_ShouldThrowIllegalArgumentException_WhenRequestIsNull() {

        IllegalArgumentException exception =
                assertThrows(
                        IllegalArgumentException.class,
                        () ->
                                locationService.update(
                                        locationId,
                                        null
                                )
                );


        assertEquals(
                "Les données de la location sont obligatoires",
                exception.getMessage()
        );


        verifyNoInteractions(
                locationRepository
        );
    }


    @Test
    void update_ShouldThrowEntityNotFoundException_WhenLocationDoesNotExist() {

        when(locationRepository.findById(locationId))
                .thenReturn(
                        Optional.empty()
                );


        EntityNotFoundException exception =
                assertThrows(
                        EntityNotFoundException.class,
                        () ->
                                locationService.update(
                                        locationId,
                                        requestDto
                                )
                );


        assertTrue(
                exception.getMessage()
                        .contains(locationId.toString())
        );


        verify(locationRepository)
                .findById(locationId);

        verify(locationRepository, never())
                .save(any());

        verifyNoInteractions(
                locationMapper
        );
    }


    // =========================================================
    // GET BY ID
    // =========================================================

    @Test
    void getById_ShouldReturnLocation_WhenLocationExists() {

        when(locationRepository.findById(locationId))
                .thenReturn(
                        Optional.of(location)
                );

        when(locationMapper.entityToResponse(location))
                .thenReturn(responseDto);


        LocationResponseDto result =
                locationService.getById(
                        locationId
                );


        assertSame(
                responseDto,
                result
        );


        verify(locationRepository)
                .findById(locationId);

        verify(locationMapper)
                .entityToResponse(location);
    }


    @Test
    void getById_ShouldThrowIllegalArgumentException_WhenIdIsNull() {

        IllegalArgumentException exception =
                assertThrows(
                        IllegalArgumentException.class,
                        () ->
                                locationService.getById(null)
                );


        assertEquals(
                "L'identifiant de la location est obligatoire",
                exception.getMessage()
        );


        verifyNoInteractions(
                locationRepository,
                locationMapper
        );
    }


    @Test
    void getById_ShouldThrowEntityNotFoundException_WhenLocationDoesNotExist() {

        when(locationRepository.findById(locationId))
                .thenReturn(
                        Optional.empty()
                );


        EntityNotFoundException exception =
                assertThrows(
                        EntityNotFoundException.class,
                        () ->
                                locationService.getById(
                                        locationId
                                )
                );


        assertTrue(
                exception.getMessage()
                        .contains(locationId.toString())
        );


        verify(locationRepository)
                .findById(locationId);

        verifyNoInteractions(
                locationMapper
        );
    }


    // =========================================================
    // GET ALL
    // =========================================================

    @Test
    void getAll_ShouldReturnAllLocations() {

        Location location2 =
                new Location();

        LocationResponseDto responseDto2 =
                mock(LocationResponseDto.class);


        when(locationRepository.findAll())
                .thenReturn(
                        List.of(
                                location,
                                location2
                        )
                );

        when(locationMapper.entityToResponse(location))
                .thenReturn(responseDto);

        when(locationMapper.entityToResponse(location2))
                .thenReturn(responseDto2);


        List<LocationResponseDto> result =
                locationService.getAll();


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


        verify(locationRepository)
                .findAll();

        verify(locationMapper, times(2))
                .entityToResponse(
                        any(Location.class)
                );
    }


    @Test
    void getAll_ShouldReturnEmptyList_WhenNoLocationExists() {

        when(locationRepository.findAll())
                .thenReturn(
                        List.of()
                );


        List<LocationResponseDto> result =
                locationService.getAll();


        assertNotNull(result);

        assertTrue(
                result.isEmpty()
        );


        verify(locationRepository)
                .findAll();

        verifyNoInteractions(
                locationMapper
        );
    }


    // =========================================================
    // DELETE
    // =========================================================

    @Test
    void delete_ShouldDeleteLocationSuccessfully() {

        when(locationRepository.findById(locationId))
                .thenReturn(
                        Optional.of(location)
                );


        locationService.delete(
                locationId
        );


        verify(locationRepository)
                .findById(locationId);

        verify(locationRepository)
                .delete(location);
    }


    @Test
    void delete_ShouldThrowIllegalArgumentException_WhenIdIsNull() {

        IllegalArgumentException exception =
                assertThrows(
                        IllegalArgumentException.class,
                        () ->
                                locationService.delete(null)
                );


        assertEquals(
                "L'identifiant de la location est obligatoire",
                exception.getMessage()
        );


        verifyNoInteractions(
                locationRepository
        );
    }


    @Test
    void delete_ShouldThrowEntityNotFoundException_WhenLocationDoesNotExist() {

        when(locationRepository.findById(locationId))
                .thenReturn(
                        Optional.empty()
                );


        EntityNotFoundException exception =
                assertThrows(
                        EntityNotFoundException.class,
                        () ->
                                locationService.delete(
                                        locationId
                                )
                );


        assertTrue(
                exception.getMessage()
                        .contains(locationId.toString())
        );


        verify(locationRepository)
                .findById(locationId);

        verify(locationRepository, never())
                .delete(any());
    }
}