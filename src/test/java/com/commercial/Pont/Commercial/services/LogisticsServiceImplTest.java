package com.commercial.Pont.Commercial.services;

import com.commercial.Pont.Commercial.dtos.responseDtos.LogisticsEstimateDto;
import com.commercial.Pont.Commercial.models.Annonce;
import com.commercial.Pont.Commercial.models.Entreprise;
import com.commercial.Pont.Commercial.models.Location;
import com.commercial.Pont.Commercial.models.Utilisateur;
import com.commercial.Pont.Commercial.repositories.AnnonceRepository;
import com.commercial.Pont.Commercial.repositories.UtilisateurRepository;
import com.commercial.Pont.Commercial.services.ImplementationServices.LogisticsServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

@ExtendWith(MockitoExtension.class)
class LogisticsServiceImplTest {

    @Mock
    private AnnonceRepository annonceRepository;

    @Mock
    private UtilisateurRepository utilisateurRepository;

    @Mock
    private Authentication authentication;

    private RestClient.Builder restClientBuilder;
    private MockRestServiceServer server;
    private LogisticsServiceImpl logisticsService;

    @BeforeEach
    void setUp() {
        restClientBuilder = RestClient.builder();
        server = MockRestServiceServer.bindTo(restClientBuilder).build();

        logisticsService = new LogisticsServiceImpl(
                restClientBuilder,
                annonceRepository,
                utilisateurRepository
        );

        ReflectionTestUtils.setField(logisticsService, "apiKey", "test-key");
        ReflectionTestUtils.setField(logisticsService, "apiUrl", "https://api.test");
        ReflectionTestUtils.setField(
                logisticsService,
                "costPerKmUsd",
                new BigDecimal("1.20")
        );
        ReflectionTestUtils.setField(
                logisticsService,
                "estimatedKmPerDay",
                500.0
        );
    }

    @Test
    void calculateRouteBetweenCountries_ShouldReturnGeographicEstimate() {
        server.expect(requestTo(org.hamcrest.Matchers.containsString(
                        "/pelias/v1/search")))
                .andRespond(withSuccess("""
                        {
                          "features": [
                            {
                              "geometry": {
                                "coordinates": [-9.598107, 30.427755]
                              }
                            }
                          ]
                        }
                        """, MediaType.APPLICATION_JSON));

        server.expect(requestTo(org.hamcrest.Matchers.containsString(
                        "/pelias/v1/search")))
                .andRespond(withSuccess("""
                        {
                          "features": [
                            {
                              "geometry": {
                                "coordinates": [2.3522, 48.8566]
                              }
                            }
                          ]
                        }
                        """, MediaType.APPLICATION_JSON));

        LogisticsEstimateDto result =
                logisticsService.calculateRoute("Maroc", "France");

        assertNotNull(result);
        assertEquals("Maroc", result.getOrigin());
        assertEquals("France", result.getDestination());
        assertEquals("GEOGRAPHIC_ESTIMATE", result.getCalculationType());
        assertTrue(result.getDistanceKm() > 0);
        assertTrue(result.getEstimatedDays() >= 1);
        assertTrue(result.getEstimatedCostUsd()
                .compareTo(BigDecimal.ZERO) > 0);

        server.verify();
    }

    @Test
    void calculateRouteWithCities_ShouldReturnRoadDistance_WhenRoutingWorks() {
        server.expect(requestTo(org.hamcrest.Matchers.containsString(
                        "/pelias/v1/search")))
                .andRespond(withSuccess("""
                        {
                          "features":[
                            {"geometry":{"coordinates":[-9.598107,30.427755]}}
                          ]
                        }
                        """, MediaType.APPLICATION_JSON));

        server.expect(requestTo(org.hamcrest.Matchers.containsString(
                        "/pelias/v1/search")))
                .andRespond(withSuccess("""
                        {
                          "features":[
                            {"geometry":{"coordinates":[8.9314,37.2744]}}
                          ]
                        }
                        """, MediaType.APPLICATION_JSON));

        server.expect(requestTo(org.hamcrest.Matchers.containsString(
                        "/openrouteservice/v2/directions/driving-hgv")))
                .andRespond(withSuccess("""
                        {
                          "features":[
                            {
                              "properties":{
                                "summary":{
                                  "distance":1500000
                                }
                              }
                            }
                          ]
                        }
                        """, MediaType.APPLICATION_JSON));

        LogisticsEstimateDto result =
                logisticsService.calculateRoute(
                        "Agadir",
                        "Maroc",
                        "Bizerte",
                        "Tunisie"
                );

        assertEquals("Agadir, Maroc", result.getOrigin());
        assertEquals("Bizerte, Tunisie", result.getDestination());
        assertEquals("ROAD", result.getCalculationType());
        assertEquals(1500.0, result.getDistanceKm());
        assertEquals(new BigDecimal("1800.00"), result.getEstimatedCostUsd());
        assertEquals(3, result.getEstimatedDays());

        server.verify();
    }

