package com.commercial.Pont.Commercial.controllers;

import com.commercial.Pont.Commercial.dtos.requestDtos.AbonnementRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.AbonnementResponseDto;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.AbonnementServiceInterface;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/abonnements")
@RequiredArgsConstructor
public class AbonnementController {

    private final AbonnementServiceInterface abonnementService;


    // =========================
    // CREATE
    // =========================

    @PostMapping
    public ResponseEntity<AbonnementResponseDto> create(
            @RequestBody AbonnementRequestDto abonnementRequestDto
    ) {

        AbonnementResponseDto response =
                abonnementService.create(
                        abonnementRequestDto
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }


    // =========================
    // UPDATE
    // =========================

    @PutMapping("/{abonnementId}")
    public ResponseEntity<AbonnementResponseDto> update(
            @PathVariable UUID abonnementId,
            @RequestBody AbonnementRequestDto abonnementRequestDto
    ) {

        AbonnementResponseDto response =
                abonnementService.update(
                        abonnementId,
                        abonnementRequestDto
                );

        return ResponseEntity.ok(response);
    }


    // =========================
    // GET BY ID
    // =========================

    @GetMapping("/{abonnementId}")
    public ResponseEntity<AbonnementResponseDto> getById(
            @PathVariable UUID abonnementId
    ) {

        AbonnementResponseDto response =
                abonnementService.getById(
                        abonnementId
                );

        return ResponseEntity.ok(response);
    }


    // =========================
    // GET ALL
    // =========================

    @GetMapping
    public ResponseEntity<List<AbonnementResponseDto>> getAll() {

        List<AbonnementResponseDto> response =
                abonnementService.getAll();

        return ResponseEntity.ok(response);
    }


    // =========================
    // DELETE
    // =========================

    @DeleteMapping("/{abonnementId}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID abonnementId
    ) {

        abonnementService.delete(
                abonnementId
        );

        return ResponseEntity.noContent().build();
    }
}