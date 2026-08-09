package com.commercial.Pont.Commercial.controllers;

import com.commercial.Pont.Commercial.dtos.requestDtos.RoleRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.RoleResponseDto;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.RoleServiceInterface;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/roles")
@RequiredArgsConstructor
public class RoleController {

    private final RoleServiceInterface roleService;

    @PostMapping("/create-Role")
    public ResponseEntity<RoleResponseDto> create(
            @RequestBody RoleRequestDto roleRequestDto
    ) {
        RoleResponseDto response =
                roleService.create(roleRequestDto);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @PutMapping("/updateRole/{roleId}")
    public ResponseEntity<RoleResponseDto> update(
            @PathVariable UUID roleId,
            @RequestBody RoleRequestDto roleRequestDto
    ) {
        return ResponseEntity.ok(
                roleService.update(roleId, roleRequestDto)
        );
    }

    @GetMapping("/getRole/{roleId}")
    public ResponseEntity<RoleResponseDto> getById(
            @PathVariable UUID roleId
    ) {
        return ResponseEntity.ok(
                roleService.getById(roleId)
        );
    }

    @GetMapping("/getAllRoles")
    public ResponseEntity<List<RoleResponseDto>> getAll() {
        return ResponseEntity.ok(
                roleService.getAll()
        );
    }

    @DeleteMapping("/deleteRole/{roleId}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID roleId
    ) {
        roleService.delete(roleId);
        return ResponseEntity.noContent().build();
    }

}
