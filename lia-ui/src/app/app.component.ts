import {ChangeDetectionStrategy, Component, computed, effect, inject, OnDestroy, signal} from '@angular/core';
import {MessageService} from "./message.service";
import {FormsModule, NgForm} from "@angular/forms";
import {NgClass, NgIf} from "@angular/common";
import {StartPopUpComponent} from "./start-pop-up/start-pop-up.component";
import {v4 as uuidv4} from 'uuid';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NgClass, FormsModule, StartPopUpComponent, NgIf],
  template: `
    <h1>lia</h1>
    @if (showStartPopup()) {
      <app-start-pop-up (start)="startConversation()"/>
    }
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

    // scroll after the messages render
    setTimeout(() =>
      window?.scrollTo({
        top: document.body.scrollHeight,
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
