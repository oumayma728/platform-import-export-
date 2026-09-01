package com.commercial.Pont.Commercial.config;

import com.commercial.Pont.Commercial.security.CustomUserDetailsService;
import com.commercial.Pont.Commercial.security.JwtAuthenticationFilter;
import com.commercial.Pont.Commercial.security.OAuth2LoginFailureHandler;
import com.commercial.Pont.Commercial.security.OAuth2LoginSuccessHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    private final CustomUserDetailsService userDetailsService;

    private final OAuth2LoginSuccessHandler oAuth2SuccessHandler;

    private final OAuth2LoginFailureHandler oAuth2FailureHandler;

    // =========================
    // Password Encoder
    // =========================

    @Bean
    public PasswordEncoder passwordEncoder() {

        return new BCryptPasswordEncoder();
    }


    // =========================
    // Authentication Provider
    // =========================

    @Bean
    public AuthenticationProvider authenticationProvider() {

        DaoAuthenticationProvider provider =
                new DaoAuthenticationProvider();

        provider.setUserDetailsService(
                userDetailsService
        );

        provider.setPasswordEncoder(
                passwordEncoder()
        );

        return provider;
    }


    // =========================
    // Authentication Manager
    // =========================

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config
    ) throws Exception {

        return config.getAuthenticationManager();
    }


    // =========================
    // Security Filter Chain
    // =========================

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {

        http

                // Désactiver CSRF
                .csrf(csrf ->
                        csrf.disable()
                )

                // API REST avec JWT
                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                // =========================
                // Autorisations
                // =========================
                .authorizeHttpRequests(auth -> auth

                        // Routes publiques
                        .requestMatchers(
                                "/auth/**",

                                "/swagger-ui/**",
                                "/swagger-ui.html",

                                "/v3/api-docs",
                                "/v3/api-docs/**",

                                "/ws/**",

                                "/webhooks/stripe",

                                "/docs/**",
                                "/docs",

                                "/openapi.json",
                                "/openapi.json/**",

                                "/redoc/**",
                                "/redoc",
                                "/redoc.html"
                        )
                        .permitAll()

                        // Toutes les autres routes
                        // nécessitent un utilisateur authentifié
                        .anyRequest()
                        .authenticated()
                )

                // Authentication Provider
                .authenticationProvider(
                        authenticationProvider()
                )
                .oauth2Login(oauth2 -> oauth2
                        .successHandler(oAuth2SuccessHandler)
                        .failureHandler(oAuth2FailureHandler)
                )
                // JWT Filter
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }
}
