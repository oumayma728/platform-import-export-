package com.commercial.Pont.Commercial.mappers.ImplementationMappers;

import com.commercial.Pont.Commercial.dtos.requestDtos.DocumentAnnonceRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.DocumentAnnonceResponseDto;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.DocumentAnnonceMapperInterface;
import com.commercial.Pont.Commercial.models.Annonce;
import com.commercial.Pont.Commercial.models.DocumentAnnonce;
import com.commercial.Pont.Commercial.repositories.AnnonceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class DocumentAnnonceMapperImpl
        implements DocumentAnnonceMapperInterface {

    private final AnnonceRepository annonceRepository;


    /**
     * ============================================================
     * REQUEST DTO -> ENTITY
     * ============================================================
     *
     * DocumentAnnonceRequestDto
     *          ↓
     * DocumentAnnonce
     *
     * L'annonce est recherchée dans la base de données
     * grâce à son annonceId.
     */
    @Override
    public DocumentAnnonce requestToEntity(
            DocumentAnnonceRequestDto documentAnnonceRequestDto) {

        if (documentAnnonceRequestDto == null) {
            return null;
        }

        /*
         * ========================================================
         * Récupération de l'Annonce
         * ========================================================
         */
        Annonce annonce = null;

        if (documentAnnonceRequestDto.getAnnonceId() != null) {

            annonce = annonceRepository
                    .findById(
                            documentAnnonceRequestDto.getAnnonceId()
                    )
                    .orElse(null);
        }

        /*
         * ========================================================
         * Construction de DocumentAnnonce
         * ========================================================
         */
        return DocumentAnnonce.builder()

                // Informations du document
                .nomFichier(
                        documentAnnonceRequestDto.getNomFichier()
                )
                .cheminFichier(
                        documentAnnonceRequestDto.getCheminFichier()
                )
                .extension(
                        documentAnnonceRequestDto.getExtension()
                )
                .taille(
                        documentAnnonceRequestDto.getTaille()
                )
                .createdAt(
                        documentAnnonceRequestDto.getCreatedAt()
                )
                .updatedAt(
                        documentAnnonceRequestDto.getUpdatedAt()
                )

                // Relation avec Annonce
                .annonce(annonce)

                .build();
    }


    /**
     * ============================================================
     * ENTITY -> REQUEST DTO
     * ============================================================
     *
     * DocumentAnnonce
     *      ↓
     * DocumentAnnonceRequestDto
     *
     * L'objet Annonce est converti en annonceId.
     */
    @Override
    public DocumentAnnonceRequestDto entityToRequest(
            DocumentAnnonce documentAnnonce) {

        if (documentAnnonce == null) {
            return null;
        }

        /*
         * ========================================================
         * Extraction de l'ID de l'Annonce
         * ========================================================
         */
        UUID annonceId = null;

        if (documentAnnonce.getAnnonce() != null) {

            annonceId = documentAnnonce
                    .getAnnonce()
                    .getAnnonceId();
        }

        /*
         * ========================================================
         * Construction du Request DTO
         * ========================================================
         */
        return DocumentAnnonceRequestDto.builder()

                // ID de l'annonce
                .annonceId(annonceId)

                // Informations du document
                .nomFichier(
                        documentAnnonce.getNomFichier()
                )
                .cheminFichier(
                        documentAnnonce.getCheminFichier()
                )
                .extension(
                        documentAnnonce.getExtension()
                )
                .taille(
                        documentAnnonce.getTaille()
                )
                .createdAt(
                        documentAnnonce.getCreatedAt()
                )
                .updatedAt(
                        documentAnnonce.getUpdatedAt()
                )

                .build();
    }


    /**
     * ============================================================
     * ENTITY -> RESPONSE DTO
     * ============================================================
     *
     * DocumentAnnonce
     *      ↓
     * DocumentAnnonceResponseDto
     *
     * L'objet Annonce est converti en annonceId.
     */
    @Override
    public DocumentAnnonceResponseDto entityToResponse(
            DocumentAnnonce documentAnnonce) {

        if (documentAnnonce == null) {
            return null;
        }

        /*
         * ========================================================
         * Extraction de l'ID de l'Annonce
         * ========================================================
         */
        UUID annonceId = null;

        if (documentAnnonce.getAnnonce() != null) {

            annonceId = documentAnnonce
                    .getAnnonce()
                    .getAnnonceId();
        }

        /*
         * ========================================================
         * Construction du Response DTO
         * ========================================================
         */
        return DocumentAnnonceResponseDto.builder()

                // ID de l'annonce
                .annonceId(annonceId)

                // ID du document
                .documentAnnonceId(
                        documentAnnonce.getDocumentAnnonceId()
                )

                // Informations du document
                .nomFichier(
                        documentAnnonce.getNomFichier()
                )
                .cheminFichier(
                        documentAnnonce.getCheminFichier()
                )
                .extension(
                        documentAnnonce.getExtension()
                )
                .taille(
                        documentAnnonce.getTaille()
                )
                .createdAt(
                        documentAnnonce.getCreatedAt()
                )
                .updatedAt(
                        documentAnnonce.getUpdatedAt()
                )

                .build();
    }


    /**
     * ============================================================
     * RESPONSE DTO -> ENTITY
     * ============================================================
     *
     * DocumentAnnonceResponseDto
     *          ↓
     * DocumentAnnonce
     *
     * L'annonce est recherchée dans la base de données
     * grâce à son annonceId.
     */
    @Override
    public DocumentAnnonce responseToEntity(
            DocumentAnnonceResponseDto documentAnnonceResponseDto) {

        if (documentAnnonceResponseDto == null) {
            return null;
        }

        /*
         * ========================================================
         * Récupération de l'Annonce
         * ========================================================
         */
        Annonce annonce = null;

        if (documentAnnonceResponseDto.getAnnonceId() != null) {

            annonce = annonceRepository
                    .findById(
                            documentAnnonceResponseDto.getAnnonceId()
                    )
                    .orElse(null);
        }

        /*
         * ========================================================
         * Construction de DocumentAnnonce
         * ========================================================
         */
        return DocumentAnnonce.builder()

                // ID du document
                .documentAnnonceId(
                        documentAnnonceResponseDto
                                .getDocumentAnnonceId()
                )

                // Informations du document
                .nomFichier(
                        documentAnnonceResponseDto.getNomFichier()
                )
                .cheminFichier(
                        documentAnnonceResponseDto.getCheminFichier()
                )
                .extension(
                        documentAnnonceResponseDto.getExtension()
                )
                .taille(
                        documentAnnonceResponseDto.getTaille()
                )
                .createdAt(
                        documentAnnonceResponseDto.getCreatedAt()
                )
                .updatedAt(
                        documentAnnonceResponseDto.getUpdatedAt()
                )

                // Relation avec Annonce
                .annonce(annonce)

                .build();
    }
}
