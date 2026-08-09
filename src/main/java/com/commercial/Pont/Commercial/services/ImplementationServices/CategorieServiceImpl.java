package com.commercial.Pont.Commercial.services.ImplementationServices;

import com.commercial.Pont.Commercial.dtos.requestDtos.CategorieRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.CategorieResponseDto;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.CategorieMapperInterface;
import com.commercial.Pont.Commercial.models.Categorie;
import com.commercial.Pont.Commercial.repositories.CategorieRepository;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.CategorieServiceInterface;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class CategorieServiceImpl implements CategorieServiceInterface {

    private final CategorieRepository categorieRepository;
    private final CategorieMapperInterface categorieMapper;


    // =========================
    // CREATE
    // =========================

    @Override
    public CategorieResponseDto create(
            CategorieRequestDto categorieRequestDto
    ) {

        Categorie categorie =
                categorieMapper.requestToEntity(categorieRequestDto);

        LocalDateTime now = LocalDateTime.now();

        categorie.setCreatedAt(now);
        categorie.setUpdatedAt(now);

        Categorie savedCategorie =
                categorieRepository.save(categorie);

        return categorieMapper.entityToResponse(
                savedCategorie
        );
    }


    // =========================
    // UPDATE
    // =========================

    @Override
    public CategorieResponseDto update(
            UUID categorieId,
            CategorieRequestDto categorieRequestDto
    ) {

        Categorie existingCategorie =
                categorieRepository.findById(categorieId)
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Catégorie non trouvée avec l'id : "
                                                + categorieId
                                )
                        );


        existingCategorie.setNom(
                categorieRequestDto.getNom()
        );

        existingCategorie.setDescription(
                categorieRequestDto.getDescription()
        );


        // La date de création ne doit pas être modifiée

        existingCategorie.setUpdatedAt(
                LocalDateTime.now()
        );


        Categorie updatedCategorie =
                categorieRepository.save(existingCategorie);

        return categorieMapper.entityToResponse(
                updatedCategorie
        );
    }


    // =========================
    // GET BY ID
    // =========================

    @Override
    @Transactional(readOnly = true)
    public CategorieResponseDto getById(
            UUID categorieId
    ) {

        Categorie categorie =
                categorieRepository.findById(categorieId)
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Catégorie non trouvée avec l'id : "
                                                + categorieId
                                )
                        );

        return categorieMapper.entityToResponse(
                categorie
        );
    }


    // =========================
    // GET ALL
    // =========================

    @Override
    @Transactional(readOnly = true)
    public List<CategorieResponseDto> getAll() {

        return categorieRepository.findAll()
                .stream()
                .map(categorieMapper::entityToResponse)
                .toList();
    }


    // =========================
    // DELETE
    // =========================

    @Override
    public void delete(
            UUID categorieId
    ) {

        if (!categorieRepository.existsById(categorieId)) {

            throw new EntityNotFoundException(
                    "Catégorie non trouvée avec l'id : "
                            + categorieId
            );
        }

        categorieRepository.deleteById(
                categorieId
        );
    }
}