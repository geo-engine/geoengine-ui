import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fileName'
})
/**
 * FileNamePipe
 * Transforms a given string with a file-url to only the filename
 */
export class FileNamePipe implements PipeTransform {

  /**
   * Transforms a given string with a file-url to only the file-name
   * @param value url directing to a file
   * @returns {string} only the filename
   */
  transform(value: string): string {
    let split1 = value.split("/");
    let split2 = split1[split1.length - 1].split("?");

    return split2[split2.length - 1];
  }

}
