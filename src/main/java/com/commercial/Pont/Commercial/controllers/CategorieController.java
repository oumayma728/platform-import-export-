package com.commercial.Pont.Commercial.controllers;

import com.commercial.Pont.Commercial.dtos.requestDtos.CategorieRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.CategorieResponseDto;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.CategorieServiceInterface;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/categories")
@RequiredArgsConstructor
public class CategorieController {

    private final CategorieServiceInterface categorieService;


    // =========================
    // CREATE
    // =========================

    @PostMapping("/createCategorie")
    public ResponseEntity<CategorieResponseDto> create(
            @RequestBody CategorieRequestDto categorieRequestDto
    ) {

        CategorieResponseDto response =
                categorieService.create(
                        categorieRequestDto
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }


    // =========================
    // UPDATE
    // =========================

    @PutMapping("updateCategorie/{categorieId}")
    public ResponseEntity<CategorieResponseDto> update(
            @PathVariable UUID categorieId,
            @RequestBody CategorieRequestDto categorieRequestDto
    ) {

        CategorieResponseDto response =
                categorieService.update(
                        categorieId,
                        categorieRequestDto
                );

        return ResponseEntity.ok(response);
    }


    // =========================
    // GET BY ID
    // =========================

    @GetMapping("/getCategorie/{categorieId}")
    public ResponseEntity<CategorieResponseDto> getById(
            @PathVariable UUID categorieId
    ) {

        CategorieResponseDto response =
                categorieService.getById(
                        categorieId
                );

        return ResponseEntity.ok(response);
    }


    // =========================
    // GET ALL
    // =========================

    @GetMapping("/getAllCategories")
    public ResponseEntity<List<CategorieResponseDto>> getAll() {

        List<CategorieResponseDto> response =
                categorieService.getAll();

        return ResponseEntity.ok(response);
    }


    // =========================
    // DELETE
    // =========================

    @DeleteMapping("/deleteCategorie/{categorieId}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID categorieId
    ) {

        categorieService.delete(
                categorieId
        );

        return ResponseEntity.noContent().build();
    }
}