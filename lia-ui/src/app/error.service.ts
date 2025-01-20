import {inject, Injectable, signal} from '@angular/core';
import {TranslocoService} from "@jsverse/transloco";

export interface ErrorState {
  messageKey: string;
  params?: Record<string, string>;
  show: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorService {
  private i18nService = inject(TranslocoService);
  private readonly _error = signal<ErrorState>({ messageKey: '', show: false });
  readonly error = this._error.asReadonly();

  showError(messageKey: string, params?: Record<string, string>): void {
    this._error.set({ messageKey, params, show: true });

    // Auto hide after 5 seconds
    setTimeout(() => {
      this.hideError();
    }, 10000);
  }

  hideError(): void {
    this._error.set({ messageKey: '', show: false });
  }

  getTranslatedMessage(): string {
    const error = this._error();
    return error.messageKey ?
      this.i18nService.translate(error.messageKey, error.params) : '';
  }
}
