package com.commercial.Pont.Commercial.controllers;

import com.commercial.Pont.Commercial.dtos.requestDtos.LocationRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.LocationResponseDto;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.LocationServiceInterface;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/locations")
@RequiredArgsConstructor
public class LocationController {

    private final LocationServiceInterface locationService;

    @PostMapping("/createLocation")
    public ResponseEntity<LocationResponseDto> create(
            @RequestBody LocationRequestDto locationRequestDto
    ) {

        LocationResponseDto response =
                locationService.create(
                        locationRequestDto
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @PutMapping("/updateLocation/{locationId}")
    public ResponseEntity<LocationResponseDto> update(
            @PathVariable UUID locationId,
            @RequestBody LocationRequestDto locationRequestDto
    ) {

        LocationResponseDto response =
                locationService.update(
                        locationId,
                        locationRequestDto
                );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/getLocation/{locationId}")
    public ResponseEntity<LocationResponseDto> getById(
            @PathVariable UUID locationId
    ) {

        LocationResponseDto response =
                locationService.getById(
                        locationId
                );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/getAllLocations")
    public ResponseEntity<List<LocationResponseDto>> getAll() {

        List<LocationResponseDto> response =
                locationService.getAll();

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/deleteLocation/{locationId}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID locationId
    ) {

        locationService.delete(
                locationId
        );

        return ResponseEntity.noContent().build();
    }
}