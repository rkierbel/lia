import {Component, EventEmitter, Output} from "@angular/core";
import anime from "animejs";

@Component({
  selector: 'app-morph',
  standalone: true,
  template: `
    <div class="morph-container">
      <div class="morph-element">
        <span class="start-text">Start</span>
      </div>
    </div>
  `,
  styles: [`
    .morph-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .morph-element {
      width: 120px;
      height: 120px;
      background-color: dodgerblue;
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      transition: transform 0.2s ease;
    }

    .morph-element:hover {
      transform: scale(1.05);
    }

    .start-text {
      color: white;
      font-size: 1.2rem;
      font-weight: 500;
      pointer-events: none;
      opacity: 1;
    }
  `]
})
export class MorphComponent {
  @Output() start = new EventEmitter<void>();

  constructor() {
    // Ensure we capture the click on the morphing element
    setTimeout(() => {
      const morphElement = document?.querySelector('.morph-element');
      if (morphElement) {
        morphElement.addEventListener('click', () => this.startMorph());
      }
    });
  }

  startMorph(): void {
    const timeline = anime.timeline({
      easing: 'easeInOutSine',
      duration: 1500
    });

    // First fade out the text smoothly
    timeline.add({
      targets: '.start-text',
      opacity: 0,
      scale: 0.9,
      duration: 400,
      easing: 'easeOutSine'
    })
      // Then expand and transform the circle
      .add({
        targets: '.morph-element',
        borderRadius: ['50%', '0%'],
        scale: [1, {
          value: Math.max(
            window.innerWidth / 120,
            window.innerHeight / 120
          ) * 1.2 // Scale a bit extra to ensure full coverage
        }],
        backgroundColor: {
          value: 'rgb(235, 244, 255)',
          duration: 2000,
          easing: 'easeOutQuad'
        }
      }, '-=200') // Start slightly before text fade completes
      .finished.then(() => {
        this.start.emit();
    });
  }
}
