package com.commercial.Pont.Commercial.services;

import com.commercial.Pont.Commercial.dtos.requestDtos.IncotermRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.IncotermResponseDto;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.IncotermMapperInterface;
import com.commercial.Pont.Commercial.models.Incoterm;
import com.commercial.Pont.Commercial.repositories.IncotermRepository;
import com.commercial.Pont.Commercial.services.ImplementationServices.IncotermServiceImpl;
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
class IncotermServiceImplTest {

    @Mock
    private IncotermRepository incotermRepository;

    @Mock
    private IncotermMapperInterface incotermMapper;

    @InjectMocks
    private IncotermServiceImpl incotermService;


    private UUID incotermId;

    private Incoterm incoterm;

    private IncotermRequestDto requestDto;

    private IncotermResponseDto responseDto;


    @BeforeEach
    void setUp() {

        incotermId =
                UUID.randomUUID();

        incoterm =
                new Incoterm();

        requestDto =
                mock(IncotermRequestDto.class);

        responseDto =
                mock(IncotermResponseDto.class);
    }


    // =========================================================
    // CREATE
    // =========================================================

    @Test
    void create_ShouldCreateIncotermSuccessfully() {

        when(incotermMapper.requestToEntity(requestDto))
                .thenReturn(incoterm);

        when(incotermRepository.save(incoterm))
                .thenReturn(incoterm);

        when(incotermMapper.entityToResponse(incoterm))
                .thenReturn(responseDto);


        IncotermResponseDto result =
                incotermService.create(
                        requestDto
                );


        assertNotNull(result);

        assertSame(
                responseDto,
                result
        );

        assertNotNull(
                incoterm.getCreatedAt()
        );

        assertNotNull(
                incoterm.getUpdatedAt()
        );


        verify(incotermMapper)
                .requestToEntity(requestDto);

        verify(incotermRepository)
                .save(incoterm);

        verify(incotermMapper)
                .entityToResponse(incoterm);
    }


    // =========================================================
    // UPDATE
    // =========================================================

    @Test
    void update_ShouldUpdateIncotermSuccessfully() {

        LocalDateTime createdAt =
                LocalDateTime.now()
                        .minusDays(10);

        LocalDateTime oldUpdatedAt =
                LocalDateTime.now()
                        .minusDays(1);

        incoterm.setCreatedAt(
                createdAt
        );

        incoterm.setUpdatedAt(
                oldUpdatedAt
        );


        when(requestDto.getCode())
                .thenReturn("FOB");

        when(requestDto.getNom())
                .thenReturn(
                        "Free On Board"
                );

        when(requestDto.getDescription())
                .thenReturn(
                        "Description FOB"
                );


        when(incotermRepository.findById(incotermId))
                .thenReturn(
                        Optional.of(incoterm)
                );

        when(incotermRepository.save(incoterm))
                .thenReturn(incoterm);

        when(incotermMapper.entityToResponse(incoterm))
                .thenReturn(responseDto);


        IncotermResponseDto result =
                incotermService.update(
                        incotermId,
                        requestDto
                );


        assertSame(
                responseDto,
                result
        );

        assertEquals(
                "FOB",
                incoterm.getCode()
        );

        assertEquals(
                "Free On Board",
                incoterm.getNom()
        );

        assertEquals(
                "Description FOB",
                incoterm.getDescription()
        );


        /*
         * createdAt ne doit pas changer.
         */
        assertEquals(
                createdAt,
                incoterm.getCreatedAt()
        );


        /*
         * updatedAt doit être changé.
         */
        assertTrue(
                incoterm.getUpdatedAt()
                        .isAfter(oldUpdatedAt)
        );


        verify(incotermRepository)
                .findById(incotermId);

        verify(incotermRepository)
                .save(incoterm);

        verify(incotermMapper)
                .entityToResponse(incoterm);
    }


