import {Component, EventEmitter, inject, Output} from "@angular/core";
import anime from "animejs";
import {TranslocoModule, TranslocoService} from "@jsverse/transloco";

export type Language = 'en' | 'fr' | 'nl';

@Component({
  selector: 'app-morph',
  standalone: true,
  imports: [TranslocoModule],
  template: `
    <div class="morph-container">
      <div class="buttons-container">
        <div class="morph-element" data-index="0" data-lang="en">
          <span class="start-text">English</span>
        </div>
        <div class="morph-element" data-index="1" data-lang="fr">
          <span class="start-text">Français</span>
        </div>
        <div class="morph-element" data-index="2" data-lang="nl">
          <span class="start-text">Nederlands</span>
        </div>
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

    .buttons-container {
      display: flex;
      gap: 2rem;
      padding: 1rem;
    }

    .morph-element {
      width: 120px;
      height: 120px;
      background-color: #7091E6;
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      transition: transform 0.2s ease;
    }

    .morph-element:hover {
      background-color: #3D52A0;
      transform: scale(1.05);
    }

    .start-text {
      color: white;
      font-size: 1.3rem;
      font-weight: 600;
      pointer-events: none;
      opacity: 1;
    }
  `]
})
export class MorphComponent {
  @Output() start = new EventEmitter<Language>();
  private readonly i18nService = inject(TranslocoService);

  constructor() {
    // Add click handlers to all morph elements
    setTimeout(() => {
      const morphElements = document?.querySelectorAll('.morph-element');
      morphElements?.forEach(element => {
        element.addEventListener('click', (event) => {
          const target = event.currentTarget as HTMLElement;
          const language = target.dataset["lang"] as Language;
          this.i18nService.setActiveLang(language);
          const buttonIndex = parseInt(target.dataset["index"] || '0');
          this.startMorph(buttonIndex, language);
        });
      });
    });
  }

  startMorph(buttonIndex: number, language: Language): void {
    const timeline = anime.timeline({
      easing: 'easeInOutSine',
      duration: 1500
    });

    // Fade out all texts
    timeline.add({
      targets: '.start-text',
      opacity: 0,
      scale: 0.9,
      duration: 400,
      easing: 'easeOutSine'
    })
      // Fade out non-selected buttons
      .add({
        targets: `.morph-element:not([data-index="${buttonIndex}"])`,
        opacity: 0,
        scale: 0.8,
        duration: 400,
        easing: 'easeOutSine'
      }, '-=400')
      // Expand the selected button
      .add({
        targets: `.morph-element[data-index="${buttonIndex}"]`,
        borderRadius: ['50%', '0%'],
        scale: [1, {
          value: Math.max(
            window.innerWidth / 120,
            window.innerHeight / 120
          ) * 1.2
        }],
        backgroundColor: {
          value: 'rgb(235, 244, 255)',
          duration: 2000,
          easing: 'easeOutQuad'
        }
      }, '-=200')
      .finished.then(() => {
      this.start.emit(language);
    });
  }
}
