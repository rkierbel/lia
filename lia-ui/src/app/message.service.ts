import {inject, Injectable, signal} from '@angular/core';
import {HttpClient, HttpDownloadProgressEvent, HttpEvent, HttpEventType, HttpResponse} from "@angular/common/http";
import {Message} from "./message";
import {filter, map, Observable, startWith, tap} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private readonly http = inject(HttpClient);

  private readonly _threadId = signal<string>('');
  private readonly _isFirstVisit = signal<boolean>(true);

  private readonly _completeMessages = signal<Message[]>([]);
  private readonly _messages = signal<Message[]>([]);
  private readonly _generatingInProgress = signal<boolean>(false);

  readonly threadId = this._threadId.asReadonly();
  readonly isFirstVisit = this._isFirstVisit.asReadonly();
  readonly messages = this._messages.asReadonly();
  readonly generatingInProgress = this._generatingInProgress.asReadonly();

  sendMessage(prompt: string = '', threadId: string): void {
    this._generatingInProgress.set(true);

    this._threadId.set(threadId);

    this._completeMessages.set([
      ...this._completeMessages(),
      {
        id: window.crypto.randomUUID(),
        text: prompt,
        fromUser: true
      }
    ]);

    this.getChatResponseStream(prompt, this._threadId()).subscribe({
      next: (message) =>
        this._messages.set([...this._completeMessages(), message]),

      complete: () => {
        this._completeMessages.set(this._messages());
        this._generatingInProgress.set(false);
      },

      error: () => this._generatingInProgress.set(false),
    });
  }

  private getChatResponseStream(prompt: string, threadId: string): Observable<Message> {
    const id = window.crypto.randomUUID();

    return this.http
      .post('http://localhost:3003/api/conversation', {
        message: prompt,
        threadId,
        isNew: this.isFirstVisit()
      }, {
        responseType: 'text',
        observe: 'events',
        reportProgress: true,
      })
      .pipe(
        tap(e => console.log(e)),
        filter(
          (event: HttpEvent<string>): boolean =>
            event.type === HttpEventType.DownloadProgress ||
            event.type === HttpEventType.Response,
        ),
        map(
          (event: HttpEvent<string>): Message =>
            event.type === HttpEventType.DownloadProgress
              ? {
                id,
                text: (event as HttpDownloadProgressEvent).partialText!,
                fromUser: false,
                generating: true,
              }
              : {
                id,
                text: (event as HttpResponse<string>).body!,
                fromUser: false,
                generating: false,
              }
        ),
        startWith<Message>({
          id,
          text: '',
          fromUser: false,
          generating: true,
        }),
      );
  }

  completeFirstVisit(): void {
    this._isFirstVisit.set(false);
  }
}
