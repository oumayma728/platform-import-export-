import { PartialType } from '@nestjs/mapped-types';
import { CreateMessageDto } from './create-message.dto';

export class UpdateMessagingDto extends PartialType(CreateMessageDto) {
  id: number;
}
