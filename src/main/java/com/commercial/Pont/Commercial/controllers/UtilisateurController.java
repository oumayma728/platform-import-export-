package com.commercial.Pont.Commercial.controllers;

import com.commercial.Pont.Commercial.dtos.requestDtos.UtilisateurRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.UtilisateurResponseDto;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.UtilisateurServiceInterface;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/utilisateurs")
@RequiredArgsConstructor
public class UtilisateurController {

    private final UtilisateurServiceInterface utilisateurService;

    @PostMapping(
            value = "/createUtilisateur",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<UtilisateurResponseDto> create(
            @RequestPart("utilisateur") UtilisateurRequestDto utilisateurRequestDto,
            @RequestPart(value = "photo", required = false) MultipartFile photo
    ) {

        UtilisateurResponseDto response =
                utilisateurService.create(
                        utilisateurRequestDto,
                        photo
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @PutMapping("/updateUtilisateur/{utilisateurId}")
    public ResponseEntity<UtilisateurResponseDto> update(
            @PathVariable UUID utilisateurId,
            @RequestBody UtilisateurRequestDto utilisateurRequestDto
    ) {
        return ResponseEntity.ok(
                utilisateurService.update(
                        utilisateurId,
                        utilisateurRequestDto
                )
        );
    }

    @GetMapping("/getUtilisateur/{utilisateurId}")
    public ResponseEntity<UtilisateurResponseDto> getById(
            @PathVariable UUID utilisateurId
    ) {
        return ResponseEntity.ok(
                utilisateurService.getById(utilisateurId)
        );
    }

    @GetMapping("getAllUtilisateurs")
    public ResponseEntity<List<UtilisateurResponseDto>> getAll() {
        return ResponseEntity.ok(
                utilisateurService.getAll()
        );
    }

    @DeleteMapping("/deleteUtilisateur/{utilisateurId}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID utilisateurId
    ) {
        utilisateurService.delete(utilisateurId);
        return ResponseEntity.noContent().build();
    }






    // =========================
// Validation
// =========================

    @PatchMapping("/validerUtilisateur/{utilisateurId}")
    public ResponseEntity<UtilisateurResponseDto> validerUtilisateur(
            @PathVariable UUID utilisateurId
    ) {
        return ResponseEntity.ok(
                utilisateurService.validerUtilisateur(
                        utilisateurId
                )
        );
    }


// =========================
// Rejet
// =========================

    @PatchMapping("/rejeterUtilisateur/{utilisateurId}")
    public ResponseEntity<UtilisateurResponseDto> rejeterUtilisateur(
            @PathVariable UUID utilisateurId
    ) {
        return ResponseEntity.ok(
                utilisateurService.rejeterUtilisateur(
                        utilisateurId
                )
        );
    }


// =========================
// Suspension
// =========================

    @PatchMapping("/suspendreUtilisateur/{utilisateurId}")
    public ResponseEntity<UtilisateurResponseDto> suspendreUtilisateur(
            @PathVariable UUID utilisateurId
    ) {
        return ResponseEntity.ok(
                utilisateurService.suspendreUtilisateur(
                        utilisateurId
                )
        );
    }

}
