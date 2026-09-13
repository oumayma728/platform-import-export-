package com.commercial.Pont.Commercial.mappers;

import com.commercial.Pont.Commercial.dtos.requestDtos.NotificationRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.NotificationResponseDto;
import com.commercial.Pont.Commercial.mappers.ImplementationMappers.NotificationMapperImpl;
import com.commercial.Pont.Commercial.models.Notification;
import com.commercial.Pont.Commercial.models.Utilisateur;
import com.commercial.Pont.Commercial.repositories.UtilisateurRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationMapperImplTest {

    @Mock
    private UtilisateurRepository utilisateurRepository;

    @InjectMocks
    private NotificationMapperImpl mapper;

    @Test
    void nullInputs_ShouldReturnNull() {
        assertNull(mapper.requestToEntity(null));
        assertNull(mapper.entityToRequest(null));
        assertNull(mapper.entityToResponse(null));
        assertNull(mapper.responseToEntity(null));
    }

    @Test
    void requestToEntity_ShouldResolveUtilisateur() {
        UUID utilisateurId = UUID.randomUUID();

        Utilisateur utilisateur = mock(Utilisateur.class);
        NotificationRequestDto dto = mock(NotificationRequestDto.class);

        when(dto.getUtilisateurId()).thenReturn(utilisateurId);

        when(utilisateurRepository.findById(utilisateurId))
                .thenReturn(Optional.of(utilisateur));

        Notification result = mapper.requestToEntity(dto);

        assertNotNull(result);
        assertSame(utilisateur, result.getUtilisateur());
    }

    @Test
    void requestToEntity_WithoutUtilisateur_ShouldLeaveRelationNull() {
        NotificationRequestDto dto = mock(NotificationRequestDto.class);

        Notification result = mapper.requestToEntity(dto);

        assertNotNull(result);
        assertNull(result.getUtilisateur());

        verifyNoInteractions(utilisateurRepository);
    }

    @Test
    void entityToDtos_ShouldExtractUtilisateurId() {
        UUID utilisateurId = UUID.randomUUID();

        Utilisateur utilisateur = mock(Utilisateur.class);
        when(utilisateur.getUtilisateurId()).thenReturn(utilisateurId);

        Notification notification = mock(Notification.class);
        when(notification.getUtilisateur()).thenReturn(utilisateur);

        NotificationRequestDto request =
                mapper.entityToRequest(notification);

        NotificationResponseDto response =
                mapper.entityToResponse(notification);

        assertEquals(utilisateurId, request.getUtilisateurId());
        assertEquals(utilisateurId, response.getUtilisateurId());
    }

    @Test
    void entityToDtos_WithoutUtilisateur_ShouldReturnNullId() {
        Notification notification = mock(Notification.class);

        assertNull(
                mapper.entityToRequest(notification)
                        .getUtilisateurId()
        );

        assertNull(
                mapper.entityToResponse(notification)
                        .getUtilisateurId()
        );
    }

    @Test
    void responseToEntity_ShouldResolveUtilisateur() {
        UUID utilisateurId = UUID.randomUUID();

        Utilisateur utilisateur = mock(Utilisateur.class);
        NotificationResponseDto dto =
                mock(NotificationResponseDto.class);

        when(dto.getUtilisateurId()).thenReturn(utilisateurId);

        when(utilisateurRepository.findById(utilisateurId))
                .thenReturn(Optional.of(utilisateur));

        Notification result =
                mapper.responseToEntity(dto);

        assertNotNull(result);
        assertSame(utilisateur, result.getUtilisateur());
    }
}
