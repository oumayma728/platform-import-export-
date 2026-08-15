package com.commercial.Pont.Commercial.services.ServiceInterfaces;

import org.springframework.web.multipart.MultipartFile;

public interface PhotoStorageServiceInterface {
    String storeProfilePhoto(MultipartFile file);
}

