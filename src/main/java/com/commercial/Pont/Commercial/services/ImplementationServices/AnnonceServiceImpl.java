package com.commercial.Pont.Commercial.services.ImplementationServices;

import com.commercial.Pont.Commercial.dtos.requestDtos.AnnonceRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.AnnonceResponseDto;
import com.commercial.Pont.Commercial.enums.AnnouncementStatus;
import com.commercial.Pont.Commercial.enums.AnnouncementType;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.AnnonceMapperInterface;
import com.commercial.Pont.Commercial.models.Annonce;
import com.commercial.Pont.Commercial.repositories.AnnonceRepository;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.AnnonceServiceInterface;
import com.commercial.Pont.Commercial.specifications.AnnonceSpecification;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class AnnonceServiceImpl implements AnnonceServiceInterface {

    private final AnnonceRepository annonceRepository;
    private final AnnonceMapperInterface annonceMapper;


    // =========================
    // CREATE
    // =========================

    @Override
    public AnnonceResponseDto create(
            AnnonceRequestDto annonceRequestDto
    ) {

        Annonce annonce =
                annonceMapper.requestToEntity(annonceRequestDto);

        LocalDateTime now = LocalDateTime.now();

        annonce.setCreatedAt(now);
        annonce.setUpdatedAt(now);

        Annonce savedAnnonce =
                annonceRepository.save(annonce);

        return annonceMapper.entityToResponse(savedAnnonce);
    }


    // =========================
    // UPDATE
    // =========================

    @Override
    public AnnonceResponseDto update(
            UUID annonceId,
            AnnonceRequestDto annonceRequestDto
    ) {

        Annonce existingAnnonce =
                annonceRepository.findById(annonceId)
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Annonce non trouvée avec l'id : "
                                                + annonceId
                                )
                        );


        // Informations principales

        existingAnnonce.setTitre(
                annonceRequestDto.getTitre()
        );

        existingAnnonce.setCertification(
                annonceRequestDto.getCertification()
        );

        existingAnnonce.setDescription(
                annonceRequestDto.getDescription()
        );

        existingAnnonce.setType(
                annonceRequestDto.getType()
        );

        existingAnnonce.setPrix(
                annonceRequestDto.getPrix()
        );

        existingAnnonce.setDevise(
                annonceRequestDto.getDevise()
        );

        existingAnnonce.setQuantite(
                annonceRequestDto.getQuantite()
        );

        existingAnnonce.setUniteQuantite(
                annonceRequestDto.getUniteQuantite()
        );

        existingAnnonce.setDateLimite(
                annonceRequestDto.getDateLimite()
        );

        existingAnnonce.setStatut(
                annonceRequestDto.getStatut()
        );

        existingAnnonce.setDureeLivraison(
                annonceRequestDto.getDureeLivraison()
        );

        existingAnnonce.setUniteDureeLivraison(
                annonceRequestDto.getUniteDureeLivraison()
        );

        existingAnnonce.setPublishedAt(
                annonceRequestDto.getPublishedAt()
        );


        // Mise à jour automatique

        existingAnnonce.setUpdatedAt(
                LocalDateTime.now()
        );


        Annonce updatedAnnonce =
                annonceRepository.save(existingAnnonce);

        return annonceMapper.entityToResponse(
                updatedAnnonce
        );
    }


    // =========================
    // GET BY ID
    // =========================

    @Override
    @Transactional(readOnly = true)
    public AnnonceResponseDto getById(
            UUID annonceId
    ) {

        Annonce annonce =
                annonceRepository.findById(annonceId)
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Annonce non trouvée avec l'id : "
                                                + annonceId
                                )
                        );

        return annonceMapper.entityToResponse(
                annonce
        );
    }


    // =========================
    // GET ALL
    // =========================

    @Override
    @Transactional(readOnly = true)
    public List<AnnonceResponseDto> getAll() {

        return annonceRepository.findAll()
                .stream()
                .map(annonceMapper::entityToResponse)
                .toList();
    }


    // =========================
    // DELETE
    // =========================

    @Override
    public void delete(
            UUID annonceId
    ) {

        if (!annonceRepository.existsById(annonceId)) {

            throw new EntityNotFoundException(
                    "Annonce non trouvée avec l'id : "
                            + annonceId
            );
        }

        annonceRepository.deleteById(
                annonceId
        );
    }





    private AnnonceResponseDto changerStatutAnnonce(
            UUID annonceId,
            AnnouncementStatus statut
    ) {

        Annonce annonce =
                annonceRepository.findById(annonceId)
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Annonce non trouvée avec l'id : "
                                                + annonceId
                                )
                        );

        annonce.setStatut(
                statut
        );

        annonce.setUpdatedAt(
                LocalDateTime.now()
        );

        Annonce savedAnnonce =
                annonceRepository.save(
                        annonce
                );

        return annonceMapper.entityToResponse(
                savedAnnonce
        );
    }





    @Override
    public AnnonceResponseDto suspendreAnnonce(
            UUID annonceId
    ) {

        return changerStatutAnnonce(
                annonceId,
                AnnouncementStatus.SUSPENDUE
        );
    }

    @Override
    public AnnonceResponseDto cloturerAnnonce(
            UUID annonceId
    ) {

        return changerStatutAnnonce(
                annonceId,
                AnnouncementStatus.CLOTUREE
        );
    }




    @Override
    @Transactional(readOnly = true)
    public List<AnnonceResponseDto> rechercher(
            String pays,
            String categorie,
            Double prixMin,
            Double prixMax,
            String certification
    ) {

        Specification<Annonce> specification =
                Specification
                        .where(
                                AnnonceSpecification.hasPays(pays)
                        )
                        .and(
                                AnnonceSpecification.hasCategorie(categorie)
                        )
                        .and(
                                AnnonceSpecification.prixMin(prixMin)
                        )
                        .and(
                                AnnonceSpecification.prixMax(prixMax)
                        )
                        .and(
                                AnnonceSpecification.hasCertification(certification)
                        );

        return annonceRepository.findAll(specification)
                .stream()
                .map(annonceMapper::entityToResponse)
                .toList();
    }







    @Override
    @Transactional(readOnly = true)
    public List<AnnonceResponseDto> getAnnoncesByUtilisateur(
            UUID utilisateurId
    ) {

        return annonceRepository
                .findByUtilisateurUtilisateurId(utilisateurId)
                .stream()
                .map(annonceMapper::entityToResponse)
                .toList();
    }



    @Override
    @Transactional(readOnly = true)
    public List<AnnonceResponseDto> getOffres() {

        return annonceRepository.findByType(
                        AnnouncementType.OFFRE
                )
                .stream()
                .map(annonceMapper::entityToResponse)
                .toList();
    }


    @Override
    @Transactional(readOnly = true)
    public List<AnnonceResponseDto> getDemandes() {

        return annonceRepository.findByType(
                        AnnouncementType.DEMANDE
                )
                .stream()
                .map(annonceMapper::entityToResponse)
                .toList();
    }



    @Override
    @Transactional(readOnly = true)
    public List<AnnonceResponseDto> getOffresByUtilisateur(
            UUID utilisateurId
    ) {

        return annonceRepository
                .findByUtilisateurUtilisateurIdAndType(
                        utilisateurId,
                        AnnouncementType.OFFRE
                )
                .stream()
                .map(annonceMapper::entityToResponse)
                .toList();
    }


    @Override
    @Transactional(readOnly = true)
    public List<AnnonceResponseDto> getDemandesByUtilisateur(
            UUID utilisateurId
    ) {

        return annonceRepository
                .findByUtilisateurUtilisateurIdAndType(
                        utilisateurId,
                        AnnouncementType.DEMANDE
                )
                .stream()
                .map(annonceMapper::entityToResponse)
                .toList();
    }
}