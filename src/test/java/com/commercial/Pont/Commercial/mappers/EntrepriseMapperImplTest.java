package com.commercial.Pont.Commercial.mappers;

import com.commercial.Pont.Commercial.dtos.requestDtos.EntrepriseRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.EntrepriseResponseDto;
import com.commercial.Pont.Commercial.mappers.ImplementationMappers.EntrepriseMapperImpl;
import com.commercial.Pont.Commercial.models.Entreprise;
import com.commercial.Pont.Commercial.models.Location;
import com.commercial.Pont.Commercial.models.Utilisateur;
import com.commercial.Pont.Commercial.repositories.LocationRepository;
import com.commercial.Pont.Commercial.repositories.UtilisateurRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EntrepriseMapperImplTest {

    @Mock private LocationRepository locationRepository;
    @Mock private UtilisateurRepository utilisateurRepository;

    @InjectMocks
    private EntrepriseMapperImpl mapper;

    @Test
    void nullInputs_ShouldReturnNull() {
        assertNull(mapper.requestToEntity(null));
        assertNull(mapper.entityToRequest(null));
        assertNull(mapper.entityToResponse(null));
        assertNull(mapper.responseToEntity(null));
    }

    @Test
    void requestToEntity_ShouldResolveRelations() {
        UUID locationId = UUID.randomUUID();
        UUID utilisateurId = UUID.randomUUID();

        Location location = mock(Location.class);
        Utilisateur utilisateur = mock(Utilisateur.class);
        EntrepriseRequestDto dto = mock(EntrepriseRequestDto.class);

        when(dto.getLocationId()).thenReturn(locationId);
        when(dto.getUtilisateurIds()).thenReturn(List.of(utilisateurId));
        when(locationRepository.findById(locationId)).thenReturn(Optional.of(location));
        when(utilisateurRepository.findAllById(List.of(utilisateurId)))
                .thenReturn(List.of(utilisateur));

        Entreprise result = mapper.requestToEntity(dto);

        assertSame(location, result.getLocation());
        assertEquals(List.of(utilisateur), result.getUtilisateurs());
    }

    @Test
    void requestToEntity_WithoutRelations_ShouldUseNullAndEmptyRelations() {
        EntrepriseRequestDto dto = mock(EntrepriseRequestDto.class);

        Entreprise result = mapper.requestToEntity(dto);

        assertNull(result.getLocation());
        assertTrue(result.getUtilisateurs().isEmpty());
    }

    @Test
    void entityToDtos_ShouldExtractRelationIds() {
        UUID locationId = UUID.randomUUID();
        UUID utilisateurId = UUID.randomUUID();

        Location location = mock(Location.class);
        Utilisateur utilisateur = mock(Utilisateur.class);
        when(location.getLocationId()).thenReturn(locationId);
        when(utilisateur.getUtilisateurId()).thenReturn(utilisateurId);

        Entreprise entreprise = mock(Entreprise.class);
        when(entreprise.getLocation()).thenReturn(location);
        when(entreprise.getUtilisateurs()).thenReturn(List.of(utilisateur));

        EntrepriseRequestDto request = mapper.entityToRequest(entreprise);
        EntrepriseResponseDto response = mapper.entityToResponse(entreprise);

        assertEquals(locationId, request.getLocationId());
        assertEquals(List.of(utilisateurId), request.getUtilisateurIds());
        assertEquals(locationId, response.getLocationId());
        assertEquals(List.of(utilisateurId), response.getUtilisateurIds());
    }

    @Test
    void responseToEntity_ShouldResolveRelations() {
        UUID locationId = UUID.randomUUID();
        UUID utilisateurId = UUID.randomUUID();

        Location location = mock(Location.class);
        Utilisateur utilisateur = mock(Utilisateur.class);
        EntrepriseResponseDto dto = mock(EntrepriseResponseDto.class);

        when(dto.getLocationId()).thenReturn(locationId);
        when(dto.getUtilisateurIds()).thenReturn(List.of(utilisateurId));
        when(locationRepository.findById(locationId)).thenReturn(Optional.of(location));
        when(utilisateurRepository.findAllById(List.of(utilisateurId)))
                .thenReturn(List.of(utilisateur));

        Entreprise result = mapper.responseToEntity(dto);

        assertSame(location, result.getLocation());
        assertEquals(List.of(utilisateur), result.getUtilisateurs());
    }
}
