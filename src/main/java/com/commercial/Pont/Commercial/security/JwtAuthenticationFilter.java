package com.commercial.Pont.Commercial.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter
        extends OncePerRequestFilter {

    private final JwtService jwtService;

    private final CustomUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        final String authHeader =
                request.getHeader("Authorization");

        // Vérifier la présence du token
        if (
                authHeader == null
                        || !authHeader.startsWith("Bearer ")
        ) {

            filterChain.doFilter(
                    request,
                    response
            );

            return;
        }

        // Récupérer le JWT
        String jwt =
                authHeader.substring(7);

        try {

            // Extraire l'email du JWT
            String email =
                    jwtService.extractUsername(jwt);

            if (
                    email != null
                            &&
                            SecurityContextHolder
                                    .getContext()
                                    .getAuthentication()
                                    == null
            ) {

                // Charger l'utilisateur
                CustomUserDetails userDetails =
                        (CustomUserDetails)
                                userDetailsService
                                        .loadUserByUsername(email);

                // Vérifier la validité du token
                if (
                        jwtService.isTokenValid(
                                jwt,
                                userDetails
                        )
                ) {

                    /*
                     * Authentification de l'utilisateur.
                     *
                     * Pour le moment, on ne charge pas les rôles.
                     * Tous les utilisateurs possédant un JWT valide
                     * sont considérés comme authentifiés.
                     */
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null,
                                    Collections.emptyList()
                            );

                    authentication.setDetails(
                            new WebAuthenticationDetailsSource()
                                    .buildDetails(request)
                    );

                    SecurityContextHolder
                            .getContext()
                            .setAuthentication(
                                    authentication
                            );
                }
            }

        } catch (Exception e) {

            // Token invalide ou problème d'authentification
            System.out.println(
                    "Erreur JWT : "
                            + e.getMessage()
            );
        }

        filterChain.doFilter(
                request,
                response
        );
    }
}
