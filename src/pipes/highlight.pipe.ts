import {Pipe, PipeTransform} from 'angular2/core';

@Pipe({name: 'highlightPipe'})
export class HighlightPipe implements PipeTransform{

  transform(text:string, [term]: [string]) : string{
    if(term){
      text = text.replace(new RegExp('('+term+')', 'gi'), '<span style="color:#e91e63;text-decoration:underline;">$1</span>'); //TODO: replace <span> with a <higlight> component?
    }
    return text;
  }
}
