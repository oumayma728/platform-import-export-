package com.commercial.Pont.Commercial.mappers;

import com.commercial.Pont.Commercial.dtos.requestDtos.AnnonceRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.AnnonceResponseDto;
import com.commercial.Pont.Commercial.mappers.ImplementationMappers.AnnonceMapperImpl;
import com.commercial.Pont.Commercial.models.*;
import com.commercial.Pont.Commercial.repositories.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AnnonceMapperImplTest {

    @Mock private CategorieRepository categorieRepository;
    @Mock private UtilisateurRepository utilisateurRepository;
    @Mock private LocationRepository locationRepository;
    @Mock private ConversationRepository conversationRepository;
    @Mock private DocumentAnnonceRepository documentAnnonceRepository;
    @Mock private IncotermAnnonceRepository incotermAnnonceRepository;

    @InjectMocks
    private AnnonceMapperImpl mapper;

    @Test
    void nullInputs_ShouldReturnNull() {
        assertNull(mapper.requestToEntity(null));
        assertNull(mapper.entityToRequest(null));
        assertNull(mapper.entityToResponse(null));
        assertNull(mapper.responseToEntity(null));
    }

    @Test
    void requestToEntity_ShouldResolveAllRelations() {
        UUID categorieId = UUID.randomUUID();
        UUID utilisateurId = UUID.randomUUID();
        UUID locationId = UUID.randomUUID();
        UUID conversationId = UUID.randomUUID();
        UUID documentId = UUID.randomUUID();
        UUID incotermAnnonceId = UUID.randomUUID();

        Categorie categorie = mock(Categorie.class);
        Utilisateur utilisateur = mock(Utilisateur.class);
        Location location = mock(Location.class);
        Conversation conversation = mock(Conversation.class);
        DocumentAnnonce document = mock(DocumentAnnonce.class);
        IncotermAnnonce incotermAnnonce = mock(IncotermAnnonce.class);

        AnnonceRequestDto dto = mock(AnnonceRequestDto.class);
        when(dto.getCategorieId()).thenReturn(categorieId);
        when(dto.getUtilisateurId()).thenReturn(utilisateurId);
        when(dto.getLocationOrigineId()).thenReturn(locationId);
        when(dto.getConversationIds()).thenReturn(List.of(conversationId));
        when(dto.getDocumentAnnonceIds()).thenReturn(List.of(documentId));
        when(dto.getAnnonceIncotermIds()).thenReturn(Set.of(incotermAnnonceId));

        when(categorieRepository.findById(categorieId)).thenReturn(Optional.of(categorie));
        when(utilisateurRepository.findById(utilisateurId)).thenReturn(Optional.of(utilisateur));
        when(locationRepository.findById(locationId)).thenReturn(Optional.of(location));
        when(conversationRepository.findAllById(List.of(conversationId))).thenReturn(List.of(conversation));
        when(documentAnnonceRepository.findAllById(List.of(documentId))).thenReturn(List.of(document));
        when(incotermAnnonceRepository.findById(incotermAnnonceId)).thenReturn(Optional.of(incotermAnnonce));

        Annonce result = mapper.requestToEntity(dto);

        assertSame(categorie, result.getCategorie());
        assertSame(utilisateur, result.getUtilisateur());
        assertSame(location, result.getLocationOrigine());
        assertEquals(List.of(conversation), result.getConversations());
        assertEquals(List.of(document), result.getDocumentAnnonces());
        assertEquals(Set.of(incotermAnnonce), result.getAnnonces());
    }

    @Test
    void requestToEntity_WithoutRelations_ShouldKeepRelationsEmptyOrNull() {
        AnnonceRequestDto dto = mock(AnnonceRequestDto.class);

        Annonce result = mapper.requestToEntity(dto);

        assertNotNull(result);
        assertNull(result.getCategorie());
        assertNull(result.getUtilisateur());
        assertNull(result.getLocationOrigine());
        assertTrue(result.getConversations().isEmpty());
        assertTrue(result.getDocumentAnnonces().isEmpty());
        assertTrue(result.getAnnonces().isEmpty());
    }

    @Test
    void entityToDtos_ShouldExtractRelationIds() {
        UUID categorieId = UUID.randomUUID();
        UUID utilisateurId = UUID.randomUUID();
        UUID locationId = UUID.randomUUID();
        UUID conversationId = UUID.randomUUID();
        UUID documentId = UUID.randomUUID();
        UUID incotermAnnonceId = UUID.randomUUID();

        Categorie categorie = mock(Categorie.class);
        Utilisateur utilisateur = mock(Utilisateur.class);
        Location location = mock(Location.class);
        Conversation conversation = mock(Conversation.class);
        DocumentAnnonce document = mock(DocumentAnnonce.class);
        IncotermAnnonce incotermAnnonce = mock(IncotermAnnonce.class);

        when(categorie.getCategorieId()).thenReturn(categorieId);
        when(utilisateur.getUtilisateurId()).thenReturn(utilisateurId);
        when(location.getLocationId()).thenReturn(locationId);
        when(conversation.getConversationId()).thenReturn(conversationId);
        when(document.getDocumentAnnonceId()).thenReturn(documentId);
        when(incotermAnnonce.getIncotermAnnonceId()).thenReturn(incotermAnnonceId);

        Annonce annonce = mock(Annonce.class);
        when(annonce.getCategorie()).thenReturn(categorie);
        when(annonce.getUtilisateur()).thenReturn(utilisateur);
        when(annonce.getLocationOrigine()).thenReturn(location);
        when(annonce.getConversations()).thenReturn(List.of(conversation));
        when(annonce.getDocumentAnnonces()).thenReturn(List.of(document));
        when(annonce.getAnnonces()).thenReturn(Set.of(incotermAnnonce));

        AnnonceRequestDto request = mapper.entityToRequest(annonce);
        AnnonceResponseDto response = mapper.entityToResponse(annonce);

        assertEquals(categorieId, request.getCategorieId());
        assertEquals(utilisateurId, request.getUtilisateurId());
        assertEquals(locationId, request.getLocationOrigineId());
        assertEquals(List.of(conversationId), request.getConversationIds());
        assertEquals(List.of(documentId), request.getDocumentAnnonceIds());
        assertEquals(Set.of(incotermAnnonceId), request.getAnnonceIncotermIds());

        assertEquals(categorieId, response.getCategorieId());
        assertEquals(utilisateurId, response.getUtilisateurId());
        assertEquals(locationId, response.getLocationOrigineId());
    }

    @Test
    void responseToEntity_ShouldResolveAllRelations() {
        UUID categorieId = UUID.randomUUID();
        UUID utilisateurId = UUID.randomUUID();
        UUID locationId = UUID.randomUUID();
        UUID conversationId = UUID.randomUUID();
        UUID documentId = UUID.randomUUID();
        UUID incotermAnnonceId = UUID.randomUUID();

        Categorie categorie = mock(Categorie.class);
        Utilisateur utilisateur = mock(Utilisateur.class);
        Location location = mock(Location.class);
        Conversation conversation = mock(Conversation.class);
        DocumentAnnonce document = mock(DocumentAnnonce.class);
        IncotermAnnonce incotermAnnonce = mock(IncotermAnnonce.class);

        AnnonceResponseDto dto = mock(AnnonceResponseDto.class);
        when(dto.getCategorieId()).thenReturn(categorieId);
        when(dto.getUtilisateurId()).thenReturn(utilisateurId);
        when(dto.getLocationOrigineId()).thenReturn(locationId);
        when(dto.getConversationIds()).thenReturn(List.of(conversationId));
        when(dto.getDocumentAnnonceIds()).thenReturn(List.of(documentId));
        when(dto.getAnnonceIncotermIds()).thenReturn(Set.of(incotermAnnonceId));

        when(categorieRepository.findById(categorieId)).thenReturn(Optional.of(categorie));
        when(utilisateurRepository.findById(utilisateurId)).thenReturn(Optional.of(utilisateur));
        when(locationRepository.findById(locationId)).thenReturn(Optional.of(location));
        when(conversationRepository.findAllById(List.of(conversationId))).thenReturn(List.of(conversation));
        when(documentAnnonceRepository.findAllById(List.of(documentId))).thenReturn(List.of(document));
        when(incotermAnnonceRepository.findById(incotermAnnonceId)).thenReturn(Optional.of(incotermAnnonce));

        Annonce result = mapper.responseToEntity(dto);

        assertSame(categorie, result.getCategorie());
        assertSame(utilisateur, result.getUtilisateur());
        assertSame(location, result.getLocationOrigine());
        assertEquals(List.of(conversation), result.getConversations());
        assertEquals(List.of(document), result.getDocumentAnnonces());
        assertEquals(Set.of(incotermAnnonce), result.getAnnonces());
    }
}
