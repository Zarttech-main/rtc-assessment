import {
  WebSocketGateway,
  SubscribeMessage,
  OnGatewayDisconnect,
  OnGatewayConnection,
  OnGatewayInit,
  WebSocketServer,
  MessageBody,
} from '@nestjs/websockets';
import { EventsService } from './events.service';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: '*',
    allowedHeaders: '*',
    credentials: true,
  },
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private readonly eventsService: EventsService) {}

  @SubscribeMessage('request.onlines')
  async onRequestOnlines() {
    return await this.getRoomMembers('online');
  }

  async afterInit() {
    console.log('Websocket Init');
  }

  async handleDisconnect(socket: Socket) {
    console.log(`Client disconnected: ${socket.id}`);
    this.leaveRoom(socket, 'online');
  }

  async handleConnection(socket: Socket) {
    console.log(`Client connected: ${socket.id}`);

    try {
      socket.data.user = JSON.parse(socket.handshake.query?.user as string);
    } catch (error) {
      console.log(error);
    }

    this.joinRoom(socket, 'online');
  }

  async joinRoom(socket: Socket, room: string) {
    socket.join(room);

    const members = await this.getRoomMembers(room);

    this.server.sockets.emit(`${room}.joined`, {
      members,
      room,
    });
  }

  async leaveRoom(socket: Socket, room: string) {
    socket.leave(room);

    const members = await this.getRoomMembers(room);

    this.server.sockets.emit(`${room}.left`, {
      members,
      room,
    });
  }

  async getRoomMembers(room: string) {
    const members = this.server.sockets.adapter.rooms.get(room);
    const memberSockets = (await this.server.sockets.fetchSockets()).filter(
      ({ id }) => Array.from(members).includes(id),
    );

    return memberSockets.map(({ data }) => data?.user);
  }

  async findUserSockets(_id: string | number) {
    const socketIds = [];

    (await this.server.sockets.fetchSockets()).map(({ data, id }) => {
      if (data.user.id === _id) {
        socketIds.push(id);
      }
    });

    return socketIds;
  }

  @SubscribeMessage('call-data')
  async callData() {
    try {
      // const res = await this.twilioClient.tokens.create();
      return {
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      };
    } catch (error) {
      console.error(error);
    }
  }

  @SubscribeMessage('outgoing-call')
  async callUser(@MessageBody() data: any) {
    try {
      const sockets = await this.findUserSockets(data.to);

      if (sockets?.length) {
        this.server.to(sockets).emit('incoming-call', data);
      }
    } catch (error) {
      console.error(error);
    }
  }

  @SubscribeMessage('answer-incoming-call')
  async answerCall(@MessageBody() data: any) {
    try {
      const sockets = await this.findUserSockets(data.to);

      if (sockets?.length) {
        this.server.to(sockets).emit('outgoing-answered', {
          from: data.from,
          answer: data.answer,
        });
      }
    } catch (error) {
      console.error(error);
    }
  }

  @SubscribeMessage('reject-incoming')
  async rejectCall(@MessageBody() data: any) {
    try {
      const sockets = await this.findUserSockets(data.to);

      if (sockets?.length) {
        this.server.to(sockets).emit('outgoing-rejected', {
          from: data.from,
        });
      }
    } catch (error) {
      console.error(error);
    }
  }

  @SubscribeMessage('candidate')
  async candidate(@MessageBody() data: any) {
    try {
      const sockets = await this.findUserSockets(data.to);

      if (sockets?.length) {
        this.server.to(sockets).emit('candidate', data);
      }
    } catch (error) {
      console.error(error);
    }
  }

  @SubscribeMessage('end-call')
  async endCall(@MessageBody() data: any) {
    try {
      const sockets = await this.findUserSockets(data.to);

      if (sockets?.length) {
        this.server.to(sockets).emit('call-ended', data);
      }
    } catch (error) {
      console.error(error);
    }
  }
}
