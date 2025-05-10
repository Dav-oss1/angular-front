

import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as Stomp from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Message } from '../models/message';

import { environment } from '../../environment/environment'; 

@Component({
  selector: 'app-chat',
  imports: [FormsModule, CommonModule],
  templateUrl: './chat.component.html'
})
export class ChatComponent implements OnInit{
  client!: Stomp.Client;
  connected: boolean = false;

  messages: Message[] = [];
  message: Message = new Message();

  writing!: string;
  clientId!: string;

  constructor() {
    this.clientId = 'id-' + new Date().getTime() + '-' + Math.random().toString(36).substring(2);
  }
  ngOnInit(): void {
    this.client = new Stomp.Client({
      brokerURL: undefined,
      webSocketFactory: () => new SockJS(environment.websocketUrl),
      debug: str => console.log(str),
      reconnectDelay: 5000
    });

    this.client.onConnect = (frame) => {
      this.connected = true;
      console.log(`Conectados: ${this.client.connected} : ${frame}`);


      this.client.subscribe('/chat/message', e => {
        const msg: Message = JSON.parse(e.body) as Message;
        msg.date = new Date(msg.date);
        if (this.message.username === msg.username && !this.message.color && msg.type === 'NEW_USER') {
          this.message.color = msg.color;
        }
        this.messages.push(msg);
      });

      // Suscribirse a eventos de escritura
      this.client.subscribe('/chat/writing', event => {
        const writingMessage = event.body;
        const usernameWriting = writingMessage.split(' ')[0];
        if (usernameWriting !== this.message.username) {
          this.writing = writingMessage;
          setTimeout(() => this.writing = '', 3000);
        }
      });

      this.client.subscribe(
        `/chat/history/${this.clientId}`,
        event => {
          const histories = JSON.parse(event.body) as Message[];

          this.messages = histories;


          this.message.type = 'NEW_USER';
          this.client.publish({
            destination: '/app/message',
            body: JSON.stringify(this.message)
          });
        }
      );

      this.client.publish({destination: '/app/history', body: this.clientId});
    };

    this.client.onDisconnect = (frame) => {
      this.connected = false;
      this.message = new Message();
      this.messages = [];
      console.log(`Desconectados: ${!this.client.connected} : ${frame}`);
    };
  }
  
  connect(): void {
    this.client.activate();
  }
  
  deconnect(): void {
    this.client.deactivate();
  }

  onSendMessage() {
    this.message.type = 'MESSAGE';
    this.client.publish({
      destination: '/app/message',
      body: JSON.stringify(this.message)
    });
    this.message.text = '';
  }

  onWritingEvent(): void {
    this.client.publish({
      destination: '/app/writing',
      body: this.message.username
    });
  }

}