    @Test
    void calculateRouteWithCities_ShouldFallbackToHaversine_WhenRoutingFails() {
        server.expect(requestTo(org.hamcrest.Matchers.containsString(
                        "/pelias/v1/search")))
                .andRespond(withSuccess("""
                        {"features":[{"geometry":{"coordinates":[-9.598107,30.427755]}}]}
                        """, MediaType.APPLICATION_JSON));

        server.expect(requestTo(org.hamcrest.Matchers.containsString(
                        "/pelias/v1/search")))
                .andRespond(withSuccess("""
                        {"features":[{"geometry":{"coordinates":[8.9314,37.2744]}}]}
                        """, MediaType.APPLICATION_JSON));

        server.expect(requestTo(org.hamcrest.Matchers.containsString(
                        "/openrouteservice/v2/directions/driving-hgv")))
                .andRespond(withSuccess("""
                        {"features":[]}
                        """, MediaType.APPLICATION_JSON));

        LogisticsEstimateDto result =
                logisticsService.calculateRoute(
                        "Agadir",
                        "Maroc",
                        "Bizerte",
                        "Tunisie"
                );

        assertEquals("GEOGRAPHIC_ESTIMATE", result.getCalculationType());
        assertTrue(result.getDistanceKm() > 0);
        assertTrue(result.getMessage().contains("Estimation géographique"));
    }

    @Test
    void calculateRoute_ShouldThrow_WhenOriginIsBlank() {
        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> logisticsService.calculateRoute(" ", "France")
        );

