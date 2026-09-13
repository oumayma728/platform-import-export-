package com.commercial.Pont.Commercial.services;

import com.commercial.Pont.Commercial.dtos.requestDtos.LoginRequestDto;
import com.commercial.Pont.Commercial.dtos.requestDtos.UtilisateurRequestDto;
import com.commercial.Pont.Commercial.repositories.PasswordResetTokenRepository;
import com.commercial.Pont.Commercial.repositories.UtilisateurRepository;
import com.commercial.Pont.Commercial.security.CustomUserDetailsService;
import com.commercial.Pont.Commercial.security.JwtService;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.UtilisateurServiceInterface;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.web.multipart.MultipartFile;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private UtilisateurRepository utilisateurRepository;

    @Mock
    private UtilisateurServiceInterface utilisateurService;

    @Mock
    private JwtService jwtService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private RefreshTokenService refreshTokenService;

    @Mock
    private CustomUserDetailsService customUserDetailsService;

    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private MultipartFile photo;

    @InjectMocks
    private AuthService authService;


    // ==========================================================
    // TEST 1
    // REGISTER SUCCESS
    // ==========================================================

    @Test
    void test_register_user_success() {

        // ARRANGE

        UtilisateurRequestDto request =
                new UtilisateurRequestDto();


        // ACT

        authService.register(
                request,
                photo
        );


        // ASSERT

        verify(
                utilisateurService,
                times(1)
        ).create(
                request,
                photo
        );
    }


    // ==========================================================
    // TEST 2
    // REGISTER SANS PHOTO
    // ==========================================================

    @Test
    void test_register_user_without_photo() {

        // ARRANGE

        UtilisateurRequestDto request =
                new UtilisateurRequestDto();


        // ACT

        authService.register(
                request,
                null
        );


        // ASSERT

        verify(
                utilisateurService,
                times(1)
        ).create(
                request,
                null
        );
    }


    // ==========================================================
    // TEST 3
    // REGISTER : SERVICE USER LEVE UNE EXCEPTION
    // ==========================================================

    @Test
    void test_register_user_service_failure() {

        // ARRANGE

        UtilisateurRequestDto request =
                new UtilisateurRequestDto();


        doThrow(
                new RuntimeException(
                        "Erreur création utilisateur"
                )
        ).when(
                utilisateurService
        ).create(
                request,
                photo
        );


        // ACT + ASSERT

        RuntimeException exception =
                assertThrows(
                        RuntimeException.class,
                        () ->
                                authService.register(
                                        request,
                                        photo
                                )
                );


        assertEquals(
                "Erreur création utilisateur",
                exception.getMessage()
        );


        verify(
                utilisateurService,
                times(1)
        ).create(
                request,
                photo
        );
    }


    // ==========================================================
    // TEST 4
    // LOGIN INVALID CREDENTIALS
    // ==========================================================

    @Test
    void test_login_invalid_credentials() {

        // ARRANGE

        LoginRequestDto request =
                new LoginRequestDto();

        request.setEmail(
                "invalid@test.com"
        );

        request.setPassword(
                "wrong-password"
        );


        when(
                authenticationManager.authenticate(
                        any(
                                UsernamePasswordAuthenticationToken.class
                        )
                )
        ).thenThrow(
                new BadCredentialsException(
                        "Bad credentials"
                )
        );


        // ACT + ASSERT

        BadCredentialsException exception =
                assertThrows(
                        BadCredentialsException.class,
                        () ->
                                authService.login(
                                        request
                                )
                );


        assertEquals(
                "Bad credentials",
                exception.getMessage()
        );


        verify(
                authenticationManager,
                times(1)
        ).authenticate(
                any(
                        UsernamePasswordAuthenticationToken.class
                )
        );


        verifyNoInteractions(
                utilisateurRepository
        );


        verifyNoInteractions(
                jwtService
        );


        verifyNoInteractions(
                refreshTokenService
        );
    }


    // ==========================================================
    // TEST 5
    // AUTHENTICATION MANAGER EST TOUJOURS APPELE
    // ==========================================================

    @Test
    void test_login_should_call_authentication_manager() {

        // ARRANGE

        LoginRequestDto request =
                new LoginRequestDto();

        request.setEmail(
                "test@test.com"
        );

        request.setPassword(
                "password"
        );


        when(
                authenticationManager.authenticate(
                        any(
                                UsernamePasswordAuthenticationToken.class
                        )
                )
        ).thenThrow(
                new BadCredentialsException(
                        "Bad credentials"
                )
        );


        // ACT

        assertThrows(
                BadCredentialsException.class,
                () ->
                        authService.login(
                                request
                        )
        );


        // ASSERT

        verify(
                authenticationManager,
                times(1)
        ).authenticate(
                argThat(
                        token ->
                                token.getPrincipal()
                                        .equals(
                                                "test@test.com"
                                        )
                                        &&
                                        token.getCredentials()
                                                .equals(
                                                        "password"
                                                )
                )
        );
    }


    // ==========================================================
    // TEST 6
    // SI AUTH ECHOUE JWT NE DOIT PAS ETRE UTILISE
    // ==========================================================

    @Test
    void test_login_authentication_failure_should_not_generate_token() {

        // ARRANGE

        LoginRequestDto request =
                new LoginRequestDto();

        request.setEmail(
                "user@test.com"
        );

        request.setPassword(
                "bad-password"
        );


        when(
                authenticationManager.authenticate(
                        any()
                )
        ).thenThrow(
                new BadCredentialsException(
                        "Invalid credentials"
                )
        );


        // ACT

        assertThrows(
                BadCredentialsException.class,
                () ->
                        authService.login(
                                request
                        )
        );


        // ASSERT

        verifyNoInteractions(
                jwtService
        );

        verifyNoInteractions(
                refreshTokenService
        );

        verifyNoInteractions(
                customUserDetailsService
        );
    }
}