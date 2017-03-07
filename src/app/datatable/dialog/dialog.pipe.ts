import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dialog'
})

/**
 * UNUSED - MOVED TO DIALOG.COMPONENT
 */
export class DialogPipe implements PipeTransform {

  transform(value: string): string {
    let ret: string;

    let dotSplits = value.split(".");
    let fileEnding = dotSplits[dotSplits.length - 1];

    switch (fileEnding) {
      //Image
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'png':
      case 'svg':
      case 'bmp':
        ret = "image";
        break;

      //Audio
      case 'wav':
      case 'mp3':
      case 'ogg':
      case 'aac':
        ret = "audio";
        break;

      //Video
      case 'mp4':
      case 'webm':
      case 'ogv':
        ret = "video";
        break;

      //None
      default:
        ret = "";
    }

    //console.log(ret);
    return ret;
  }

}
