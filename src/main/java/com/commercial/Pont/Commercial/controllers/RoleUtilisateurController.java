package com.commercial.Pont.Commercial.controllers;

import com.commercial.Pont.Commercial.dtos.requestDtos.RoleUtilisateurRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.RoleUtilisateurResponseDto;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.RoleUtilisateurServiceInterface;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/roles-utilisateurs")
@RequiredArgsConstructor
public class RoleUtilisateurController {

    private final RoleUtilisateurServiceInterface roleUtilisateurService;

    @PostMapping
    public ResponseEntity<RoleUtilisateurResponseDto> create(
            @RequestBody RoleUtilisateurRequestDto roleUtilisateurRequestDto
    ) {
        RoleUtilisateurResponseDto response =
                roleUtilisateurService.create(roleUtilisateurRequestDto);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @PutMapping("/{roleUtilisateurId}")
    public ResponseEntity<RoleUtilisateurResponseDto> update(
            @PathVariable UUID roleUtilisateurId,
            @RequestBody RoleUtilisateurRequestDto roleUtilisateurRequestDto
    ) {
        return ResponseEntity.ok(
                roleUtilisateurService.update(
                        roleUtilisateurId,
                        roleUtilisateurRequestDto
                )
        );
    }

    @GetMapping("/{roleUtilisateurId}")
    public ResponseEntity<RoleUtilisateurResponseDto> getById(
            @PathVariable UUID roleUtilisateurId
    ) {
        return ResponseEntity.ok(
                roleUtilisateurService.getById(roleUtilisateurId)
        );
    }

    @GetMapping
    public ResponseEntity<List<RoleUtilisateurResponseDto>> getAll() {
        return ResponseEntity.ok(
                roleUtilisateurService.getAll()
        );
    }

    @DeleteMapping("/{roleUtilisateurId}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID roleUtilisateurId
    ) {
        roleUtilisateurService.delete(roleUtilisateurId);
        return ResponseEntity.noContent().build();
    }




    @PostMapping("/affecterRoleToUtilisateur")
    public ResponseEntity<RoleUtilisateurResponseDto> affecterRole(
            @RequestParam UUID utilisateurId,
            @RequestParam UUID roleId
    ) {

        return ResponseEntity.ok(
                roleUtilisateurService.affecterRoleToUtilisateur(
                        utilisateurId,
                        roleId
                )
        );
    }


    @DeleteMapping("/retirerRoleDeUtilisateur")
    public ResponseEntity<Void> retirerRole(
            @RequestParam UUID utilisateurId,
            @RequestParam UUID roleId
    ) {

        roleUtilisateurService.retirerRoleDeUtilisateur(
                utilisateurId,
                roleId
        );

        return ResponseEntity.noContent().build();
    }

}
