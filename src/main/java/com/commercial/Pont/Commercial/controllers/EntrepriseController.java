package com.commercial.Pont.Commercial.controllers;

import com.commercial.Pont.Commercial.dtos.requestDtos.EntrepriseRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.EntrepriseResponseDto;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.EntrepriseServiceInterface;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/entreprises")
@RequiredArgsConstructor
public class EntrepriseController {

    private final EntrepriseServiceInterface entrepriseService;


    // =========================
    // CREATE
    // =========================

    @PostMapping("/createEntreprise")
    public ResponseEntity<EntrepriseResponseDto> create(
            @RequestBody EntrepriseRequestDto entrepriseRequestDto
    ) {

        EntrepriseResponseDto response =
                entrepriseService.create(
                        entrepriseRequestDto
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }


    // =========================
    // UPDATE
    // =========================

    @PutMapping("/updateEntreprise/{entrepriseId}")
    public ResponseEntity<EntrepriseResponseDto> update(
            @PathVariable UUID entrepriseId,
            @RequestBody EntrepriseRequestDto entrepriseRequestDto
    ) {

        EntrepriseResponseDto response =
                entrepriseService.update(
                        entrepriseId,
                        entrepriseRequestDto
                );

        return ResponseEntity.ok(response);
    }


    // =========================
    // GET BY ID
    // =========================

    @GetMapping("/getEntreprise/{entrepriseId}")
    public ResponseEntity<EntrepriseResponseDto> getById(
            @PathVariable UUID entrepriseId
    ) {

        EntrepriseResponseDto response =
                entrepriseService.getById(
                        entrepriseId
                );

        return ResponseEntity.ok(response);
    }


    // =========================
    // GET ALL
    // =========================

    @GetMapping("/getAllEntreprises")
    public ResponseEntity<List<EntrepriseResponseDto>> getAll() {

        List<EntrepriseResponseDto> response =
                entrepriseService.getAll();

        return ResponseEntity.ok(response);
    }


    // =========================
    // DELETE
    // =========================

    @DeleteMapping("/deleteEntreprise/{entrepriseId}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID entrepriseId
    ) {

        entrepriseService.delete(
                entrepriseId
        );

        return ResponseEntity.noContent().build();
    }
}