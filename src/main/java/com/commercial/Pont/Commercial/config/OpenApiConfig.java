package com.commercial.Pont.Commercial.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;

import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;

import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;

import io.swagger.v3.oas.models.servers.Server;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;


@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {

        String securitySchemeName =
                "bearerAuth";

        return new OpenAPI()

                .info(
                        new Info()
                                .title(
                                        "Pont Commercial - Import Export API"
                                )
                                .version(
                                        "1.0.0"
                                )
                                .description(
                                        """
                                        API REST de la plateforme Import/Export.

                                        Fonctionnalités principales :
                                        - Authentification JWT / OAuth2
                                        - Gestion des utilisateurs
                                        - Gestion des entreprises
                                        - Gestion des annonces
                                        - Conversations et messages
                                        - Documents
                                        - Paiements Stripe
                                        - Facturation
                                        - Abonnements
                                        - Conversion de devises
                                        - Estimation logistique
                                        - Notifications
                                        """
                                )
                                .contact(
                                        new Contact()
                                                .name(
                                                        "Backend Team"
                                                )
                                )
                )

                .servers(
                        List.of(

                                new Server()
                                        .url(
                                                "http://localhost:8080"
                                        )
                                        .description(
                                                "Local"
                                        ),

                                new Server()
                                        .url(
                                                "https://staging.example.com"
                                        )
                                        .description(
                                                "Staging"
                                        )
                        )
                )

                .addSecurityItem(
                        new SecurityRequirement()
                                .addList(
                                        securitySchemeName
                                )
                )

                .components(
                        new Components()

                                .addSecuritySchemes(

                                        securitySchemeName,

                                        new SecurityScheme()
                                                .name(
                                                        securitySchemeName
                                                )
                                                .type(
                                                        SecurityScheme.Type.HTTP
                                                )
                                                .scheme(
                                                        "bearer"
                                                )
                                                .bearerFormat(
                                                        "JWT"
                                                )
                                )
                );
    }
}