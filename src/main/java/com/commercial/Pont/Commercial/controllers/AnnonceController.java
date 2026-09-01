package com.commercial.Pont.Commercial.controllers;

import com.commercial.Pont.Commercial.dtos.requestDtos.AnnonceRequestDto;
import com.commercial.Pont.Commercial.dtos.requestDtos.CreateMyAnnonceRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.AnnonceResponseDto;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.AnnonceServiceInterface;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/listings")
@RequiredArgsConstructor
@Tag(
        name = "Annonces",
        description = "Gestion, publication, recherche et consultation des annonces d'importation et d'exportation"
)
public class AnnonceController {

    private final AnnonceServiceInterface annonceService;


    // =========================
    // CREATE
    // =========================
    @Operation(
            summary = "Créer une annonce",
            description = "Crée une nouvelle annonce à partir des informations fournies."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Annonce créée avec succès"),
            @ApiResponse(responseCode = "400", description = "Données de l'annonce invalides"),
            @ApiResponse(responseCode = "401", description = "Utilisateur non authentifié"),
            @ApiResponse(responseCode = "403", description = "Accès refusé")
    })
    @PostMapping("/createAnnonce")
    public ResponseEntity<AnnonceResponseDto> create(
            @RequestBody AnnonceRequestDto annonceRequestDto
    ) {

        AnnonceResponseDto response =
                annonceService.create(
                        annonceRequestDto
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }




    @Operation(
            summary = "Créer une annonce pour l'utilisateur connecté",
            description = "Crée une nouvelle annonce et l'associe automatiquement à l'utilisateur authentifié."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Annonce créée avec succès"),
            @ApiResponse(responseCode = "400", description = "Données de l'annonce invalides"),
            @ApiResponse(responseCode = "401", description = "Utilisateur non authentifié"),
            @ApiResponse(responseCode = "403", description = "Compte non autorisé à publier une annonce")
    })
    @PostMapping("/createMyAnnonce")
    public ResponseEntity<AnnonceResponseDto> createMyAnnonce(
            @RequestBody CreateMyAnnonceRequestDto annonceRequestDto,
            Authentication authentication
    ) {

        AnnonceResponseDto response =
                annonceService.createMyAnnonce(
                        annonceRequestDto,
                        authentication
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }


    // =========================
    // UPDATE
    // =========================
    @Operation(
            summary = "Modifier une annonce",
            description = "Modifie les informations d'une annonce existante."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Annonce modifiée avec succès"),
            @ApiResponse(responseCode = "400", description = "Données de l'annonce invalides"),
            @ApiResponse(responseCode = "401", description = "Utilisateur non authentifié"),
            @ApiResponse(responseCode = "403", description = "Accès refusé"),
            @ApiResponse(responseCode = "404", description = "Annonce introuvable")
    })
    @PutMapping("/updateAnnonce/{annonceId}")
    public ResponseEntity<AnnonceResponseDto> update(
            @Parameter(
                    description = "Identifiant UUID de l'annonce",
                    required = true
            )
            @PathVariable UUID annonceId,
            @RequestBody AnnonceRequestDto annonceRequestDto
    ) {

        AnnonceResponseDto response =
                annonceService.update(
                        annonceId,
                        annonceRequestDto
                );

        return ResponseEntity.ok(response);
    }


    // =========================
    // GET BY ID
    // =========================
    @Operation(
            summary = "Récupérer une annonce",
            description = "Retourne les informations détaillées d'une annonce à partir de son identifiant."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Annonce récupérée avec succès"),
            @ApiResponse(responseCode = "404", description = "Annonce introuvable")
    })
    @GetMapping("/getAnnonce/{annonceId}")
    public ResponseEntity<AnnonceResponseDto> getById(
            @Parameter(
                    description = "Identifiant UUID de l'annonce",
                    required = true
            )
            @PathVariable UUID annonceId
    ) {

        AnnonceResponseDto response =
                annonceService.getById(
                        annonceId
                );

        return ResponseEntity.ok(response);
    }


    // =========================
    // GET ALL
    // =========================
    @Operation(
            summary = "Lister toutes les annonces",
            description = "Retourne la liste de toutes les annonces disponibles."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Liste des annonces récupérée avec succès")
    })
    @GetMapping("/getAllAnnonces")
    public ResponseEntity<List<AnnonceResponseDto>> getAll() {

        List<AnnonceResponseDto> response =
                annonceService.getAll();

        return ResponseEntity.ok(response);
    }


    // =========================
    // DELETE
    // =========================
    @Operation(
            summary = "Supprimer une annonce",
            description = "Supprime définitivement une annonce à partir de son identifiant."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Annonce supprimée avec succès"),
            @ApiResponse(responseCode = "401", description = "Utilisateur non authentifié"),
            @ApiResponse(responseCode = "403", description = "Accès refusé"),
            @ApiResponse(responseCode = "404", description = "Annonce introuvable")
    })
    @DeleteMapping("/deleteAnnonce/{annonceId}")
    public ResponseEntity<Void> delete(
            @Parameter(
                    description = "Identifiant UUID de l'annonce",
                    required = true
            )
            @PathVariable UUID annonceId
    ) {

        annonceService.delete(
                annonceId
        );

        return ResponseEntity.noContent().build();
    }





    // =========================