        assertEquals(
                "La localisation ne peut pas être vide.",
                ex.getMessage()
        );
    }

    @Test
    void calculateRoute_ShouldWrapError_WhenGeocodingReturnsNullBody() {
        server.expect(requestTo(org.hamcrest.Matchers.containsString(
                        "/pelias/v1/search")))
                .andRespond(withSuccess("", MediaType.APPLICATION_JSON));

        IllegalStateException ex = assertThrows(
                IllegalStateException.class,
                () -> logisticsService.calculateRoute("Maroc", "France")
        );

        assertTrue(ex.getMessage()
                .contains("Erreur lors du géocodage de Maroc"));
    }

    @Test
    void calculateRoute_ShouldWrapError_WhenNoGeocodingFeatureExists() {
        server.expect(requestTo(org.hamcrest.Matchers.containsString(
                        "/pelias/v1/search")))
                .andRespond(withSuccess(
                        "{\"features\":[]}",
                        MediaType.APPLICATION_JSON
                ));

        IllegalStateException ex = assertThrows(
                IllegalStateException.class,
                () -> logisticsService.calculateRoute("Unknown", "France")
        );

        assertTrue(ex.getMessage().contains("Localisation introuvable"));
    }

    @Test
    void calculateRoute_ShouldWrapError_WhenGeometryIsMissing() {
        server.expect(requestTo(org.hamcrest.Matchers.containsString(
                        "/pelias/v1/search")))
                .andRespond(withSuccess(
                        "{\"features\":[{}]}",
                        MediaType.APPLICATION_JSON
                ));

        IllegalStateException ex = assertThrows(
                IllegalStateException.class,
                () -> logisticsService.calculateRoute("Maroc", "France")
        );

        assertTrue(ex.getMessage().contains("Coordonnées introuvables"));
    }

    @Test
    void calculateRoute_ShouldWrapError_WhenCoordinatesAreInvalid() {
        server.expect(requestTo(org.hamcrest.Matchers.containsString(
                        "/pelias/v1/search")))
                .andRespond(withSuccess("""
                        {
                          "features":[
                            {"geometry":{"coordinates":[-9.5]}}
                          ]
                        }
                        """, MediaType.APPLICATION_JSON));

        IllegalStateException ex = assertThrows(
                IllegalStateException.class,
                () -> logisticsService.calculateRoute("Maroc", "France")
        );

        assertTrue(ex.getMessage().contains("Coordonnées invalides"));
    }

    @Test
    void getLogistics_ShouldRejectNullAuthentication() {
        assertThrows(
                IllegalStateException.class,
                () -> logisticsService.getLogistics(
                        UUID.randomUUID(),
                        null
                )
        );

        verifyNoInteractions(annonceRepository, utilisateurRepository);
    }

    @Test
    void getLogistics_ShouldRejectUnauthenticatedUser() {
        when(authentication.isAuthenticated()).thenReturn(false);

        assertThrows(
                IllegalStateException.class,
                () -> logisticsService.getLogistics(
                        UUID.randomUUID(),
                        authentication
                )
        );
    }

    @Test
    void getLogistics_ShouldThrow_WhenAnnonceDoesNotExist() {
        UUID annonceId = UUID.randomUUID();
        when(authentication.isAuthenticated()).thenReturn(true);
        when(annonceRepository.findById(annonceId))
                .thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> logisticsService.getLogistics(
                        annonceId,
                        authentication
                )
        );

        assertTrue(ex.getMessage().contains(annonceId.toString()));
    }

    @Test
    void getLogistics_ShouldThrow_WhenAnnonceHasNoLocation() {
        UUID annonceId = UUID.randomUUID();
        Annonce annonce = mock(Annonce.class);

        when(authentication.isAuthenticated()).thenReturn(true);
        when(annonceRepository.findById(annonceId))
                .thenReturn(Optional.of(annonce));
        when(annonce.getLocationOrigine()).thenReturn(null);

        assertThrows(
                IllegalStateException.class,
                () -> logisticsService.getLogistics(
                        annonceId,
                        authentication
                )
        );
    }

    @Test
    void getLogistics_ShouldReturnOwnAnnouncement_WhenAnnonceBelongsToUser() {
        UUID annonceId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        Location origin = new Location();
        origin.setVille("Agadir");
        origin.setPays("Maroc");

        Utilisateur user = new Utilisateur();
        user.setUtilisateurId(userId);

        Annonce annonce = mock(Annonce.class);
        when(annonce.getLocationOrigine()).thenReturn(origin);
        when(annonce.getUtilisateur()).thenReturn(user);

        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("user@test.com");
        when(annonceRepository.findById(annonceId))
                .thenReturn(Optional.of(annonce));
        when(utilisateurRepository.findByEmail("user@test.com"))
                .thenReturn(Optional.of(user));

        LogisticsEstimateDto result =
                logisticsService.getLogistics(
                        annonceId,
                        authentication
                );

        assertEquals("OWN_ANNOUNCEMENT", result.getCalculationType());
        assertEquals(0.0, result.getDistanceKm());
        assertEquals("Agadir, Maroc", result.getOrigin());
        assertEquals("C'est votre annonce.", result.getMessage());
    }

    @Test
    void getLogistics_ShouldThrow_WhenUserHasNoEntreprise() {
        UUID annonceId = UUID.randomUUID();

        Location origin = new Location();
        origin.setPays("Maroc");

        Utilisateur owner = new Utilisateur();
        owner.setUtilisateurId(UUID.randomUUID());

        Utilisateur user = new Utilisateur();
        user.setUtilisateurId(UUID.randomUUID());

        Annonce annonce = mock(Annonce.class);
        when(annonce.getLocationOrigine()).thenReturn(origin);
        when(annonce.getUtilisateur()).thenReturn(owner);

        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("user@test.com");
        when(annonceRepository.findById(annonceId))
                .thenReturn(Optional.of(annonce));
        when(utilisateurRepository.findByEmail("user@test.com"))
                .thenReturn(Optional.of(user));

        assertThrows(
                IllegalStateException.class,
                () -> logisticsService.getLogistics(
                        annonceId,
                        authentication
                )
        );
    }

    @Test
    void getLogistics_ShouldReturnSameLocation_WhenIdsAreSame() {
        UUID annonceId = UUID.randomUUID();
        UUID locationId = UUID.randomUUID();

        Location origin = new Location();
        origin.setLocationId(locationId);
        origin.setVille("Agadir");
        origin.setPays("Maroc");

        Location destination = new Location();
        destination.setLocationId(locationId);
        destination.setVille("Agadir");
        destination.setPays("Maroc");

        Entreprise entreprise = new Entreprise();
        entreprise.setLocation(destination);

        Utilisateur owner = new Utilisateur();
        owner.setUtilisateurId(UUID.randomUUID());

        Utilisateur user = new Utilisateur();
        user.setUtilisateurId(UUID.randomUUID());
        user.setEntreprise(entreprise);

        Annonce annonce = mock(Annonce.class);
        when(annonce.getLocationOrigine()).thenReturn(origin);
        when(annonce.getUtilisateur()).thenReturn(owner);

        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("user@test.com");
        when(annonceRepository.findById(annonceId))
                .thenReturn(Optional.of(annonce));
        when(utilisateurRepository.findByEmail("user@test.com"))
                .thenReturn(Optional.of(user));

        LogisticsEstimateDto result =
                logisticsService.getLogistics(
                        annonceId,
                        authentication
                );

        assertEquals("SAME_LOCATION", result.getCalculationType());
        assertEquals(0.0, result.getDistanceKm());
    }

    @Test
    void getLogistics_ShouldThrow_WhenOriginCountryMissing() {
        UUID annonceId = UUID.randomUUID();

        Location origin = new Location();
        origin.setPays(" ");

        Location destination = new Location();
        destination.setPays("France");

        Entreprise entreprise = new Entreprise();
        entreprise.setLocation(destination);

        Utilisateur owner = new Utilisateur();
        owner.setUtilisateurId(UUID.randomUUID());

        Utilisateur user = new Utilisateur();
        user.setUtilisateurId(UUID.randomUUID());
        user.setEntreprise(entreprise);

        Annonce annonce = mock(Annonce.class);
        when(annonce.getLocationOrigine()).thenReturn(origin);
        when(annonce.getUtilisateur()).thenReturn(owner);

        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("user@test.com");
        when(annonceRepository.findById(annonceId))
                .thenReturn(Optional.of(annonce));
        when(utilisateurRepository.findByEmail("user@test.com"))
                .thenReturn(Optional.of(user));

        assertThrows(
                IllegalStateException.class,
                () -> logisticsService.getLogistics(
                        annonceId,
                        authentication
                )
        );
    }
}
