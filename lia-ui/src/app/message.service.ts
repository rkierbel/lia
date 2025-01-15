import {inject, Injectable, signal} from '@angular/core';
import {HttpClient, HttpDownloadProgressEvent, HttpEvent, HttpEventType, HttpResponse} from "@angular/common/http";
import {Message} from "./message";
import {filter, map, Observable, startWith} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private readonly http = inject(HttpClient);
  private readonly _threadId = signal<string>("");
  private readonly _messages = signal<Message[]>([]);
  private readonly _completeMessages = signal<Message[]>([]);
  private readonly _generatingInProgress = signal<boolean>(false);

  readonly threadId = this._threadId.asReadonly();
  readonly messages = this._messages.asReadonly();
  readonly generatingInProgress = this._generatingInProgress.asReadonly();

  sendMessage(prompt: string, threadId: string): void {
    this._generatingInProgress.set(true);

    this._completeMessages.set([
      ...this._completeMessages(),
      {
        threadId,
        text: prompt,
        fromUser: true,
      },
    ]);

    this.getChatResponseStream(prompt).subscribe({
      next: (message) => {
        this._threadId.set(message.threadId);
        this._messages.set([...this._completeMessages(), message]);
      },
      complete: () => {
        this._completeMessages.set(this._messages());
        this._generatingInProgress.set(false);
      },
      error: () => this._generatingInProgress.set(false),
    });
  }

  private getChatResponseStream(prompt: string): Observable<Message> {
    const id = window.crypto.randomUUID();

    return this.http
      .post('http://localhost:3002/api/conversation',
        {threadId:this.threadId(),message:prompt}, {
        responseType: 'text',
        observe: 'events',
        reportProgress: true,
      })
      .pipe(
        filter(
          (event: HttpEvent<string>): boolean =>
            event.type === HttpEventType.DownloadProgress ||
            event.type === HttpEventType.Response,
        ),
        map(
          (event: HttpEvent<string>): Message =>
            event.type === HttpEventType.DownloadProgress
              ? {
                threadId: '',
                text: (event as HttpDownloadProgressEvent).partialText!,
                fromUser: false,
                generating: true,
              }
              : {
                threadId: this.threadId(),
                text: (event as HttpResponse<string>).body!,
                fromUser: false,
                generating: false,
              },
        ),
        startWith<Message>({
          threadId: '',
          text: '',
          fromUser: false,
          generating: true,
        }),
      );
  }
}
