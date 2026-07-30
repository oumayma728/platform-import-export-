import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthRequest } from '../auth/interfaces/auth-request';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { GetConversationMessagesQueryDto } from './dto/get-conversation-messages-query.dto';
import { UpdateConversationStatusDto } from './dto/update-conversation-status.dto';
import { MessagingService } from './messaging.service';

// TODO: add guard in top of the controller

@ApiTags('Messaging')
@ApiBearerAuth()
@Controller('messaging')
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Post('conversations')
  @ApiOperation({
    summary: 'Create or retrieve a conversation for a listing',
    description:
      'Initiates a conversation for the target listing between the seller/buyer companies. Returns existing conversation if already created.',
  })
  @ApiResponse({
    status: 201,
    description: 'Conversation successfully initiated.',
  })
  @ApiResponse({
    status: 400,
    description: 'User has no company or target is own listing.',
  })
  createConversation(
    @CurrentUser() user: AuthRequest['user'],
    @Body() dto: CreateConversationDto,
  ) {
    return this.messagingService.createConversation(user.id, dto);
  }

  @Get('conversations')
  @ApiOperation({
    summary: 'List all conversations for authenticated user company',
    description:
      'Retrieves all active and historical conversations sorted by recent activity.',
  })
  @ApiResponse({ status: 200, description: 'List of conversations.' })
  getUserConversations(@CurrentUser() user: AuthRequest['user']) {
    return this.messagingService.getUserConversations(user.id);
  }

  @Get('conversations/:id')
  @ApiOperation({
    summary: 'Get infos about conversation',
  })
  @ApiParam({ name: 'id', description: 'UUID of the conversation' })
  @ApiResponse({
    status: 200,
    description: 'Conversation object with full message history.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden if user is not a participant.',
  })
  @ApiResponse({ status: 404, description: 'Conversation not found.' })
  getConversationDetails(
    @CurrentUser() user: AuthRequest['user'],
    @Param('id') conversationId: string,
  ) {
    return this.messagingService.getConversationDetails(
      conversationId,
      user.id,
    );
  }

  @Get('conversations/:id/messages')
  @ApiOperation({
    summary: 'Get a page of message history',
  })
  @ApiParam({ name: 'id', description: 'UUID of the conversation' })
  @ApiResponse({ status: 200, description: 'Conversation info object.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden if user is not a participant.',
  })
  @ApiResponse({ status: 404, description: 'Conversation not found.' })
  getConversationMessages(
    @CurrentUser() user: AuthRequest['user'],
    @Param('id') conversationId: string,
    @Query() query: GetConversationMessagesQueryDto,
  ) {
    return this.messagingService.getConversationMessages(
      conversationId,
      user.id,
      query,
    );
  }

  @Post('conversations/:id/messages')
  @ApiOperation({
    summary:
      'Send a message in a conversation via REST API (Document sharing support)',
    description:
      'Sends a message to the conversation. Accepts text content and optional attachmentUrl.',
  })
  @ApiParam({ name: 'id', description: 'UUID of the conversation' })
  @ApiResponse({ status: 201, description: 'Message sent successfully.' })
  sendMessage(
    @CurrentUser() user: AuthRequest['user'],
    @Param('id') conversationId: string,
    @Body() dto: Omit<CreateMessageDto, 'conversationId'>,
  ) {
    return this.messagingService.sendMessage(user.id, {
      ...dto,
      conversationId,
    });
  }

  @Patch('conversations/:id/status')
  @ApiOperation({
    summary: 'Update conversation status',
    description:
      'Updates the state of the conversation (SUGGEREE, CONSULTEE, EN_CONTACT, EN_NEGOCIATION, CONCLUE, REJETEE).',
  })
  @ApiParam({ name: 'id', description: 'UUID of the conversation' })
  @ApiResponse({ status: 200, description: 'Conversation status updated.' })
  updateConversationStatus(
    @CurrentUser() user: AuthRequest['user'],
    @Param('id') conversationId: string,
    @Body() dto: UpdateConversationStatusDto,
  ) {
    return this.messagingService.updateConversationStatus(
      conversationId,
      user.id,
      dto,
    );
  }

  @Patch('conversations/:id/read')
  @ApiOperation({
    summary: 'Mark unread messages in conversation as read',
  })
  @ApiParam({ name: 'id', description: 'UUID of the conversation' })
  @ApiResponse({ status: 200, description: 'Unread messages marked as read.' })
  markMessagesAsRead(
    @CurrentUser() user: AuthRequest['user'],
    @Param('id') conversationId: string,
  ) {
    return this.messagingService.markMessagesAsRead(conversationId, user.id);
  }

  // TODO
  // POST /conversations/:id/attachments
}

/**
1. User clicks "Contact Seller"

↓

2. Create Conversation (REST)

↓

3. Users open chat page

↓

4. Connect to Socket.IO

↓

5. Join room

↓

6. Send/Receive messages in real time

↓

7. Save every message to PostgreSQL
*/