// SUSPENDRE
// =========================
    @Operation(
            summary = "Suspendre une annonce",
            description = "Change le statut d'une annonce afin de la suspendre."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Annonce suspendue avec succès"),
            @ApiResponse(responseCode = "400", description = "L'annonce ne peut pas être suspendue dans son état actuel"),
            @ApiResponse(responseCode = "401", description = "Utilisateur non authentifié"),
            @ApiResponse(responseCode = "403", description = "Accès refusé"),
            @ApiResponse(responseCode = "404", description = "Annonce introuvable")
    })
    @PatchMapping("/suspendreAnnonce/{annonceId}")
    public ResponseEntity<AnnonceResponseDto> suspendreAnnonce(
            @Parameter(
                    description = "Identifiant UUID de l'annonce",
                    required = true
            )
            @PathVariable UUID annonceId
    ) {

        return ResponseEntity.ok(
                annonceService.suspendreAnnonce(
                        annonceId
                )
        );
    }


// =========================
// CLOTURER
// =========================
@Operation(
        summary = "Clôturer une annonce",
        description = "Change le statut d'une annonce afin de la clôturer."
)
@ApiResponses({
        @ApiResponse(responseCode = "200", description = "Annonce clôturée avec succès"),
        @ApiResponse(responseCode = "400", description = "L'annonce ne peut pas être clôturée dans son état actuel"),
        @ApiResponse(responseCode = "401", description = "Utilisateur non authentifié"),
        @ApiResponse(responseCode = "403", description = "Accès refusé"),
        @ApiResponse(responseCode = "404", description = "Annonce introuvable")
})
    @PatchMapping("/cloturerAnnonce/{annonceId}")
    public ResponseEntity<AnnonceResponseDto> cloturerAnnonce(
        @Parameter(
                description = "Identifiant UUID de l'annonce",
                required = true
        )
            @PathVariable UUID annonceId
    ) {

        return ResponseEntity.ok(
                annonceService.cloturerAnnonce(
                        annonceId
                )
        );
    }






    @Operation(
            summary = "Rechercher des annonces",
            description = """
                Recherche les annonces selon plusieurs critères optionnels :
                pays, catégorie, intervalle de prix, devise et certification.

                Lorsque la devise est fournie, les prix peuvent être retournés
                convertis dans la devise demandée.
                """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Recherche effectuée avec succès"),
            @ApiResponse(responseCode = "400", description = "Paramètres de recherche invalides"),
            @ApiResponse(responseCode = "502", description = "Erreur du service externe de conversion de devise")
    })
    @GetMapping("/search")
    public ResponseEntity<List<AnnonceResponseDto>> rechercher(

            @Parameter(description = "Pays recherché", example = "Maroc")
            @RequestParam(required = false)
            String pays,

            @Parameter(description = "Catégorie recherchée", example = "Agriculture")
            @RequestParam(required = false)
            String categorie,

            @Parameter(description = "Prix minimum", example = "100")
            @RequestParam(required = false)
            Double prixMin,

            @Parameter(description = "Prix maximum", example = "5000")
            @RequestParam(required = false)
            Double prixMax,

            @Parameter(
                    description = "Devise cible utilisée pour l'affichage des prix",
                    example = "EUR"
            )
            @RequestParam(required = false)
            String devise,

            @Parameter(
                    description = "Certification recherchée",
                    example = "ISO 9001"
            )
            @RequestParam(required = false)
            String certification

    ) {

        return ResponseEntity.ok(

                annonceService.rechercher(
                        pays,
                        categorie,
                        prixMin,
                        prixMax,
                        certification,
                        devise
                )

        );

    }



    @Operation(
            summary = "Lister les annonces d'un utilisateur",
            description = "Retourne toutes les annonces publiées par un utilisateur."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Annonces récupérées avec succès"),
            @ApiResponse(responseCode = "404", description = "Utilisateur introuvable")
    })
    @GetMapping("/utilisateur/{utilisateurId}")
    public ResponseEntity<List<AnnonceResponseDto>>
    getAnnoncesByUtilisateur(
            @Parameter(
                    description = "Identifiant UUID de l'utilisateur",
                    required = true
            )
            @PathVariable UUID utilisateurId
    ) {

        return ResponseEntity.ok(
                annonceService.getAnnoncesByUtilisateur(
                        utilisateurId
                )
        );
    }




    @Operation(
            summary = "Lister les offres",
            description = "Retourne toutes les annonces de type offre."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Liste des offres récupérée avec succès")
    })
    @GetMapping("/offres")
    public ResponseEntity<List<AnnonceResponseDto>> getOffres() {

        return ResponseEntity.ok(
                annonceService.getOffres()
        );
    }



    @Operation(
            summary = "Lister les demandes",
            description = "Retourne toutes les annonces de type demande."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Liste des demandes récupérée avec succès")
    })
    @GetMapping("/demandes")
    public ResponseEntity<List<AnnonceResponseDto>> getDemandes() {

        return ResponseEntity.ok(
                annonceService.getDemandes()
        );
    }


    @Operation(
            summary = "Lister les offres d'un utilisateur",
            description = "Retourne toutes les annonces de type offre publiées par un utilisateur."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Offres récupérées avec succès"),
            @ApiResponse(responseCode = "404", description = "Utilisateur introuvable")
    })
    @GetMapping("/utilisateur/{utilisateurId}/offres")
    public ResponseEntity<List<AnnonceResponseDto>>
    getOffresByUtilisateur(
            @Parameter(
                    description = "Identifiant UUID de l'utilisateur",
                    required = true
            )
            @PathVariable UUID utilisateurId
    ) {

        return ResponseEntity.ok(
                annonceService.getOffresByUtilisateur(
                        utilisateurId
                )
        );
    }




    @Operation(
            summary = "Lister les demandes d'un utilisateur",
            description = "Retourne toutes les annonces de type demande publiées par un utilisateur."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Demandes récupérées avec succès"),
            @ApiResponse(responseCode = "404", description = "Utilisateur introuvable")
    })
    @GetMapping("/utilisateur/{utilisateurId}/demandes")
    public ResponseEntity<List<AnnonceResponseDto>>
    getDemandesByUtilisateur(
            @Parameter(
                    description = "Identifiant UUID de l'utilisateur",
                    required = true
            )
            @PathVariable UUID utilisateurId
    ) {

        return ResponseEntity.ok(
                annonceService.getDemandesByUtilisateur(
                        utilisateurId
                )
        );
    }
}