    @Test
    void update_ShouldThrowException_WhenIncotermDoesNotExist() {

        when(incotermRepository.findById(incotermId))
                .thenReturn(
                        Optional.empty()
                );


        EntityNotFoundException exception =
                assertThrows(
                        EntityNotFoundException.class,
                        () ->
                                incotermService.update(
                                        incotermId,
                                        requestDto
                                )
                );


        assertTrue(
                exception.getMessage()
                        .contains(incotermId.toString())
        );

        verify(incotermRepository, never())
                .save(any());

        verifyNoInteractions(
                incotermMapper
        );
    }


    // =========================================================
    // GET BY ID
    // =========================================================

    @Test
    void getById_ShouldReturnIncoterm_WhenExists() {

        when(incotermRepository.findById(incotermId))
                .thenReturn(
                        Optional.of(incoterm)
                );

        when(incotermMapper.entityToResponse(incoterm))
                .thenReturn(responseDto);


        IncotermResponseDto result =
                incotermService.getById(
                        incotermId
                );


        assertSame(
                responseDto,
                result
        );

        verify(incotermRepository)
                .findById(incotermId);

        verify(incotermMapper)
                .entityToResponse(incoterm);
    }


    @Test
    void getById_ShouldThrowException_WhenIncotermDoesNotExist() {

        when(incotermRepository.findById(incotermId))
                .thenReturn(
                        Optional.empty()
                );


        EntityNotFoundException exception =
                assertThrows(
                        EntityNotFoundException.class,
                        () ->
                                incotermService.getById(
                                        incotermId
                                )
                );


        assertTrue(
                exception.getMessage()
                        .contains(incotermId.toString())
        );

        verifyNoInteractions(
                incotermMapper
        );
    }


    // =========================================================
    // GET ALL
    // =========================================================

    @Test
    void getAll_ShouldReturnAllIncoterms() {

        Incoterm incoterm2 =
                new Incoterm();

        IncotermResponseDto responseDto2 =
                mock(IncotermResponseDto.class);


        when(incotermRepository.findAll())
                .thenReturn(
                        List.of(
                                incoterm,
                                incoterm2
                        )
                );

        when(incotermMapper.entityToResponse(incoterm))
                .thenReturn(responseDto);

        when(incotermMapper.entityToResponse(incoterm2))
                .thenReturn(responseDto2);


        List<IncotermResponseDto> result =
                incotermService.getAll();


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


        verify(incotermRepository)
                .findAll();

        verify(incotermMapper, times(2))
                .entityToResponse(
                        any(Incoterm.class)
                );
    }


    @Test
    void getAll_ShouldReturnEmptyList_WhenNoIncotermExists() {

        when(incotermRepository.findAll())
                .thenReturn(
                        List.of()
                );


        List<IncotermResponseDto> result =
                incotermService.getAll();


        assertNotNull(result);

        assertTrue(
                result.isEmpty()
        );

        verify(incotermRepository)
                .findAll();

        verifyNoInteractions(
                incotermMapper
        );
    }


    // =========================================================
    // DELETE
    // =========================================================

    @Test
    void delete_ShouldDeleteIncoterm_WhenExists() {

        when(incotermRepository.existsById(incotermId))
                .thenReturn(true);


        incotermService.delete(
                incotermId
        );


        verify(incotermRepository)
                .existsById(incotermId);

        verify(incotermRepository)
                .deleteById(incotermId);
    }


    @Test
    void delete_ShouldThrowException_WhenIncotermDoesNotExist() {

        when(incotermRepository.existsById(incotermId))
                .thenReturn(false);


        EntityNotFoundException exception =
                assertThrows(
                        EntityNotFoundException.class,
                        () ->
                                incotermService.delete(
                                        incotermId
                                )
                );


        assertTrue(
                exception.getMessage()
                        .contains(incotermId.toString())
        );

        verify(incotermRepository)
                .existsById(incotermId);

        verify(incotermRepository, never())
                .deleteById(any());
    }
}