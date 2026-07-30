import { ApiProperty } from '@nestjs/swagger';
import { ConversationStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateConversationStatusDto {
  @ApiProperty({
    description: 'New status for the conversation',
    enum: ConversationStatus,
    example: ConversationStatus.EN_CONTACT,
  })
  @IsEnum(ConversationStatus)
  @IsNotEmpty()
  status!: ConversationStatus;
}
