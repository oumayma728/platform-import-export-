import { ApiProperty } from '@nestjs/swagger';

export class ListingDocumentEntity {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id!: string;

  @ApiProperty({ example: '3203f19e-e763-426b-9c24-b14316d84878' })
  listingId!: string;

  @ApiProperty({ example: 'https://cdn.example.com/documents/listing-123.pdf' })
  fileUrl!: string;

  @ApiProperty({ example: 'application/pdf' })
  fileType!: string;

  @ApiProperty({ example: '2026-08-06T12:00:00.000Z', format: 'date-time' })
  uploadedAt!: string;
}
