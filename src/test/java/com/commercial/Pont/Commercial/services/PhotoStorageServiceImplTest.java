package com.commercial.Pont.Commercial.services;

import com.commercial.Pont.Commercial.services.ImplementationServices.PhotoStorageServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import static org.junit.jupiter.api.Assertions.*;

class PhotoStorageServiceImplTest {

    private PhotoStorageServiceImpl photoStorageService;

    private final Path profileDirectory =
            Paths.get(
                    "uploads/profiles"
            );

    private Path createdFile;


    @BeforeEach
    void setUp() {

        photoStorageService =
                new PhotoStorageServiceImpl();
    }


    @AfterEach
    void cleanUp() throws IOException {

        /*
         * Supprimer uniquement le fichier
         * créé par le test.
         */
        if (
                createdFile != null
                        &&
                        Files.exists(createdFile)
        ) {

            Files.delete(
                    createdFile
            );
        }
    }


    // =========================================================
    // STORE PHOTO
    // =========================================================

    @Test
    void storeProfilePhoto_ShouldStorePhotoSuccessfully()
            throws IOException {

        byte[] content =
                "fake-image-content"
                        .getBytes(
                                StandardCharsets.UTF_8
                        );


        MockMultipartFile file =
                new MockMultipartFile(
                        "file",
                        "profile.jpg",
                        "image/jpeg",
                        content
                );


        String result =
                photoStorageService
                        .storeProfilePhoto(
                                file
                        );


        assertNotNull(result);


        /*
         * Le chemin retourné doit commencer par :
         * /uploads/profiles/
         */
        assertTrue(
                result.startsWith(
                        "/uploads/profiles/"
                )
        );


        /*
         * L'extension originale doit être conservée.
         */
        assertTrue(
                result.endsWith(
                        ".jpg"
                )
        );


        /*
         * Récupérer le nom physique créé.
         */
        String filename =
                result.substring(
                        "/uploads/profiles/"
                                .length()
                );


        createdFile =
                profileDirectory.resolve(
                        filename
                );


        /*
         * Vérifier que le fichier existe réellement.
         */
        assertTrue(
                Files.exists(
                        createdFile
                )
        );


        /*
         * Vérifier son contenu.
         */
        byte[] storedContent =
                Files.readAllBytes(
                        createdFile
                );


        assertArrayEquals(
                content,
                storedContent
        );
    }


    // =========================================================
    // UUID
    // =========================================================

    @Test
    void storeProfilePhoto_ShouldGenerateDifferentFilename()
            throws IOException {

        MockMultipartFile file1 =
                new MockMultipartFile(
                        "file",
                        "profile.jpg",
                        "image/jpeg",
                        "photo1"
                                .getBytes(
                                        StandardCharsets.UTF_8
                                )
                );


        MockMultipartFile file2 =
                new MockMultipartFile(
                        "file",
                        "profile.jpg",
                        "image/jpeg",
                        "photo2"
                                .getBytes(
                                        StandardCharsets.UTF_8
                                )
                );


        String result1 =
                photoStorageService
                        .storeProfilePhoto(
                                file1
                        );


        String result2 =
                photoStorageService
                        .storeProfilePhoto(
                                file2
                        );


        /*
         * Deux uploads ne doivent jamais
         * avoir le même nom.
         */
        assertNotEquals(
                result1,
                result2
        );


        Path firstFile =
                Paths.get(
                        result1.substring(1)
                );

        Path secondFile =
                Paths.get(
                        result2.substring(1)
                );


        assertTrue(
                Files.exists(firstFile)
        );

        assertTrue(
                Files.exists(secondFile)
        );


        /*
         * Nettoyage.
         */
        Files.deleteIfExists(
                firstFile
        );

        Files.deleteIfExists(
                secondFile
        );
    }


    // =========================================================
    // FILE WITHOUT EXTENSION
    // =========================================================

    @Test
    void storeProfilePhoto_ShouldWorkWithoutExtension()
            throws IOException {

        MockMultipartFile file =
                new MockMultipartFile(
                        "file",
                        "profile",
                        "application/octet-stream",
                        "photo"
                                .getBytes(
                                        StandardCharsets.UTF_8
                                )
                );


        String result =
                photoStorageService
                        .storeProfilePhoto(
                                file
                        );


        assertNotNull(
                result
        );


        assertTrue(
                result.startsWith(
                        "/uploads/profiles/"
                )
        );


        String filename =
                result.substring(
                        "/uploads/profiles/"
                                .length()
                );


        /*
         * Comme l'original ne possède aucune extension,
         * le UUID doit constituer tout le nom.
         */
        assertFalse(
                filename.contains(".")
        );


        createdFile =
                profileDirectory.resolve(
                        filename
                );


        assertTrue(
                Files.exists(
                        createdFile
                )
        );
    }


    // =========================================================
    // ORIGINAL FILENAME NULL
    // =========================================================

    @Test
    void storeProfilePhoto_ShouldWork_WhenOriginalFilenameIsNull()
            throws IOException {

        MockMultipartFile file =
                new MockMultipartFile(
                        "file",
                        null,
                        "image/jpeg",
                        "photo"
                                .getBytes(
                                        StandardCharsets.UTF_8
                                )
                );


        String result =
                photoStorageService
                        .storeProfilePhoto(
                                file
                        );


        assertNotNull(
                result
        );


        assertTrue(
                result.startsWith(
                        "/uploads/profiles/"
                )
        );


        String filename =
                result.substring(
                        "/uploads/profiles/"
                                .length()
                );


        createdFile =
                profileDirectory.resolve(
                        filename
                );


        assertTrue(
                Files.exists(
                        createdFile
                )
        );
    }


    // =========================================================
    // IOException
    // =========================================================

    @Test
    void storeProfilePhoto_ShouldThrowRuntimeException_WhenIOExceptionOccurs()
            throws IOException {

        MockMultipartFile file =
                new MockMultipartFile(
                        "file",
                        "profile.jpg",
                        "image/jpeg",
                        "photo".getBytes(
                                StandardCharsets.UTF_8
                        )
                ) {

                    @Override
                    public java.io.InputStream getInputStream()
                            throws IOException {

                        throw new IOException(
                                "Erreur test"
                        );
                    }
                };


        RuntimeException exception =
                assertThrows(
                        RuntimeException.class,
                        () ->
                                photoStorageService
                                        .storeProfilePhoto(
                                                file
                                        )
                );


        assertEquals(
                "Erreur lors du stockage de la photo",
                exception.getMessage()
        );


        assertNotNull(
                exception.getCause()
        );

        assertInstanceOf(
                IOException.class,
                exception.getCause()
        );
    }
}