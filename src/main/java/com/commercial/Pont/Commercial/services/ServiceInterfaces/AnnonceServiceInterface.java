package com.commercial.Pont.Commercial.services.ServiceInterfaces;

import com.commercial.Pont.Commercial.dtos.requestDtos.AnnonceRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.AnnonceResponseDto;

import java.util.List;
import java.util.UUID;

public interface AnnonceServiceInterface {

    AnnonceResponseDto create(AnnonceRequestDto annonceRequestDto);

    AnnonceResponseDto update(
            UUID annonceId,
            AnnonceRequestDto annonceRequestDto
    );

    AnnonceResponseDto getById(UUID annonceId);

    List<AnnonceResponseDto> getAll();

    void delete(UUID annonceId);


    AnnonceResponseDto suspendreAnnonce(
            UUID annonceId
    );

    AnnonceResponseDto cloturerAnnonce(
            UUID annonceId
    );


    List<AnnonceResponseDto> rechercher(
            String pays,
            String categorie,
            Double prixMin,
            Double prixMax,
            String certification
    );


    List<AnnonceResponseDto> getAnnoncesByUtilisateur(
            UUID utilisateurId
    );

    List<AnnonceResponseDto> getOffres();
    List<AnnonceResponseDto> getDemandes();

    List<AnnonceResponseDto> getOffresByUtilisateur(
            UUID utilisateurId
    );

    List<AnnonceResponseDto> getDemandesByUtilisateur(
            UUID utilisateurId
    );
}