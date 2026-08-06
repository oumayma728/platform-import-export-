import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateListingDocumentDto {
  @ApiProperty({
    example: 'https://cdn.example.com/documents/listing-123.pdf',
    description: 'Public URL of the uploaded document.',
  })
  @IsString()
  @IsNotEmpty()
  fileUrl!: string;

  @ApiProperty({
    example: 'application/pdf',
    description: 'Mime type of the uploaded document.',
  })
  @IsString()
  @IsNotEmpty()
  fileType!: string;
}
