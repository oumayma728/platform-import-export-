package com.commercial.Pont.Commercial.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path uploadPath;

    public FileStorageService(
            @Value("${file.upload-dir}") String uploadDir
    ) {

        this.uploadPath = Paths
                .get(uploadDir)
                .toAbsolutePath()
                .normalize();

        try {

            Files.createDirectories(this.uploadPath);

        } catch (IOException e) {

            throw new RuntimeException(
                    "Impossible de créer le dossier de stockage",
                    e
            );
        }
    }


    public String store(MultipartFile file) {

        if (file == null || file.isEmpty()) {

            throw new IllegalArgumentException(
                    "Le fichier est vide"
            );
        }


        String originalFilename =
                file.getOriginalFilename();


        if (originalFilename == null
                || originalFilename.isBlank()) {

            throw new IllegalArgumentException(
                    "Nom du fichier invalide"
            );
        }


        // =========================
        // Extension
        // =========================

        String extension = "";

        int lastDot =
                originalFilename.lastIndexOf(".");

        if (lastDot > 0) {

            extension =
                    originalFilename.substring(lastDot);
        }


        // =========================
        // Nom unique
        // =========================

        String storedFilename =
                UUID.randomUUID() + extension;


        // =========================
        // Chemin
        // =========================

        Path targetLocation =
                uploadPath
                        .resolve(storedFilename)
                        .normalize();


        if (!targetLocation.startsWith(uploadPath)) {

            throw new IllegalArgumentException(
                    "Nom de fichier invalide"
            );
        }


        // =========================
        // Sauvegarde
        // =========================

        try {

            Files.copy(
                    file.getInputStream(),
                    targetLocation,
                    StandardCopyOption.REPLACE_EXISTING
            );

            // On retourne le chemin relatif
            // qui sera enregistré en DB

            return storedFilename;

        } catch (IOException e) {

            throw new RuntimeException(
                    "Erreur lors de l'enregistrement du fichier",
                    e
            );
        }
    }






    public void delete(String filename) {

        if (filename == null || filename.isBlank()) {
            return;
        }

        try {

            Path filePath =
                    uploadPath
                            .resolve(filename)
                            .normalize();

            if (!filePath.startsWith(uploadPath)) {
                throw new IllegalArgumentException(
                        "Chemin de fichier invalide"
                );
            }

            Files.deleteIfExists(filePath);

        } catch (IOException e) {

            throw new RuntimeException(
                    "Erreur lors de la suppression du fichier",
                    e
            );
        }
    }
}