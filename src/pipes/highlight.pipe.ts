import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'waveHighlightPipe'})
export class HighlightPipe implements PipeTransform {

    // TODO: replace <span> with a <higlight> component?
    transform(text: string, term: string): string {
        if (term) {
            let rexp = new RegExp('(' + term + ')', 'gi');
            text = text.replace(rexp,
                '<span class="highlight">$1</span>');
        }
        return text;
    }
}
