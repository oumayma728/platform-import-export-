package com.commercial.Pont.Commercial.controllers;

import com.commercial.Pont.Commercial.dtos.requestDtos.AnnonceRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.AnnonceResponseDto;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.AnnonceServiceInterface;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/listings")
@RequiredArgsConstructor
public class AnnonceController {

    private final AnnonceServiceInterface annonceService;


    // =========================
    // CREATE
    // =========================

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


    // =========================
    // UPDATE
    // =========================

    @PutMapping("/updateAnnonce/{annonceId}")
    public ResponseEntity<AnnonceResponseDto> update(
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

    @GetMapping("/getAnnonce/{annonceId}")
    public ResponseEntity<AnnonceResponseDto> getById(
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

    @GetMapping("/getAllAnnonces")
    public ResponseEntity<List<AnnonceResponseDto>> getAll() {

        List<AnnonceResponseDto> response =
                annonceService.getAll();

        return ResponseEntity.ok(response);
    }


    // =========================
    // DELETE
    // =========================

    @DeleteMapping("/deleteAnnonce/{annonceId}")
    public ResponseEntity<Void> delete(
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

    @PatchMapping("/suspendreAnnonce/{annonceId}")
    public ResponseEntity<AnnonceResponseDto> suspendreAnnonce(
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

    @PatchMapping("/cloturerAnnonce/{annonceId}")
    public ResponseEntity<AnnonceResponseDto> cloturerAnnonce(
            @PathVariable UUID annonceId
    ) {

        return ResponseEntity.ok(
                annonceService.cloturerAnnonce(
                        annonceId
                )
        );
    }







    @GetMapping("/search")
    public ResponseEntity<List<AnnonceResponseDto>> rechercher(

            @RequestParam(required = false)
            String pays,

            @RequestParam(required = false)
            String categorie,

            @RequestParam(required = false)
            Double prixMin,

            @RequestParam(required = false)
            Double prixMax,

            @RequestParam(required = false)
            String certification

    ) {

        return ResponseEntity.ok(

                annonceService.rechercher(
                        pays,
                        categorie,
                        prixMin,
                        prixMax,
                        certification
                )

        );

    }




    @GetMapping("/utilisateur/{utilisateurId}")
    public ResponseEntity<List<AnnonceResponseDto>>
    getAnnoncesByUtilisateur(
            @PathVariable UUID utilisateurId
    ) {

        return ResponseEntity.ok(
                annonceService.getAnnoncesByUtilisateur(
                        utilisateurId
                )
        );
    }



    @GetMapping("/offres")
    public ResponseEntity<List<AnnonceResponseDto>> getOffres() {

        return ResponseEntity.ok(
                annonceService.getOffres()
        );
    }



    @GetMapping("/demandes")
    public ResponseEntity<List<AnnonceResponseDto>> getDemandes() {

        return ResponseEntity.ok(
                annonceService.getDemandes()
        );
    }


    @GetMapping("/utilisateur/{utilisateurId}/offres")
    public ResponseEntity<List<AnnonceResponseDto>>
    getOffresByUtilisateur(
            @PathVariable UUID utilisateurId
    ) {

        return ResponseEntity.ok(
                annonceService.getOffresByUtilisateur(
                        utilisateurId
                )
        );
    }


    @GetMapping("/utilisateur/{utilisateurId}/demandes")
    public ResponseEntity<List<AnnonceResponseDto>>
    getDemandesByUtilisateur(
            @PathVariable UUID utilisateurId
    ) {

        return ResponseEntity.ok(
                annonceService.getDemandesByUtilisateur(
                        utilisateurId
                )
        );
    }
}

