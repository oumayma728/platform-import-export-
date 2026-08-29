package com.commercial.Pont.Commercial.mappers.ImplementationMappers;

import com.commercial.Pont.Commercial.dtos.requestDtos.AnnonceRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.AnnonceResponseDto;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.AnnonceMapperInterface;
import com.commercial.Pont.Commercial.models.Annonce;
import com.commercial.Pont.Commercial.models.Categorie;
import com.commercial.Pont.Commercial.models.Conversation;
import com.commercial.Pont.Commercial.models.DocumentAnnonce;
import com.commercial.Pont.Commercial.models.IncotermAnnonce;
import com.commercial.Pont.Commercial.models.Location;
import com.commercial.Pont.Commercial.models.Utilisateur;
import com.commercial.Pont.Commercial.repositories.CategorieRepository;
import com.commercial.Pont.Commercial.repositories.ConversationRepository;
import com.commercial.Pont.Commercial.repositories.DocumentAnnonceRepository;
import com.commercial.Pont.Commercial.repositories.IncotermAnnonceRepository;
import com.commercial.Pont.Commercial.repositories.LocationRepository;
import com.commercial.Pont.Commercial.repositories.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class AnnonceMapperImpl implements AnnonceMapperInterface {

    private final CategorieRepository categorieRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final LocationRepository locationRepository;
    private final ConversationRepository conversationRepository;
    private final DocumentAnnonceRepository documentAnnonceRepository;
    private final IncotermAnnonceRepository incotermAnnonceRepository;



    @Override
    public Annonce requestToEntity(
            AnnonceRequestDto annonceRequestDto) {

        if (annonceRequestDto == null) {
            return null;
        }


        Categorie categorie = null;

        if (annonceRequestDto.getCategorieId() != null) {
            categorie = categorieRepository
                    .findById(annonceRequestDto.getCategorieId())
                    .orElse(null);
        }

        Utilisateur utilisateur = null;

        if (annonceRequestDto.getUtilisateurId() != null) {
            utilisateur = utilisateurRepository
                    .findById(annonceRequestDto.getUtilisateurId())
                    .orElse(null);
        }

        Location locationOrigine = null;

        if (annonceRequestDto.getLocationOrigineId() != null) {
            locationOrigine = locationRepository
                    .findById(annonceRequestDto.getLocationOrigineId())
                    .orElse(null);
        }



        List<Conversation> conversations = Collections.emptyList();

        if (annonceRequestDto.getConversationIds() != null
                && !annonceRequestDto.getConversationIds().isEmpty()) {

            conversations = conversationRepository.findAllById(
                    annonceRequestDto.getConversationIds()
            );
        }


        List<DocumentAnnonce> documentAnnonces = Collections.emptyList();

        if (annonceRequestDto.getDocumentAnnonceIds() != null
                && !annonceRequestDto.getDocumentAnnonceIds().isEmpty()) {

            documentAnnonces = documentAnnonceRepository.findAllById(
                    annonceRequestDto.getDocumentAnnonceIds()
            );
        }

        Set<IncotermAnnonce> annoncesIncoterm = Collections.emptySet();

        if (annonceRequestDto.getAnnonceIncotermIds() != null
                && !annonceRequestDto.getAnnonceIncotermIds().isEmpty()) {

            annoncesIncoterm = annonceRequestDto.getAnnonceIncotermIds()
                    .stream()
                    .map(id -> incotermAnnonceRepository
                            .findById(id)
                            .orElse(null))
                    .filter(java.util.Objects::nonNull)
                    .collect(Collectors.toSet());
        }


        return Annonce.builder()
                .titre(annonceRequestDto.getTitre())
                .certification(annonceRequestDto.getCertification())
                .description(annonceRequestDto.getDescription())
                .type(annonceRequestDto.getType())
                .prix(annonceRequestDto.getPrix())
                .devise(annonceRequestDto.getDevise())
                .quantite(annonceRequestDto.getQuantite())
                .uniteQuantite(annonceRequestDto.getUniteQuantite())
                .dateLimite(annonceRequestDto.getDateLimite())
                .statut(annonceRequestDto.getStatut())
                .dureeLivraison(annonceRequestDto.getDureeLivraison())
                .uniteDureeLivraison(
                        annonceRequestDto.getUniteDureeLivraison()
                )
                .createdAt(annonceRequestDto.getCreatedAt())
                .updatedAt(annonceRequestDto.getUpdatedAt())
                .publishedAt(annonceRequestDto.getPublishedAt())
                .categorie(categorie)
                .utilisateur(utilisateur)
                .locationOrigine(locationOrigine)
                .conversations(conversations)
                .documentAnnonces(documentAnnonces)
                .annonces(annoncesIncoterm)

                .build();
    }


    @Override
    public AnnonceRequestDto entityToRequest(
            Annonce annonce) {

        if (annonce == null) {
            return null;
        }


        UUID categorieId = null;

        if (annonce.getCategorie() != null) {
            categorieId = annonce.getCategorie()
                    .getCategorieId();
        }


        UUID utilisateurId = null;

        if (annonce.getUtilisateur() != null) {
            utilisateurId = annonce.getUtilisateur()
                    .getUtilisateurId();
        }


        UUID locationOrigineId = null;

        if (annonce.getLocationOrigine() != null) {
            locationOrigineId = annonce.getLocationOrigine()
                    .getLocationId();
        }




        List<UUID> conversationIds = Collections.emptyList();

        if (annonce.getConversations() != null) {

            conversationIds = annonce.getConversations()
                    .stream()
                    .map(Conversation::getConversationId)
                    .collect(Collectors.toList());
        }


        List<UUID> documentAnnonceIds = Collections.emptyList();

        if (annonce.getDocumentAnnonces() != null) {

            documentAnnonceIds = annonce.getDocumentAnnonces()
                    .stream()
                    .map(DocumentAnnonce::getDocumentAnnonceId)
                    .collect(Collectors.toList());
        }


        Set<UUID> annonceIncotermIds = Collections.emptySet();

        if (annonce.getAnnonces() != null) {

            annonceIncotermIds = annonce.getAnnonces()
                    .stream()
                    .map(IncotermAnnonce::getIncotermAnnonceId)
                    .collect(Collectors.toSet());
        }


        return AnnonceRequestDto.builder()

                // Relations
                .categorieId(categorieId)
                .utilisateurId(utilisateurId)
                .locationOrigineId(locationOrigineId)

                // Informations Annonce
                .titre(annonce.getTitre())
                .certification(annonce.getCertification())
                .description(annonce.getDescription())
                .type(annonce.getType())
                .prix(annonce.getPrix())
                .devise(annonce.getDevise())
                .quantite(annonce.getQuantite())
                .uniteQuantite(annonce.getUniteQuantite())
                .dateLimite(annonce.getDateLimite())
                .statut(annonce.getStatut())
                .dureeLivraison(annonce.getDureeLivraison())
                .uniteDureeLivraison(
                        annonce.getUniteDureeLivraison()
                )
                .createdAt(annonce.getCreatedAt())
                .updatedAt(annonce.getUpdatedAt())
                .publishedAt(annonce.getPublishedAt())

                // Relations
                .conversationIds(conversationIds)
                .documentAnnonceIds(documentAnnonceIds)
                .annonceIncotermIds(annonceIncotermIds)

                .build();
    }


    @Override
    public AnnonceResponseDto entityToResponse(
            Annonce annonce) {

        if (annonce == null) {
            return null;
        }


        UUID categorieId = null;

        if (annonce.getCategorie() != null) {
            categorieId = annonce.getCategorie()
                    .getCategorieId();
        }


        UUID utilisateurId = null;

        if (annonce.getUtilisateur() != null) {
            utilisateurId = annonce.getUtilisateur()
                    .getUtilisateurId();
        }


        UUID locationOrigineId = null;

        if (annonce.getLocationOrigine() != null) {
            locationOrigineId = annonce.getLocationOrigine()
                    .getLocationId();
        }




        List<UUID> conversationIds = Collections.emptyList();

        if (annonce.getConversations() != null) {

            conversationIds = annonce.getConversations()
                    .stream()
                    .map(Conversation::getConversationId)
                    .collect(Collectors.toList());
        }


        List<UUID> documentAnnonceIds = Collections.emptyList();

        if (annonce.getDocumentAnnonces() != null) {

            documentAnnonceIds = annonce.getDocumentAnnonces()
                    .stream()
                    .map(DocumentAnnonce::getDocumentAnnonceId)
                    .collect(Collectors.toList());
        }


        Set<UUID> annonceIncotermIds = Collections.emptySet();

        if (annonce.getAnnonces() != null) {

            annonceIncotermIds = annonce.getAnnonces()
                    .stream()
                    .map(IncotermAnnonce::getIncotermAnnonceId)
                    .collect(Collectors.toSet());
        }


        return AnnonceResponseDto.builder()

                // IDs des relations
                .categorieId(categorieId)
                .utilisateurId(utilisateurId)
                .locationOrigineId(locationOrigineId)

                // ID de l'annonce
                .annonceId(annonce.getAnnonceId())

                // Informations Annonce
                .titre(annonce.getTitre())
                .certification(annonce.getCertification())
                .description(annonce.getDescription())
                .type(annonce.getType())
                .prix(annonce.getPrix())
                .devise(annonce.getDevise())
                .quantite(annonce.getQuantite())
                .uniteQuantite(annonce.getUniteQuantite())
                .dateLimite(annonce.getDateLimite())
                .statut(annonce.getStatut())
                .dureeLivraison(annonce.getDureeLivraison())
                .uniteDureeLivraison(
                        annonce.getUniteDureeLivraison()
                )
                .createdAt(annonce.getCreatedAt())
                .updatedAt(annonce.getUpdatedAt())
                .publishedAt(annonce.getPublishedAt())

                // IDs des relations
                .conversationIds(conversationIds)
                .documentAnnonceIds(documentAnnonceIds)
                .annonceIncotermIds(annonceIncotermIds)

                .build();
    }


    @Override
    public Annonce responseToEntity(
            AnnonceResponseDto annonceResponseDto) {

        if (annonceResponseDto == null) {
            return null;
        }


        Categorie categorie = null;

        if (annonceResponseDto.getCategorieId() != null) {
            categorie = categorieRepository
                    .findById(annonceResponseDto.getCategorieId())
                    .orElse(null);
        }


        Utilisateur utilisateur = null;

        if (annonceResponseDto.getUtilisateurId() != null) {
            utilisateur = utilisateurRepository
                    .findById(annonceResponseDto.getUtilisateurId())
                    .orElse(null);
        }


        Location locationOrigine = null;

        if (annonceResponseDto.getLocationOrigineId() != null) {
            locationOrigine = locationRepository
                    .findById(annonceResponseDto.getLocationOrigineId())
                    .orElse(null);
        }





        List<Conversation> conversations = Collections.emptyList();

        if (annonceResponseDto.getConversationIds() != null
                && !annonceResponseDto.getConversationIds().isEmpty()) {

            conversations = conversationRepository.findAllById(
                    annonceResponseDto.getConversationIds()
            );
        }


        List<DocumentAnnonce> documentAnnonces = Collections.emptyList();

        if (annonceResponseDto.getDocumentAnnonceIds() != null
                && !annonceResponseDto.getDocumentAnnonceIds().isEmpty()) {

            documentAnnonces = documentAnnonceRepository.findAllById(
                    annonceResponseDto.getDocumentAnnonceIds()
            );
        }


        Set<IncotermAnnonce> annoncesIncoterm = Collections.emptySet();

        if (annonceResponseDto.getAnnonceIncotermIds() != null
                && !annonceResponseDto.getAnnonceIncotermIds().isEmpty()) {

            annoncesIncoterm = annonceResponseDto.getAnnonceIncotermIds()
                    .stream()
                    .map(id -> incotermAnnonceRepository
                            .findById(id)
                            .orElse(null))
                    .filter(java.util.Objects::nonNull)
                    .collect(Collectors.toSet());
        }


        return Annonce.builder()

                // ID
                .annonceId(annonceResponseDto.getAnnonceId())

                // Informations Annonce
                .titre(annonceResponseDto.getTitre())
                .certification(
                        annonceResponseDto.getCertification()
                )
                .description(
                        annonceResponseDto.getDescription()
                )
                .type(annonceResponseDto.getType())
                .prix(annonceResponseDto.getPrix())
                .devise(annonceResponseDto.getDevise())
                .quantite(annonceResponseDto.getQuantite())
                .uniteQuantite(
                        annonceResponseDto.getUniteQuantite()
                )
                .dateLimite(
                        annonceResponseDto.getDateLimite()
                )
                .statut(annonceResponseDto.getStatut())
                .dureeLivraison(
                        annonceResponseDto.getDureeLivraison()
                )
                .uniteDureeLivraison(
                        annonceResponseDto.getUniteDureeLivraison()
                )
                .createdAt(
                        annonceResponseDto.getCreatedAt()
                )
                .updatedAt(
                        annonceResponseDto.getUpdatedAt()
                )
                .publishedAt(
                        annonceResponseDto.getPublishedAt()
                )

                // Relations
                .categorie(categorie)
                .utilisateur(utilisateur)
                .locationOrigine(locationOrigine)
                .conversations(conversations)
                .documentAnnonces(documentAnnonces)
                .annonces(annoncesIncoterm)

                .build();
    }
}
