import {Component, computed, effect, inject, OnDestroy, OnInit} from '@angular/core';
import {MessageService} from "./conversation/message.service";
import {FormsModule, NgForm} from "@angular/forms";
import {NgClass, NgIf} from "@angular/common";
import {v4 as uuidv4} from 'uuid';
import {Language, MorphComponent} from "./morph/morph.component";
import {MarkdownPipe} from "./markdown.pipe";
import {ErrorComponent} from "./error/error.component";
import {TranslocoService} from "@jsverse/transloco";
import {environment} from "../environments/environment.development";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NgClass, FormsModule, MorphComponent, NgIf, MarkdownPipe, ErrorComponent],
  template: `
    <app-error />

    @if (showStartScreen()) {
      <app-morph (start)="startConversation($event)"/>
    }
    @if (!showStartScreen()) {
      <div class="messages-container">
        @for (message of messages(); track message.id) {
          <div
            *ngIf="!(message.text === '' && message.fromUser)"
            class="message"
            [ngClass]="{
                'from-user': message.fromUser,
                generating: message.generating
            }"
            [innerHTML]="message.text | markdown"></div>
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
export class AppComponent implements OnDestroy, OnInit {
  private readonly messageService = inject(MessageService);
  private readonly i18nService = inject(TranslocoService);
  readonly threadId = this.messageService.threadId;

  readonly messages = this.messageService.messages;
  readonly generatingInProgress = this.messageService.generatingInProgress;

  protected readonly showStartScreen = computed(() => this.messageService.isFirstVisit());

  ngOnInit() {
    this.i18nService.load(`${environment.baseUrl}/assets/i18n/en.json`)
    this.i18nService.load(`${environment.baseUrl}/assets/i18n/fr.json`)
    this.i18nService.load(`${environment.baseUrl}/assets/i18n/nl.json`)
  }

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

  startConversation(language: Language): void {
    this.messageService.sendMessage('', uuidv4(), language);
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
