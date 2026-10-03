package com.commercial.Pont.Commercial.services.ServiceInterfaces;

import com.commercial.Pont.Commercial.dtos.requestDtos.AnnonceRequestDto;
import com.commercial.Pont.Commercial.dtos.requestDtos.CreateMyAnnonceRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.AnnonceResponseDto;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;
import java.util.UUID;

public interface AnnonceServiceInterface {

    @PreAuthorize("hasRole('ADMIN')")
    AnnonceResponseDto create(AnnonceRequestDto annonceRequestDto);

    @PreAuthorize("hasAnyRole('IMPORTATEUR', 'EXPORTATEUR')")
    AnnonceResponseDto createMyAnnonce(
            CreateMyAnnonceRequestDto annonceRequestDto,
            Authentication authentication
    );

    // Admin : modifier n'importe quelle annonce
    // Importateur/Exportateur : modifier uniquement leurs propres annonces
    @PreAuthorize("hasAnyRole('ADMIN', 'IMPORTATEUR', 'EXPORTATEUR')")
    AnnonceResponseDto update(
            UUID annonceId,
            AnnonceRequestDto annonceRequestDto
    );

    @PreAuthorize("hasAnyRole('ADMIN', 'IMPORTATEUR', 'EXPORTATEUR')")
    AnnonceResponseDto getById(UUID annonceId);

    @PreAuthorize("hasAnyRole('ADMIN', 'IMPORTATEUR', 'EXPORTATEUR')")
    List<AnnonceResponseDto> getAll();

    // Admin : supprimer n'importe quelle annonce
    // Importateur/Exportateur : supprimer uniquement leurs propres annonces
    @PreAuthorize("hasAnyRole('ADMIN', 'IMPORTATEUR', 'EXPORTATEUR')")
    void delete(UUID annonceId);


    @PreAuthorize("hasRole('ADMIN')")
    AnnonceResponseDto suspendreAnnonce(
            UUID annonceId
    );

    @PreAuthorize("hasRole('ADMIN')")
    AnnonceResponseDto cloturerAnnonce(
            UUID annonceId
    );


    @PreAuthorize("hasAnyRole('ADMIN', 'IMPORTATEUR', 'EXPORTATEUR')")
    List<AnnonceResponseDto> rechercher(
            String pays,
            String categorie,
            Double prixMin,
            Double prixMax,
            String certification,
            String devise
    );


    @PreAuthorize("hasAnyRole('ADMIN', 'IMPORTATEUR', 'EXPORTATEUR')")
    List<AnnonceResponseDto> getAnnoncesByUtilisateur(
            UUID utilisateurId
    );

    @PreAuthorize("hasAnyRole('ADMIN', 'IMPORTATEUR', 'EXPORTATEUR')")
    List<AnnonceResponseDto> getOffres();

    @PreAuthorize("hasAnyRole('ADMIN', 'IMPORTATEUR', 'EXPORTATEUR')")
    List<AnnonceResponseDto> getDemandes();

    @PreAuthorize("hasAnyRole('ADMIN', 'IMPORTATEUR', 'EXPORTATEUR')")
    List<AnnonceResponseDto> getOffresByUtilisateur(
            UUID utilisateurId
    );

    @PreAuthorize("hasAnyRole('ADMIN', 'IMPORTATEUR', 'EXPORTATEUR')")
    List<AnnonceResponseDto> getDemandesByUtilisateur(
            UUID utilisateurId
    );
}