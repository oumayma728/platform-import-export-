import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateConversationDto {
  @ApiProperty({
    description: 'The UUID of the listing associated with this conversation',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  listingId!: string;
  
  @ApiProperty({
    description: 'Initial message content to send upon conversation creation',
    example: 'Hello, I am interested in this listing!',
  })
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  initialMessage!: string;
}
