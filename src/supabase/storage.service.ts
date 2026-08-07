import { Injectable } from '@nestjs/common';

import { UploadedFileLike } from '../common/types/uploaded-file.type';
import { SupabaseService } from './supabase.service';

@Injectable()
export class StorageService {

  constructor(private readonly supabaseService: SupabaseService) {}

  async uploadFile(file: UploadedFileLike, path: string, bucketName: string): Promise<string> {
    const { data, error } = await this.supabaseService
      .getClient()
      .storage.from(bucketName)
      .upload(path, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) {
      throw error;
    }

    return this.getPublicUrl(path, bucketName);
  }

  getPublicUrl(path: string, bucketName: string): string {
    const { data } = this.supabaseService
      .getClient()
      .storage.from(bucketName)
      .getPublicUrl(path);

    return data.publicUrl;
  }
}