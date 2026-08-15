package com.commercial.Pont.Commercial.services.ImplementationServices;


import com.commercial.Pont.Commercial.services.ServiceInterfaces.PhotoStorageServiceInterface;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;
@Service
public class PhotoStorageServiceImpl
        implements PhotoStorageServiceInterface {

    private final Path profileDirectory =
            Paths.get("uploads/profiles");

    @Override
    public String storeProfilePhoto(
            MultipartFile file
    ) {

        try {

            Files.createDirectories(
                    profileDirectory
            );

            String originalFilename =
                    file.getOriginalFilename();

            String extension = "";

            if (originalFilename != null
                    && originalFilename.contains(".")) {

                extension =
                        originalFilename.substring(
                                originalFilename.lastIndexOf(".")
                        );
            }

            String filename =
                    UUID.randomUUID()
                            + extension;

            Path destination =
                    profileDirectory.resolve(filename);

            Files.copy(
                    file.getInputStream(),
                    destination,
                    StandardCopyOption.REPLACE_EXISTING
            );

            return "/uploads/profiles/" + filename;

        } catch (IOException e) {

            throw new RuntimeException(
                    "Erreur lors du stockage de la photo",
                    e
            );
        }
    }
}