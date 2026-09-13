package com.commercial.Pont.Commercial.services;


import com.commercial.Pont.Commercial.dtos.requestDtos.CategorieRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.CategorieResponseDto;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.CategorieMapperInterface;
import com.commercial.Pont.Commercial.models.Categorie;
import com.commercial.Pont.Commercial.repositories.CategorieRepository;
import com.commercial.Pont.Commercial.services.ImplementationServices.CategorieServiceImpl;
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
class CategorieServiceImplTest {

    @Mock
    private CategorieRepository categorieRepository;

    @Mock
    private CategorieMapperInterface categorieMapper;

    @InjectMocks
    private CategorieServiceImpl categorieService;


    private UUID categorieId;

    private Categorie categorie;

    private CategorieRequestDto requestDto;

    private CategorieResponseDto responseDto;


    @BeforeEach
    void setUp() {

        categorieId =
                UUID.randomUUID();

        categorie =
                new Categorie();

        requestDto =
                mock(CategorieRequestDto.class);

        responseDto =
                mock(CategorieResponseDto.class);
    }


    // =========================================================
    // CREATE
    // =========================================================

    @Test
    void create_ShouldCreateCategorieSuccessfully() {

        when(categorieMapper.requestToEntity(requestDto))
                .thenReturn(categorie);

        when(categorieRepository.save(categorie))
                .thenReturn(categorie);

        when(categorieMapper.entityToResponse(categorie))
                .thenReturn(responseDto);


        CategorieResponseDto result =
                categorieService.create(requestDto);


        assertNotNull(result);

        assertSame(
                responseDto,
                result
        );


        assertNotNull(
                categorie.getCreatedAt()
        );

        assertNotNull(
                categorie.getUpdatedAt()
        );


        verify(categorieMapper)
                .requestToEntity(requestDto);

        verify(categorieRepository)
                .save(categorie);

        verify(categorieMapper)
                .entityToResponse(categorie);
    }


    // =========================================================
    // UPDATE
    // =========================================================

    @Test
    void update_ShouldUpdateCategorieSuccessfully() {

        categorie.setCreatedAt(
                LocalDateTime.now()
                        .minusDays(10)
        );

        LocalDateTime originalCreatedAt =
                categorie.getCreatedAt();


        when(requestDto.getNom())
                .thenReturn("Agriculture");

        when(requestDto.getDescription())
                .thenReturn(
                        "Produits agricoles"
                );


        when(categorieRepository.findById(categorieId))
                .thenReturn(
                        Optional.of(categorie)
                );

        when(categorieRepository.save(categorie))
                .thenReturn(categorie);

        when(categorieMapper.entityToResponse(categorie))
                .thenReturn(responseDto);


        CategorieResponseDto result =
                categorieService.update(
                        categorieId,
                        requestDto
                );


        assertSame(
                responseDto,
                result
        );

        assertEquals(
                "Agriculture",
                categorie.getNom()
        );

        assertEquals(
                "Produits agricoles",
                categorie.getDescription()
        );


        /*
         * createdAt ne doit pas être modifié
         */
        assertEquals(
                originalCreatedAt,
                categorie.getCreatedAt()
        );


        assertNotNull(
                categorie.getUpdatedAt()
        );


        verify(categorieRepository)
                .findById(categorieId);

        verify(categorieRepository)
                .save(categorie);

        verify(categorieMapper)
                .entityToResponse(categorie);
    }


    @Test
    void update_ShouldThrowException_WhenCategorieDoesNotExist() {

        when(categorieRepository.findById(categorieId))
                .thenReturn(Optional.empty());


        EntityNotFoundException exception =
                assertThrows(
                        EntityNotFoundException.class,
                        () ->
                                categorieService.update(
                                        categorieId,
                                        requestDto
                                )
                );


        assertTrue(
                exception.getMessage()
                        .contains(categorieId.toString())
        );


        verify(categorieRepository)
                .findById(categorieId);

        verify(categorieRepository, never())
                .save(any());

        verifyNoInteractions(categorieMapper);
    }


    // =========================================================
    // GET BY ID
    // =========================================================

    @Test
    void getById_ShouldReturnCategorie_WhenCategorieExists() {

        when(categorieRepository.findById(categorieId))
                .thenReturn(
                        Optional.of(categorie)
                );

        when(categorieMapper.entityToResponse(categorie))
                .thenReturn(responseDto);


        CategorieResponseDto result =
                categorieService.getById(categorieId);


        assertSame(
                responseDto,
                result
        );


        verify(categorieRepository)
                .findById(categorieId);

        verify(categorieMapper)
                .entityToResponse(categorie);
    }


    @Test
    void getById_ShouldThrowException_WhenCategorieDoesNotExist() {

        when(categorieRepository.findById(categorieId))
                .thenReturn(Optional.empty());


        EntityNotFoundException exception =
                assertThrows(
                        EntityNotFoundException.class,
                        () ->
                                categorieService.getById(
                                        categorieId
                                )
                );


        assertTrue(
                exception.getMessage()
                        .contains(categorieId.toString())
        );


        verify(categorieRepository)
                .findById(categorieId);

        verifyNoInteractions(categorieMapper);
    }


    // =========================================================
    // GET ALL
    // =========================================================

    @Test
    void getAll_ShouldReturnAllCategories() {

        Categorie categorie2 =
                new Categorie();

        CategorieResponseDto responseDto2 =
                mock(CategorieResponseDto.class);


        when(categorieRepository.findAll())
                .thenReturn(
                        List.of(
                                categorie,
                                categorie2
                        )
                );


        when(categorieMapper.entityToResponse(categorie))
                .thenReturn(responseDto);

        when(categorieMapper.entityToResponse(categorie2))
                .thenReturn(responseDto2);


        List<CategorieResponseDto> result =
                categorieService.getAll();


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


        verify(categorieRepository)
                .findAll();

        verify(categorieMapper, times(2))
                .entityToResponse(any(Categorie.class));
    }


    @Test
    void getAll_ShouldReturnEmptyList_WhenNoCategorieExists() {

        when(categorieRepository.findAll())
                .thenReturn(List.of());


        List<CategorieResponseDto> result =
                categorieService.getAll();


        assertNotNull(result);

        assertTrue(result.isEmpty());

        verify(categorieRepository)
                .findAll();

        verifyNoInteractions(categorieMapper);
    }


    // =========================================================
    // DELETE
    // =========================================================

    @Test
    void delete_ShouldDeleteCategorie_WhenCategorieExists() {

        when(categorieRepository.existsById(categorieId))
                .thenReturn(true);


        categorieService.delete(categorieId);


        verify(categorieRepository)
                .existsById(categorieId);

        verify(categorieRepository)
                .deleteById(categorieId);
    }


    @Test
    void delete_ShouldThrowException_WhenCategorieDoesNotExist() {

        when(categorieRepository.existsById(categorieId))
                .thenReturn(false);


        EntityNotFoundException exception =
                assertThrows(
                        EntityNotFoundException.class,
                        () ->
                                categorieService.delete(
                                        categorieId
                                )
                );


        assertTrue(
                exception.getMessage()
                        .contains(categorieId.toString())
        );


        verify(categorieRepository)
                .existsById(categorieId);

        verify(categorieRepository, never())
                .deleteById(any());
    }
}