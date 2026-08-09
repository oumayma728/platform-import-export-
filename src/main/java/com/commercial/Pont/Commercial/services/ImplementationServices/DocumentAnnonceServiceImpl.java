package com.commercial.Pont.Commercial.services.ImplementationServices;

import com.commercial.Pont.Commercial.dtos.requestDtos.DocumentAnnonceRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.DocumentAnnonceResponseDto;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.DocumentAnnonceMapperInterface;
import com.commercial.Pont.Commercial.models.Annonce;
import com.commercial.Pont.Commercial.models.DocumentAnnonce;
import com.commercial.Pont.Commercial.repositories.AnnonceRepository;
import com.commercial.Pont.Commercial.repositories.DocumentAnnonceRepository;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.DocumentAnnonceServiceInterface;
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
public class DocumentAnnonceServiceImpl
        implements DocumentAnnonceServiceInterface {

    private final DocumentAnnonceRepository documentAnnonceRepository;

    private final DocumentAnnonceMapperInterface documentAnnonceMapper;

    private final AnnonceRepository annonceRepository;


    // =========================
    // CREATE
    // =========================

    @Override
    public DocumentAnnonceResponseDto create(
            DocumentAnnonceRequestDto documentAnnonceRequestDto
    ) {

        DocumentAnnonce documentAnnonce =
                documentAnnonceMapper.requestToEntity(
                        documentAnnonceRequestDto
                );


        // Recherche de l'annonce

        Annonce annonce =
                annonceRepository.findById(
                                documentAnnonceRequestDto.getAnnonceId()
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Annonce non trouvée avec l'id : "
                                                + documentAnnonceRequestDto
                                                .getAnnonceId()
                                )
                        );


        // Association du document à l'annonce

        documentAnnonce.setAnnonce(
                annonce
        );


        // Gestion des dates

        LocalDateTime now =
                LocalDateTime.now();

        documentAnnonce.setCreatedAt(
                now
        );

        documentAnnonce.setUpdatedAt(
                now
        );


        DocumentAnnonce savedDocumentAnnonce =
                documentAnnonceRepository.save(
                        documentAnnonce
                );

        return documentAnnonceMapper.entityToResponse(
                savedDocumentAnnonce
        );
    }


    // =========================
    // UPDATE
    // =========================

    @Override
    public DocumentAnnonceResponseDto update(
            UUID documentAnnonceId,
            DocumentAnnonceRequestDto documentAnnonceRequestDto
    ) {

        DocumentAnnonce existingDocumentAnnonce =
                documentAnnonceRepository.findById(
                                documentAnnonceId
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Document annonce non trouvé avec l'id : "
                                                + documentAnnonceId
                                )
                        );


        // =========================
        // Mise à jour des informations
        // =========================

        existingDocumentAnnonce.setNomFichier(
                documentAnnonceRequestDto.getNomFichier()
        );

        existingDocumentAnnonce.setCheminFichier(
                documentAnnonceRequestDto.getCheminFichier()
        );

        existingDocumentAnnonce.setExtension(
                documentAnnonceRequestDto.getExtension()
        );

        existingDocumentAnnonce.setTaille(
                documentAnnonceRequestDto.getTaille()
        );


        // =========================
        // Mise à jour de l'annonce
        // =========================

        if (
                documentAnnonceRequestDto.getAnnonceId() != null
                        &&
                        !documentAnnonceRequestDto
                                .getAnnonceId()
                                .equals(
                                        existingDocumentAnnonce
                                                .getAnnonce()
                                                .getAnnonceId()
                                )
        ) {

            Annonce annonce =
                    annonceRepository.findById(
                                    documentAnnonceRequestDto
                                            .getAnnonceId()
                            )
                            .orElseThrow(() ->
                                    new EntityNotFoundException(
                                            "Annonce non trouvée avec l'id : "
                                                    + documentAnnonceRequestDto
                                                    .getAnnonceId()
                                    )
                            );

            existingDocumentAnnonce.setAnnonce(
                    annonce
            );
        }


        // =========================
        // Mise à jour automatique
        // =========================

        existingDocumentAnnonce.setUpdatedAt(
                LocalDateTime.now()
        );


        DocumentAnnonce updatedDocumentAnnonce =
                documentAnnonceRepository.save(
                        existingDocumentAnnonce
                );

        return documentAnnonceMapper.entityToResponse(
                updatedDocumentAnnonce
        );
    }


    // =========================
    // GET BY ID
    // =========================

    @Override
    @Transactional(readOnly = true)
    public DocumentAnnonceResponseDto getById(
            UUID documentAnnonceId
    ) {

        DocumentAnnonce documentAnnonce =
                documentAnnonceRepository.findById(
                                documentAnnonceId
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Document annonce non trouvé avec l'id : "
                                                + documentAnnonceId
                                )
                        );

        return documentAnnonceMapper.entityToResponse(
                documentAnnonce
        );
    }


    // =========================
    // GET ALL
    // =========================

    @Override
    @Transactional(readOnly = true)
    public List<DocumentAnnonceResponseDto> getAll() {

        return documentAnnonceRepository.findAll()
                .stream()
                .map(
                        documentAnnonceMapper::entityToResponse
                )
                .toList();
    }


    // =========================
    // DELETE
    // =========================

    @Override
    public void delete(
            UUID documentAnnonceId
    ) {

        if (
                !documentAnnonceRepository
                        .existsById(
                                documentAnnonceId
                        )
        ) {

            throw new EntityNotFoundException(
                    "Document annonce non trouvé avec l'id : "
                            + documentAnnonceId
            );
        }

        documentAnnonceRepository.deleteById(
                documentAnnonceId
        );
    }
}