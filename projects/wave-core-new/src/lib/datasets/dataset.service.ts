import {Injectable} from '@angular/core';
import {BackendService} from '../backend/backend.service';
import {Observable} from 'rxjs';
import {DataSet} from './dataset.model';
import {UserService} from '../users/user.service';
import {mergeMap} from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class DataSetService {

    constructor(private backend: BackendService, private userService: UserService) {
    }

    getDataSetsStream(): Observable<Array<DataSet>> {
        return this.userService.getSessionStream().pipe(mergeMap(session => this.backend.getDataSetStream(session.sessionToken)));
    }
}
