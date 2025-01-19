import {Component, inject} from '@angular/core';
import {ErrorService} from "../error.service";
import {TranslocoDirective, TranslocoPipe} from "@jsverse/transloco";

@Component({
  selector: 'app-error',
  standalone: true,
  imports: [TranslocoDirective, TranslocoPipe],
  template: `
    @if (errorService.error(); as error) {
      @if (error.show) {
        <div class="error-overlay">
          <div class="error-modal" role="alertdialog" aria-modal="true">
            <div class="error-content">
              <div class="error-icon">⚠️</div>
              <p>{{ error.messageKey | transloco }}</p>
              <button
                (click)="errorService.hideError()"
                aria-label="Close error message"
                class="close-button">
                {{ 'OK' }}
              </button>
            </div>
          </div>
        </div>
      }
    }
  `,
  styles: [`
    .error-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .error-modal {
      background-color: white;
      border-radius: 8px;
      padding: 2rem;
      max-width: 90%;
      width: 400px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      animation: slideIn 0.3s ease-out;
    }

    .error-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 1rem;
    }

    .error-icon {
      font-size: 2rem;
    }

    p {
      margin: 0;
      color: #842029;
      font-size: 1rem;
      line-height: 1.5;
    }

    .close-button {
      background-color: #842029;
      color: white;
      border: none;
      padding: 0.5rem 2rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
      transition: background-color 0.2s;
    }

    .close-button:hover {
      background-color: #6d1b22;
    }

    @keyframes slideIn {
      from {
        transform: translateY(-20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `]
})
export class ErrorComponent {
  protected readonly errorService = inject(ErrorService);
}
