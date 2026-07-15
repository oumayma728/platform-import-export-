import { PickType } from '@nestjs/swagger';

import { CreateUserDto } from '../../users/dto/create-user.dto';

export class RegisterDto extends PickType(CreateUserDto, [
  'email',
  'name',
  'phone',
  'password',
] as const) {}
