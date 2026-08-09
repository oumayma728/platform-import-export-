package com.commercial.Pont.Commercial.security;

import com.commercial.Pont.Commercial.dtos.responseDtos.AuthResponseDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.ErrorResponseDto;
import com.commercial.Pont.Commercial.services.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class OAuth2LoginSuccessHandler
        implements AuthenticationSuccessHandler {

    private final AuthService authService;
    private final ObjectMapper objectMapper;

    public OAuth2LoginSuccessHandler(
            @Lazy AuthService authService,
            ObjectMapper objectMapper
    ) {
        this.authService = authService;
        this.objectMapper = objectMapper;
    }

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException {

        OAuth2AuthenticationToken oauthToken =
                (OAuth2AuthenticationToken) authentication;

        OAuth2User oauthUser =
                oauthToken.getPrincipal();


        // ==========================================
        // Récupérer les informations Google
        // ==========================================

        String googleId =
                oauthUser.getAttribute("sub");

        String email =
                oauthUser.getAttribute("email");

        String nom =
                oauthUser.getAttribute("family_name");

        String prenom =
                oauthUser.getAttribute("given_name");

        String photoProfile =
                oauthUser.getAttribute("picture");


        // ==========================================
        // Appeler AuthService
        // ==========================================

        try {

            AuthResponseDto authResponse =
                    authService.loginWithGoogle(
                            googleId,
                            email,
                            nom,
                            prenom,
                            photoProfile
                    );


            // ==========================================
            // Retourner AuthResponseDto en JSON
            // ==========================================

            response.setStatus(
                    HttpServletResponse.SC_OK
            );

            response.setContentType(
                    "application/json"
            );

            response.setCharacterEncoding(
                    "UTF-8"
            );

            response.getWriter().write(
                    objectMapper.writeValueAsString(
                            authResponse
                    )
            );

            response.getWriter().flush();


        } catch (IllegalStateException e) {

            // ==========================================
            // Compte non validé
            // ==========================================

            response.setStatus(
                    HttpServletResponse.SC_FORBIDDEN
            );

            response.setContentType(
                    "application/json"
            );

            response.setCharacterEncoding(
                    "UTF-8"
            );

            response.getWriter().write(
                    objectMapper.writeValueAsString(
                            new ErrorResponseDto(
                                    e.getMessage()
                            )
                    )
            );

            response.getWriter().flush();
        }
    }
}