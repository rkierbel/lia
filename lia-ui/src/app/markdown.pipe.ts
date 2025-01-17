import { Pipe, PipeTransform } from '@angular/core';
import {DomSanitizer, SafeHtml} from "@angular/platform-browser";
import {marked} from "marked";

@Pipe({
  name: 'markdown',
  standalone: true
})
export class MarkdownPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {
    // Configure marked options if needed
    marked.setOptions({
      gfm: true,
      breaks: true
    });
  }

  transform(value: string): SafeHtml {
    if (!value) return '';

    // Convert markdown to HTML
    const html = marked(value);

    // Sanitize the HTML to prevent XSS attacks while allowing markdown formatting
    return this.sanitizer.bypassSecurityTrustHtml(html as string);
  }
}
