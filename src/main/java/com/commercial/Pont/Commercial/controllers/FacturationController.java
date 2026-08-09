package com.commercial.Pont.Commercial.controllers;

import com.commercial.Pont.Commercial.dtos.requestDtos.FacturationRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.FacturationResponseDto;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.FacturationServiceInterface;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/facturations")
@RequiredArgsConstructor
public class FacturationController {

    private final FacturationServiceInterface facturationService;


    // =========================
    // CREATE
    // =========================

    @PostMapping
    public ResponseEntity<FacturationResponseDto> create(
            @RequestBody FacturationRequestDto facturationRequestDto
    ) {

        FacturationResponseDto response =
                facturationService.create(
                        facturationRequestDto
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }


    // =========================
    // UPDATE
    // =========================

    @PutMapping("/{facturationId}")
    public ResponseEntity<FacturationResponseDto> update(
            @PathVariable UUID facturationId,
            @RequestBody FacturationRequestDto facturationRequestDto
    ) {

        FacturationResponseDto response =
                facturationService.update(
                        facturationId,
                        facturationRequestDto
                );

        return ResponseEntity.ok(response);
    }


    // =========================
    // GET BY ID
    // =========================

    @GetMapping("/{facturationId}")
    public ResponseEntity<FacturationResponseDto> getById(
            @PathVariable UUID facturationId
    ) {

        FacturationResponseDto response =
                facturationService.getById(
                        facturationId
                );

        return ResponseEntity.ok(response);
    }


    // =========================
    // GET ALL
    // =========================

    @GetMapping
    public ResponseEntity<List<FacturationResponseDto>> getAll() {

        List<FacturationResponseDto> response =
                facturationService.getAll();

        return ResponseEntity.ok(response);
    }


    // =========================
    // DELETE
    // =========================

    @DeleteMapping("/{facturationId}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID facturationId
    ) {

        facturationService.delete(
                facturationId
        );

        return ResponseEntity.noContent().build();
    }
}