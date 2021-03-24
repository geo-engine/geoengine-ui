import {Injectable} from '@angular/core';
import {BackendService} from '../backend/backend.service';
import {Observable} from 'rxjs';
import {DataSet} from './dataset.model';
import {UserService} from '../users/user.service';
import {map, mergeMap} from 'rxjs/operators';
import {HttpEvent} from '@angular/common/http';
import {CreateDataSetDict, UploadResponseDict} from '../backend/backend.model';

@Injectable({
    providedIn: 'root',
})
export class DataSetService {
    constructor(private backend: BackendService, private userService: UserService) {}

    getDataSets(): Observable<Array<DataSet>> {
        return this.userService.getSessionStream().pipe(
            mergeMap((session) => this.backend.getDataSets(session.sessionToken)),
            map((dataSetDicts) => dataSetDicts.map((dict) => DataSet.fromDict(dict))),
        );
    }

    upload(form: FormData): Observable<HttpEvent<UploadResponseDict>> {
        return this.userService.getSessionStream().pipe(mergeMap((session) => this.backend.upload(session.sessionToken, form)));
    }

    createDataSet(create: CreateDataSetDict): Observable<DataSetIdDict> {
        return this.userService.getSessionStream().pipe(mergeMap((session) => this.backend.createDataSet(session.sessionToken, create)));
    }
}
