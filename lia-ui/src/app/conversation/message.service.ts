import {inject, Injectable, signal} from '@angular/core';
import {
  HttpClient,
  HttpDownloadProgressEvent,
  HttpErrorResponse,
  HttpEvent,
  HttpEventType,
  HttpResponse
} from "@angular/common/http";
import {Message} from "./message";
import {catchError, filter, map, Observable, startWith, tap} from "rxjs";
import {Language} from "../morph/morph.component";
import {ErrorService} from "../error.service";
import {environment} from "../../environments/environment.development";

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private readonly http = inject(HttpClient);
  private readonly errorService = inject(ErrorService);
  private hasError = false;

  private readonly _threadId = signal<string>('');
  private readonly _isFirstVisit = signal<boolean>(true);

  private readonly _completeMessages = signal<Message[]>([]);
  private readonly _messages = signal<Message[]>([]);
  private readonly _generatingInProgress = signal<boolean>(false);

  readonly threadId = this._threadId.asReadonly();
  readonly isFirstVisit = this._isFirstVisit.asReadonly();
  readonly messages = this._messages.asReadonly();
  readonly generatingInProgress = this._generatingInProgress.asReadonly();

  sendMessage(prompt: string = '', threadId: string, language?: Language): void {
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

    this.getChatResponseStream(prompt, this._threadId(), language).subscribe({
      next: (message) =>
        this._messages.set([...this._completeMessages(), message]),

      complete: () => {
        this._completeMessages.set(this._messages());
        this._generatingInProgress.set(false);
      },

      error: (error) => {
        this._generatingInProgress.set(false);
          this.handleError(error);
      }
    });
  }

  private getChatResponseStream(prompt: string,
                                threadId: string,
                                language?: Language): Observable<Message> {
    this.hasError = false;
    const id = window.crypto.randomUUID();

    return this.http
      .post(`${environment.apiUrl}/api/conversation`, {
        message: prompt,
        threadId,
        isNew: this.isFirstVisit(),
        userLang: language
      }, {
        responseType: 'text',
        observe: 'events',
        reportProgress: true,
        withCredentials: false
      })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          this.hasError = true;
          this._generatingInProgress.set(false);
          throw this.transformError(error);
        }),
        filter(
          (event: HttpEvent<string>): boolean =>
            !this.hasError &&
            event.type === HttpEventType.DownloadProgress ||
            event.type === HttpEventType.Response
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
        )
      );
  }

  completeFirstVisit(): void {
    this._isFirstVisit.set(false);
  }

  private transformError(error: HttpErrorResponse): Error {
    switch (error.status) {
      case 400:
        return new Error('errors.invalid_request');
      case 401:
        return new Error('errors.unauthorized');
      case 403:
        return new Error('errors.forbidden');
      case 404:
        return new Error('errors.not_found');
      case 429:
        return new Error('errors.too_many_requests');
      case 500:
        return new Error('errors.server_error');
      default:
        return new Error('errors.unexpected');
    }
  }

  private handleError(error: any): void {
    const messageKey = error?.message || 'errors.unexpected';
    this.errorService.showError(messageKey);
  }
}
