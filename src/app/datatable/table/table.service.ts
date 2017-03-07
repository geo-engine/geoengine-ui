import {Injectable} from '@angular/core';
import {Http, Response} from '@angular/http';
import {Observable} from "rxjs/Observable";

@Injectable()

/**
 * This service loads data for the data-table component
 */
export class TableService {

  /**
   * Sets up variables
   * @param http Reference to Http
   */
  constructor(private http:Http) {

  }

  /**
   * Loads the given geojson-resource from the folder src/resources
   * @param resource the filename of a geojson-file in the folder src/resources that shall be loaded
   * @returns {Observable<R>} the contents of the geojson-file
   */
  getData(resource) {
    return this.http.get('../../resources/'+resource)
      .map(res => res.json())
      .catch(this.handleError);
  }

  /**
   * Handles Errors when reading the json-file
   * @param error
   * @returns {any}
   */
  private handleError(error: Response) {
    console.error(error);
    return Observable.throw(error.json().error || 'Server Error');
  }
}
