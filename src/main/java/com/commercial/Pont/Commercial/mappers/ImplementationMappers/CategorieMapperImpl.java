package com.commercial.Pont.Commercial.mappers.ImplementationMappers;

import com.commercial.Pont.Commercial.dtos.requestDtos.CategorieRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.CategorieResponseDto;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.CategorieMapperInterface;
import com.commercial.Pont.Commercial.models.Annonce;
import com.commercial.Pont.Commercial.models.Categorie;
import com.commercial.Pont.Commercial.repositories.AnnonceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class CategorieMapperImpl implements CategorieMapperInterface {

    private final AnnonceRepository annonceRepository;


    /**
     * ============================================================
     * REQUEST DTO -> ENTITY
     * ============================================================
     *
     * Convertit :
     *
     * CategorieRequestDto
     *          ↓
     * Categorie
     *
     * Les annonceIds sont recherchés dans la base de données
     * grâce à AnnonceRepository.
     */
    @Override
    public Categorie requestToEntity(
            CategorieRequestDto categorieRequestDto) {

        if (categorieRequestDto == null) {
            return null;
        }

        /*
         * ========================================================
         * Récupération des Annonces
         * ========================================================
         */
        List<Annonce> annonces = Collections.emptyList();

        if (categorieRequestDto.getAnnonceIds() != null
                && !categorieRequestDto.getAnnonceIds().isEmpty()) {

            annonces = annonceRepository.findAllById(
                    categorieRequestDto.getAnnonceIds()
            );
        }

        /*
         * ========================================================
         * Construction de l'entité Categorie
         * ========================================================
         */
        return Categorie.builder()
                .nom(categorieRequestDto.getNom())
                .description(categorieRequestDto.getDescription())
                .createdAt(categorieRequestDto.getCreatedAt())
                .updatedAt(categorieRequestDto.getUpdatedAt())
                .annonces(annonces)
                .build();
    }


    /**
     * ============================================================
     * ENTITY -> REQUEST DTO
     * ============================================================
     *
     * Convertit :
     *
     * Categorie
     *      ↓
     * CategorieRequestDto
     *
     * Les objets Annonce sont convertis en leurs UUID.
     */
    @Override
    public CategorieRequestDto entityToRequest(
            Categorie categorie) {

        if (categorie == null) {
            return null;
        }

        /*
         * ========================================================
         * Extraction des IDs des Annonces
         * ========================================================
         */
        List<UUID> annonceIds = Collections.emptyList();

        if (categorie.getAnnonces() != null) {

            annonceIds = categorie.getAnnonces()
                    .stream()
                    .map(Annonce::getAnnonceId)
                    .collect(Collectors.toList());
        }

        /*
         * ========================================================
         * Construction du Request DTO
         * ========================================================
         */
        return CategorieRequestDto.builder()
                .nom(categorie.getNom())
                .description(categorie.getDescription())
                .createdAt(categorie.getCreatedAt())
                .updatedAt(categorie.getUpdatedAt())
                .annonceIds(annonceIds)
                .build();
    }


    /**
     * ============================================================
     * ENTITY -> RESPONSE DTO
     * ============================================================
     *
     * Convertit :
     *
     * Categorie
     *      ↓
     * CategorieResponseDto
     *
     * Les objets Annonce sont convertis en leurs UUID.
     */
    @Override
    public CategorieResponseDto entityToResponse(
            Categorie categorie) {

        if (categorie == null) {
            return null;
        }

        /*
         * ========================================================
         * Extraction des IDs des Annonces
         * ========================================================
         */
        List<UUID> annonceIds = Collections.emptyList();

        if (categorie.getAnnonces() != null) {

            annonceIds = categorie.getAnnonces()
                    .stream()
                    .map(Annonce::getAnnonceId)
                    .collect(Collectors.toList());
        }

        /*
         * ========================================================
         * Construction du Response DTO
         * ========================================================
         */
        return CategorieResponseDto.builder()
                .categorieId(categorie.getCategorieId())
                .nom(categorie.getNom())
                .description(categorie.getDescription())
                .createdAt(categorie.getCreatedAt())
                .updatedAt(categorie.getUpdatedAt())
                .annonceIds(annonceIds)
                .build();
    }


    /**
     * ============================================================
     * RESPONSE DTO -> ENTITY
     * ============================================================
     *
     * Convertit :
     *
     * CategorieResponseDto
     *          ↓
     * Categorie
     *
     * Les annonceIds sont recherchés dans la base de données
     * grâce à AnnonceRepository.
     */
    @Override
    public Categorie responseToEntity(
            CategorieResponseDto categorieResponseDto) {

        if (categorieResponseDto == null) {
            return null;
        }

        /*
         * ========================================================
         * Récupération des Annonces
         * ========================================================
         */
        List<Annonce> annonces = Collections.emptyList();

        if (categorieResponseDto.getAnnonceIds() != null
                && !categorieResponseDto.getAnnonceIds().isEmpty()) {

            annonces = annonceRepository.findAllById(
                    categorieResponseDto.getAnnonceIds()
            );
        }

        /*
         * ========================================================
         * Construction de l'entité Categorie
         * ========================================================
         */
        return Categorie.builder()
                .categorieId(categorieResponseDto.getCategorieId())
                .nom(categorieResponseDto.getNom())
                .description(categorieResponseDto.getDescription())
                .createdAt(categorieResponseDto.getCreatedAt())
                .updatedAt(categorieResponseDto.getUpdatedAt())
                .annonces(annonces)
                .build();
    }
}
