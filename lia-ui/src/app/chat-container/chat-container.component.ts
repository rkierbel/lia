import { Component, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MessageComponent } from '../message/message.component';
import { IMessage } from '../interface/message';

@Component({
  selector: 'app-chat-container',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MessageComponent
  ],
  template: `
    <div class="chat-container">
      <div #messageContainer class="messages-container">
        @for (message of messages; track message.timestamp) {
          <app-message [message]="message" />
        }
      </div>
      <div class="input-container">
        <mat-form-field appearance="outline" class="message-input">
          <input matInput
                 [(ngModel)]="newMessage"
                 placeholder="Type a message..."
                 (keyup.enter)="sendMessage()">
        </mat-form-field>
        <button mat-icon-button
                color="primary"
                [disabled]="!newMessage.trim()"
                (click)="sendMessage()">
          <mat-icon>send</mat-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .chat-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      max-height: 600px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    }
    .input-container {
      display: flex;
      align-items: center;
      padding: 16px;
      border-top: 1px solid #ddd;
    }
    .message-input {
      flex: 1;
      margin-right: 8px;
    }
  `]
})
export class ChatContainerComponent implements AfterViewChecked {
  @ViewChild('messageContainer') private messageContainer!: ElementRef;

  messages: IMessage[] = [];
  newMessage = '';

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  sendMessage() {
    if (this.newMessage.trim()) {
      this.messages.push({
        content: this.newMessage,
        timestamp: new Date(),
        isUser: true
      });
      this.newMessage = '';
      this.scrollToBottom();
    }
  }

  private scrollToBottom() {
    try {
      this.messageContainer.nativeElement.scrollTop =
        this.messageContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }
}
