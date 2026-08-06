import { Injectable } from '@nestjs/common';

import { UploadedFileLike } from '../common/types/uploaded-file.type';
import { SupabaseService } from './supabase.service';

@Injectable()
export class StorageService {
  private readonly bucketName = 'listing_document';

  constructor(private readonly supabaseService: SupabaseService) {}

  async uploadFile(file: UploadedFileLike, path: string): Promise<string> {
    const { data, error } = await this.supabaseService
      .getClient()
      .storage.from(this.bucketName)
      .upload(path, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) {
      throw error;
    }

    return this.getPublicUrl(path);
  }

  getPublicUrl(path: string): string {
    const { data } = this.supabaseService
      .getClient()
      .storage.from(this.bucketName)
      .getPublicUrl(path);

    return data.publicUrl;
  }
}