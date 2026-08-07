import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({
    description: 'The UUID of the conversation',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  conversationId!: string;

  @ApiProperty({
    description: 'Content of the chat message',
    example: 'Can you confirm the Incoterm and delivery timeline?',
  })
  @IsString()
  @IsNotEmpty()
  content!: string;
}

