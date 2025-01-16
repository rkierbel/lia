import {Component, EventEmitter, Output} from '@angular/core';

@Component({
  selector: 'app-start-pop-up',
  standalone: true,
  template: `
    <div class="popup-overlay">
      <div class="popup-content">
        <h2>Welcome human!</h2>
        <p>Ready to start the conversation?</p>
        <button (click)="start.emit()">Start</button>
      </div>
    </div>
  `,
  styles: [`
    .popup-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .popup-content {
      background: white;
      padding: 2rem;
      border-radius: 0.5rem;
      text-align: center;
    }

    button {
      background: dodgerblue;
      color: white;
      border: none;
      border-radius: 0.25rem;
      padding: 0.5rem 2rem;
      font-size: 1.2rem;
      cursor: pointer;
    }
  `]
})
export class StartPopUpComponent {
  @Output() start = new EventEmitter<void>();
}
