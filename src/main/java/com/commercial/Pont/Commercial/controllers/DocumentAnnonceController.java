package com.commercial.Pont.Commercial.controllers;

import com.commercial.Pont.Commercial.dtos.requestDtos.DocumentAnnonceRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.DocumentAnnonceResponseDto;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.DocumentAnnonceServiceInterface;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/documents-annonces")
@RequiredArgsConstructor
public class DocumentAnnonceController {

    private final DocumentAnnonceServiceInterface documentAnnonceService;


    // =========================
    // CREATE
    // =========================

    @PostMapping
    public ResponseEntity<DocumentAnnonceResponseDto> create(
            @RequestBody DocumentAnnonceRequestDto documentAnnonceRequestDto
    ) {

        DocumentAnnonceResponseDto response =
                documentAnnonceService.create(
                        documentAnnonceRequestDto
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }


    // =========================
    // UPDATE
    // =========================

    @PutMapping("/{documentAnnonceId}")
    public ResponseEntity<DocumentAnnonceResponseDto> update(
            @PathVariable UUID documentAnnonceId,
            @RequestBody DocumentAnnonceRequestDto documentAnnonceRequestDto
    ) {

        DocumentAnnonceResponseDto response =
                documentAnnonceService.update(
                        documentAnnonceId,
                        documentAnnonceRequestDto
                );

        return ResponseEntity.ok(response);
    }


    // =========================
    // GET BY ID
    // =========================

    @GetMapping("/{documentAnnonceId}")
    public ResponseEntity<DocumentAnnonceResponseDto> getById(
            @PathVariable UUID documentAnnonceId
    ) {

        DocumentAnnonceResponseDto response =
                documentAnnonceService.getById(
                        documentAnnonceId
                );

        return ResponseEntity.ok(response);
    }


    // =========================
    // GET ALL
    // =========================

    @GetMapping
    public ResponseEntity<List<DocumentAnnonceResponseDto>> getAll() {

        List<DocumentAnnonceResponseDto> response =
                documentAnnonceService.getAll();

        return ResponseEntity.ok(response);
    }


    // =========================
    // DELETE
    // =========================

    @DeleteMapping("/{documentAnnonceId}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID documentAnnonceId
    ) {

        documentAnnonceService.delete(
                documentAnnonceId
        );

        return ResponseEntity.noContent().build();
    }
}