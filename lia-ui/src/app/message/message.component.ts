import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { IMessage } from '../interface/message';

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <mat-card [ngClass]="{'user-message': message.isUser, 'bot-message': !message.isUser}"
             class="message-card m-2">
      <mat-card-content>
        <p>{{ message.content }}</p>
        <small class="text-muted">{{ message.timestamp | date:'short' }}</small>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .message-card {
      max-width: 70%;
      margin-bottom: 8px;
    }
    .user-message {
      margin-left: auto;
      background-color: #e3f2fd;
    }
    .bot-message {
      margin-right: auto;
      background-color: #f5f5f5;
    }
    .text-muted {
      color: #666;
      font-size: 0.8rem;
    }
  `]
})
export class MessageComponent {
  @Input({ required: true }) message!: IMessage;
}
