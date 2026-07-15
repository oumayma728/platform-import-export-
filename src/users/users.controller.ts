import { Body, Controller, Delete, Get, Param, Patch } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import {
  ConflictErrorResponseDto,
  NotFoundErrorResponseDto,
  UnauthorizedErrorResponseDto,
  ValidationErrorResponseDto,
} from '../common/dto/api-error-response.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity } from './entities/user.entity';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({
    summary: 'Get all users',
    description: 'Returns all users. Requires a valid bearer access token.',
  })
  @ApiOkResponse({
    description: 'List of users returned successfully.',
    type: UserEntity,
    isArray: true,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token is missing or invalid.',
    type: UnauthorizedErrorResponseDto,
  })
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @ApiOperation({
    summary: 'Get a user by ID',
    description: 'Returns a single user by its identifier.',
  })
  @ApiParam({ name: 'id', type: String, description: 'User identifier.' })
  @ApiOkResponse({
    description: 'User returned successfully.',
    type: UserEntity,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token is missing or invalid.',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'No user exists for the provided identifier.',
    type: NotFoundErrorResponseDto,
  })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @ApiOperation({
    summary: 'Update a user',
    description:
      'Updates one or more user fields. Only the provided fields are modified.',
  })
  @ApiParam({ name: 'id', type: String, description: 'User identifier.' })
  @ApiBody({ type: UpdateUserDto })
  @ApiOkResponse({
    description: 'User updated successfully.',
    type: UserEntity,
  })
  @ApiBadRequestResponse({
    description:
      'Request body validation failed. Unknown properties are rejected by the global ValidationPipe.',
    type: ValidationErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token is missing or invalid.',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'No user exists for the provided identifier.',
    type: NotFoundErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'A conflicting unique value already exists.',
    type: ConflictErrorResponseDto,
  })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }


  // @ApiOperation({
  //   summary: 'Update a user',
  //   description:
  //     'Updates one or more user fields. Only the provided fields are modified.',
  // })
  // @ApiParam({ name: 'id', type: String, description: 'User identifier.' })
  // @ApiBody({ type: UpdateUserDto })
  // @ApiOkResponse({
  //   description: 'User updated successfully.',
  //   type: UserEntity,
  // })
  // @ApiBadRequestResponse({
  //   description:
  //     'Request body validation failed. Unknown properties are rejected by the global ValidationPipe.',
  //   type: ValidationErrorResponseDto,
  // })
  // @ApiUnauthorizedResponse({
  //   description: 'Access token is missing or invalid.',
  //   type: UnauthorizedErrorResponseDto,
  // })
  // @ApiNotFoundResponse({
  //   description: 'No user exists for the provided identifier.',
  //   type: NotFoundErrorResponseDto,
  // })
  // @ApiConflictResponse({
  //   description: 'A conflicting unique value already exists.',
  //   type: ConflictErrorResponseDto,
  // })
  // @Patch('/:id/role')
  // updateRole(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
  //   return this.usersService.update(id, updateUserDto);
  // }

  @ApiOperation({
    summary: 'Delete a user',
    description: 'Deletes the user identified by the provided ID.',
  })
  @ApiParam({ name: 'id', type: String, description: 'User identifier.' })
  @ApiOkResponse({
    description: 'User deleted successfully.',
    schema: {
      type: 'boolean',
      example: true,
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Access token is missing or invalid.',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'No user exists for the provided identifier.',
    type: NotFoundErrorResponseDto,
  })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
