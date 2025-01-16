import {Component, computed, effect, inject, OnDestroy} from '@angular/core';
import {MessageService} from "./conversation/message.service";
import {FormsModule, NgForm} from "@angular/forms";
import {NgClass, NgIf} from "@angular/common";
import {v4 as uuidv4} from 'uuid';
import {MorphComponent} from "./morph/morph.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NgClass, FormsModule, MorphComponent, NgIf],
  template: `
    <h1></h1>
    @if (showStartPopup()) {
      <app-morph (start)="startConversation()"/>
    }
    @if (!showStartPopup()) {
      <div class="messages-container">
        @for (message of messages(); track message.id) {
          <pre
            *ngIf="message.text !== ''"
            class="message"
            [ngClass]="{
          'from-user': message.fromUser,
          generating: message.generating
        }"
          >{{ message.text }}</pre
          >
        }
      </div>

      <form #form="ngForm" (ngSubmit)="sendMessage(form, form.value.message)">
        <input
          name="message"
          placeholder="Type a message"
          ngModel
          required
          autofocus
          [disabled]="generatingInProgress()"
        />
        <button type="submit" [disabled]="generatingInProgress() || form.invalid">
          Send
        </button>
      </form>
    }
  `,
})
export class AppComponent implements OnDestroy {
  private readonly messageService = inject(MessageService);
  readonly threadId = this.messageService.threadId;

  readonly messages = this.messageService.messages;
  readonly generatingInProgress = this.messageService.generatingInProgress;

  protected readonly showStartPopup = computed(() => this.messageService.isFirstVisit());

  private readonly scrollEffect = effect(() => {
    // run this effect on every `messages` change
    this.messages();

    setTimeout(() =>
      window?.scrollTo({
        top: document?.body.scrollHeight,
        behavior: 'smooth',
      }),
    );
  });

  startConversation(): void {
    this.messageService.sendMessage('', uuidv4());
    this.messageService.completeFirstVisit();
  }

  sendMessage(form: NgForm, messageText: string): void {
    this.messageService.sendMessage(messageText, this.threadId());
    form.resetForm();
  }

  ngOnDestroy(): void {
    this.scrollEffect.destroy();
  }
}
