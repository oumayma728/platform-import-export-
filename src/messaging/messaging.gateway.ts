import { Logger, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { JwtPayload } from '../auth/interfaces/jwt-payload';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateConversationStatusDto } from './dto/update-conversation-status.dto';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { MessagingService } from './messaging.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/messaging',
})
export class MessagingGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MessagingGateway.name);

  constructor(
    private readonly messagingService: MessagingService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  afterInit() {
    this.logger.log('WebSocket Gateway initialized on namespace /messaging');
  }

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        this.logger.warn(`Connection rejected: Missing token (client id: ${client.id})`);
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });

      if (!payload || !payload.sub) {
        this.logger.warn(`Connection rejected: Invalid token payload (client id: ${client.id})`);
        client.disconnect();
        return;
      }

      // Attach user information to socket context
      client.data.user = {
        id: payload.sub,
        name: payload.name,
        role: payload.role,
      };

      // Join user's private notification room
      await client.join(`user:${payload.sub}`);
      this.logger.log(`Client connected: ${client.id} (User: ${payload.name} [${payload.sub}])`);
    } catch (error) {
      this.logger.error(`Connection authentication failed: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Helper: Extract token from handshake
   */
  private extractToken(client: Socket): string | null {
    const authHeader =
      client.handshake.auth?.token ||
      client.handshake.auth?.authorization ||
      client.handshake.headers?.authorization;

    if (authHeader) {
      if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
      }
      if (typeof authHeader === 'string') {
        return authHeader;
      }
    }

    const queryToken = client.handshake.query?.token;
    if (typeof queryToken === 'string') {
      return queryToken;
    }

    return null;
  }

  /**
   * Helper: Retrieve authenticated user from socket data
   */
  private getAuthenticatedUser(client: Socket) {
    const user = client.data.user;
    if (!user || !user.id) {
      throw new WsException('Unauthorized access');
    }
    return user;
  }

  /**
   * Event: Join a specific conversation room
   */
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('joinConversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const user = this.getAuthenticatedUser(client);
    if (!data?.conversationId) {
      throw new WsException('conversationId is required');
    }

    // Verify user is allowed to access this conversation
    await this.messagingService.getConversationDetails(data.conversationId, user.id);

    const roomName = `conversation:${data.conversationId}`;
    await client.join(roomName);
    this.logger.log(`User ${user.id} joined room ${roomName}`);

    return { event: 'joinedConversation', conversationId: data.conversationId };
  }

  /**
   * Event: Leave a specific conversation room
   */
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('leaveConversation')
  async handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    if (!data?.conversationId) return;
    const roomName = `conversation:${data.conversationId}`;
    await client.leave(roomName);
    return { event: 'leftConversation', conversationId: data.conversationId };
  }

  /**
   * Event: Send Message (Real-time broadcasting to room)
   */
  @UseGuards(WsJwtGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() createMessageDto: CreateMessageDto,
  ) {
    const user = this.getAuthenticatedUser(client);

    // Save message via service
    const savedMessage = await this.messagingService.sendMessage(user.id, createMessageDto);

    const roomName = `conversation:${createMessageDto.conversationId}`;

    // Broadcast to room (including sender or excluding sender if client handles optimistic UI)
    this.server.to(roomName).emit('newMessage', savedMessage);

    return savedMessage;
  }

  /**
   * Event: Update Conversation Status
   */
  @UseGuards(WsJwtGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  @SubscribeMessage('updateStatus')
  async handleUpdateStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; status: UpdateConversationStatusDto['status'] },
  ) {
    const user = this.getAuthenticatedUser(client);

    if (!data.conversationId || !data.status) {
      throw new WsException('conversationId and status are required');
    }

    const updated = await this.messagingService.updateConversationStatus(
      data.conversationId,
      user.id,
      { status: data.status },
    );

    const roomName = `conversation:${data.conversationId}`;
    this.server.to(roomName).emit('statusUpdated', updated);

    return updated;
  }

  /**
   * Event: Typing indicator
   */
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; isTyping: boolean },
  ) {
    const user = this.getAuthenticatedUser(client);
    if (!data.conversationId) return;

    const roomName = `conversation:${data.conversationId}`;
    client.to(roomName).emit('userTyping', {
      conversationId: data.conversationId,
      userId: user.id,
      userName: user.name,
      isTyping: data.isTyping,
    });
  }

  /**
   * Event: Mark messages as read
   */
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('markRead')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const user = this.getAuthenticatedUser(client);
    if (!data.conversationId) return;

    const result = await this.messagingService.markMessagesAsRead(data.conversationId, user.id);

    const roomName = `conversation:${data.conversationId}`;
    this.server.to(roomName).emit('messagesRead', {
      conversationId: data.conversationId,
      readByUserId: user.id,
      updatedCount: result.updatedCount,
    });

    return result;
  }
}
