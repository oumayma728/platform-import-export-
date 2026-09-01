package com.commercial.Pont.Commercial.services.ImplementationServices;

import com.commercial.Pont.Commercial.dtos.requestDtos.DocumentAnnonceRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.DocumentAnnonceResponseDto;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.DocumentAnnonceMapperInterface;
import com.commercial.Pont.Commercial.models.Annonce;
import com.commercial.Pont.Commercial.models.DocumentAnnonce;
import com.commercial.Pont.Commercial.models.Utilisateur;
import com.commercial.Pont.Commercial.repositories.AnnonceRepository;
import com.commercial.Pont.Commercial.repositories.DocumentAnnonceRepository;
import com.commercial.Pont.Commercial.repositories.UtilisateurRepository;
import com.commercial.Pont.Commercial.services.FileStorageService;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.DocumentAnnonceServiceInterface;

import jakarta.persistence.EntityNotFoundException;

import lombok.RequiredArgsConstructor;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;


@Service
@RequiredArgsConstructor
@Transactional
public class DocumentAnnonceServiceImpl
        implements DocumentAnnonceServiceInterface {

    private final DocumentAnnonceRepository
            documentAnnonceRepository;

    private final DocumentAnnonceMapperInterface
            documentAnnonceMapper;

    private final AnnonceRepository
            annonceRepository;

    private final UtilisateurRepository
            utilisateurRepository;

    private final FileStorageService
            fileStorageService;


    // =========================================================
    // CREATE GENERIC
    // =========================================================

    @Override
    public DocumentAnnonceResponseDto create(
            DocumentAnnonceRequestDto requestDto
    ) {

        DocumentAnnonce documentAnnonce =
                documentAnnonceMapper.requestToEntity(
                        requestDto
                );

        Annonce annonce =
                annonceRepository.findById(
                                requestDto.getAnnonceId()
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Annonce non trouvée avec l'id : "
                                                + requestDto.getAnnonceId()
                                )
                        );

        documentAnnonce.setAnnonce(
                annonce
        );

        LocalDateTime now =
                LocalDateTime.now();

        documentAnnonce.setCreatedAt(
                now
        );

        documentAnnonce.setUpdatedAt(
                now
        );

        DocumentAnnonce savedDocument =
                documentAnnonceRepository.save(
                        documentAnnonce
                );

        return documentAnnonceMapper.entityToResponse(
                savedDocument
        );
    }


    // =========================================================
    // UPDATE
    // =========================================================

    @Override
    public DocumentAnnonceResponseDto update(
            UUID documentAnnonceId,
            DocumentAnnonceRequestDto requestDto
    ) {

        DocumentAnnonce documentAnnonce =
                documentAnnonceRepository
                        .findById(documentAnnonceId)
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Document annonce non trouvé avec l'id : "
                                                + documentAnnonceId
                                )
                        );


        if (requestDto.getNomFichier() != null) {

            documentAnnonce.setNomFichier(
                    requestDto.getNomFichier()
            );
        }


        if (requestDto.getCheminFichier() != null) {

            documentAnnonce.setCheminFichier(
                    requestDto.getCheminFichier()
            );
        }


        if (requestDto.getExtension() != null) {

            documentAnnonce.setExtension(
                    requestDto.getExtension()
            );
        }


        if (requestDto.getTaille() != null) {

            documentAnnonce.setTaille(
                    requestDto.getTaille()
            );
        }


        if (
                requestDto.getAnnonceId() != null
                        &&
                        !requestDto
                                .getAnnonceId()
                                .equals(
                                        documentAnnonce
                                                .getAnnonce()
                                                .getAnnonceId()
                                )
        ) {

            Annonce annonce =
                    annonceRepository
                            .findById(
                                    requestDto.getAnnonceId()
                            )
                            .orElseThrow(() ->
                                    new EntityNotFoundException(
                                            "Annonce non trouvée avec l'id : "
                                                    + requestDto
                                                    .getAnnonceId()
                                    )
                            );

            documentAnnonce.setAnnonce(
                    annonce
            );
        }


        documentAnnonce.setUpdatedAt(
                LocalDateTime.now()
        );


        DocumentAnnonce savedDocument =
                documentAnnonceRepository.save(
                        documentAnnonce
                );

        return documentAnnonceMapper.entityToResponse(
                savedDocument
        );
    }


    // =========================================================
    // GET BY ID
    // =========================================================

    @Override
    @Transactional(readOnly = true)
    public DocumentAnnonceResponseDto getById(
            UUID documentAnnonceId
    ) {

        DocumentAnnonce documentAnnonce =
                documentAnnonceRepository
                        .findById(documentAnnonceId)
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


    // =========================================================
    // GET ALL
    // =========================================================

    @Override
    @Transactional(readOnly = true)
    public List<DocumentAnnonceResponseDto> getAll() {

        return documentAnnonceRepository
                .findAll()
                .stream()
                .map(
                        documentAnnonceMapper::entityToResponse
                )
                .toList();
    }


    // =========================================================
    // DELETE GENERIC
    // =========================================================

    @Override
    public void delete(
            UUID documentAnnonceId
    ) {

        DocumentAnnonce documentAnnonce =
                documentAnnonceRepository
                        .findById(documentAnnonceId)
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Document annonce non trouvé avec l'id : "
                                                + documentAnnonceId
                                )
                        );


        // Supprimer aussi le fichier physique

        if (
                documentAnnonce.getCheminFichier() != null
        ) {

            fileStorageService.delete(
                    documentAnnonce.getCheminFichier()
            );
        }


        documentAnnonceRepository.delete(
                documentAnnonce
        );
    }


    // =========================================================
    // ADD DOCUMENT TO ANNONCE
    // =========================================================

    @Override
    public DocumentAnnonceResponseDto addDocumentToAnnonce(
            UUID annonceId,
            MultipartFile file
    ) {

        // =====================================================
        // Vérification fichier
        // =====================================================

        if (
                file == null
                        ||
                        file.isEmpty()
        ) {

            throw new IllegalArgumentException(
                    "Le fichier est obligatoire."
            );
        }


        // =====================================================
        // Utilisateur connecté
        // =====================================================

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();


        if (
                authentication == null
                        ||
                        !authentication.isAuthenticated()
        ) {

            throw new IllegalStateException(
                    "Utilisateur non authentifié."
            );
        }


        String email =
                authentication.getName();


        // =====================================================
        // Recherche utilisateur
        // =====================================================

        Utilisateur utilisateur =
                utilisateurRepository
                        .findByEmail(email)
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Utilisateur non trouvé avec l'email : "
                                                + email
                                )
                        );


        // =====================================================
        // Recherche annonce
        // =====================================================

        Annonce annonce =
                annonceRepository
                        .findById(annonceId)
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Annonce non trouvée avec l'id : "
                                                + annonceId
                                )
                        );


        // =====================================================
        // Vérifier propriétaire
        // =====================================================

        if (
                annonce.getUtilisateur() == null
                        ||
                        !annonce
                                .getUtilisateur()
                                .getUtilisateurId()
                                .equals(
                                        utilisateur.getUtilisateurId()
                                )
        ) {

            throw new AccessDeniedException(
                    "Vous ne pouvez ajouter des documents "
                            + "qu'à vos propres annonces."
            );
        }


        // =====================================================
        // Informations fichier
        // =====================================================

        String nomFichier =
                file.getOriginalFilename();


        if (
                nomFichier == null
                        ||
                        nomFichier.isBlank()
        ) {

            throw new IllegalArgumentException(
                    "Nom du fichier invalide."
            );
        }


        String extension = "";

        int lastDot =
                nomFichier.lastIndexOf(".");


        if (lastDot > 0) {

            extension =
                    nomFichier.substring(
                            lastDot + 1
                    );
        }


        Long taille =
                file.getSize();


        // =====================================================
        // Stockage fichier physique
        // =====================================================

        String cheminFichier =
                fileStorageService.store(
                        file
                );


        // =====================================================
        // Création DocumentAnnonce
        // =====================================================

        LocalDateTime now =
                LocalDateTime.now();


        DocumentAnnonce documentAnnonce =
                DocumentAnnonce.builder()

                        .nomFichier(
                                nomFichier
                        )

                        .cheminFichier(
                                cheminFichier
                        )

                        .extension(
                                extension
                        )

                        .taille(
                                taille
                        )

                        .createdAt(
                                now
                        )

                        .updatedAt(
                                now
                        )

                        .annonce(
                                annonce
                        )

                        .build();


        // =====================================================
        // Sauvegarde DB
        // =====================================================

        DocumentAnnonce savedDocument =
                documentAnnonceRepository.save(
                        documentAnnonce
                );


        return documentAnnonceMapper.entityToResponse(
                savedDocument
        );
    }


    // =========================================================
    // GET DOCUMENTS BY ANNONCE
    // =========================================================

    @Override
    @Transactional(readOnly = true)
    public List<DocumentAnnonceResponseDto>
    getDocumentsByAnnonce(
            UUID annonceId
    ) {

        // =====================================================
        // Vérifier existence annonce
        // =====================================================

        if (
                !annonceRepository.existsById(
                        annonceId
                )
        ) {

            throw new EntityNotFoundException(
                    "Annonce non trouvée avec l'id : "
                            + annonceId
            );
        }


        // =====================================================
        // Documents de l'annonce
        // =====================================================

        return documentAnnonceRepository
                .findByAnnonce_AnnonceId(
                        annonceId
                )
                .stream()
                .map(
                        documentAnnonceMapper::entityToResponse
                )
                .toList();
    }


    // =========================================================
    // DELETE DOCUMENT FROM ANNONCE
    // =========================================================

    @Override
    public void deleteDocumentFromAnnonce(
            UUID annonceId,
            UUID documentAnnonceId
    ) {

        // =====================================================
        // Utilisateur connecté
        // =====================================================

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();


        if (
                authentication == null
                        ||
                        !authentication.isAuthenticated()
        ) {

            throw new IllegalStateException(
                    "Utilisateur non authentifié."
            );
        }


        String email =
                authentication.getName();


        Utilisateur utilisateur =
                utilisateurRepository
                        .findByEmail(email)
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Utilisateur connecté non trouvé."
                                )
                        );


        // =====================================================
        // Recherche document
        // =====================================================

        DocumentAnnonce documentAnnonce =
                documentAnnonceRepository
                        .findById(
                                documentAnnonceId
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Document annonce non trouvé avec l'id : "
                                                + documentAnnonceId
                                )
                        );


        // =====================================================
        // Vérifier annonce
        // =====================================================

        Annonce annonce =
                documentAnnonce.getAnnonce();


        if (
                !annonce
                        .getAnnonceId()
                        .equals(
                                annonceId
                        )
        ) {

            throw new IllegalArgumentException(
                    "Ce document n'appartient pas à cette annonce."
            );
        }


        // =====================================================
        // Vérifier propriétaire annonce
        // =====================================================

        if (
                annonce.getUtilisateur() == null
                        ||
                        !annonce
                                .getUtilisateur()
                                .getUtilisateurId()
                                .equals(
                                        utilisateur.getUtilisateurId()
                                )
        ) {

            throw new AccessDeniedException(
                    "Vous ne pouvez supprimer que les documents "
                            + "de vos propres annonces."
            );
        }


        // =====================================================
        // Supprimer fichier physique
        // =====================================================

        if (
                documentAnnonce.getCheminFichier() != null
        ) {

            fileStorageService.delete(
                    documentAnnonce.getCheminFichier()
            );
        }


        // =====================================================
        // Supprimer DB
        // =====================================================

        documentAnnonceRepository.delete(
                documentAnnonce
        );
    }
}