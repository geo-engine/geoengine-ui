import {Injectable} from '@angular/core';
import {HttpClient, HttpEvent, HttpHeaders, HttpParams} from '@angular/common/http';
import {Observable, Subject} from 'rxjs';
import {Config} from '../config.service';
import {bboxDictToExtent, unixTimestampToIsoString} from '../util/conversions';
import {
    BBoxDict,
    CreateProjectResponseDict,
    DataSetDict,
    PlotDict,
    LayerDict,
    ProjectDict,
    ProjectFilterDict,
    ProjectListingDict,
    ProjectOrderByDict,
    ProjectPermissionDict,
    RegisterWorkflowResultDict,
    RegistrationDict,
    SessionDict,
    STRectangleDict,
    SrsString,
    TimeIntervalDict,
    TimeStepDict,
    UUID,
    WorkflowDict,
    PlotDataDict,
    RasterResultDescriptorDict,
    PlotResultDescriptorDict,
    VectorResultDescriptorDict,
    UploadResponseDict,
    DataSetIdDict,
    CreateDataSetDict,
} from './backend.model';

@Injectable({
    providedIn: 'root',
})
export class BackendService {
    readonly wmsUrl = `${this.config.API_URL}/wms`;

    constructor(protected readonly http: HttpClient, protected readonly config: Config) {}

    registerUser(request: {email: string; password: string; real_name: string}): Observable<RegistrationDict> {
        return this.http.post<RegistrationDict>(this.config.API_URL + '/user', request);
    }

    loginUser(request: {email: string; password: string}): Observable<SessionDict> {
        return this.http.post<SessionDict>(this.config.API_URL + '/login', request);
    }

    getSession(sessionId: UUID): Observable<SessionDict> {
        return this.http.get<SessionDict>(this.config.API_URL + '/session', {
            headers: new HttpHeaders().set('Authorization', `Bearer ${sessionId}`),
        });
    }

    logoutUser(sessionId: UUID): Observable<void> {
        return this.http.post<void>(this.config.API_URL + '/logout', null, {
            headers: new HttpHeaders().set('Authorization', `Bearer ${sessionId}`),
        });
    }

    createAnonymousUserSession(): Observable<SessionDict> {
        return this.http.post<SessionDict>(this.config.API_URL + '/anonymous', null);
    }

    createProject(
        request: {
            name: string;
            description: string;
            bounds: STRectangleDict;
            time_step: TimeStepDict;
        },
        sessionId: UUID,
    ): Observable<CreateProjectResponseDict> {
        return this.http.post<CreateProjectResponseDict>(this.config.API_URL + '/project', request, {
            headers: BackendService.authorizationHeader(sessionId),
        });
    }

    updateProject(
        request: {
            id: UUID;
            name?: string;
            description?: string;
            layers?: Array<LayerDict | 'none' | 'delete'>;
            plots?: Array<PlotDict | 'none' | 'delete'>;
            bounds?: STRectangleDict;
            time_step?: TimeStepDict;
        },
        sessionId: UUID,
    ): Observable<void> {
        return this.http.patch<void>(`${this.config.API_URL}/project/${request.id}`, request, {
            headers: BackendService.authorizationHeader(sessionId),
        });
    }

    deleteProject(projectId: UUID, sessionId: UUID): Observable<void> {
        return this.http.get<void>(`${this.config.API_URL}/project/${projectId}`, {
            headers: BackendService.authorizationHeader(sessionId),
        });
    }

    loadProject(projectId: UUID, sessionId: UUID, projectVersionId?: UUID): Observable<ProjectDict> {
        let requestUri = `${this.config.API_URL}/project/${projectId}`;
        if (projectVersionId) {
            requestUri += `/${projectVersionId}`;
        }

        return this.http.get<ProjectDict>(requestUri, {
            headers: BackendService.authorizationHeader(sessionId),
        });
    }

    listProjects(
        request: {
            permissions: Array<ProjectPermissionDict>;
            filter: ProjectFilterDict;
            order: ProjectOrderByDict;
            offset: number;
            limit: number;
        },
        sessionId: UUID,
    ): Observable<Array<ProjectListingDict>> {
        const params = new NullDiscardingHttpParams();
        params.setMapped('permissions', request.permissions, JSON.stringify);
        params.setMapped('filter', request.filter, (filter) => (filter === 'None' ? 'None' : JSON.stringify(filter)));
        params.set('order', request.order);
        params.setMapped('offset', request.offset, JSON.stringify);
        params.setMapped('limit', request.limit, JSON.stringify);

        return this.http.get<Array<ProjectListingDict>>(this.config.API_URL + '/projects', {
            params: params.httpParams,
            headers: BackendService.authorizationHeader(sessionId),
        });
    }

    registerWorkflow(workflow: WorkflowDict, sessionId: UUID): Observable<RegisterWorkflowResultDict> {
        return this.http.post<RegisterWorkflowResultDict>(this.config.API_URL + '/workflow', workflow, {
            headers: BackendService.authorizationHeader(sessionId),
        });
    }

    getWorkflow(workflowId: UUID, sessionId: UUID): Observable<WorkflowDict> {
        return this.http.get<WorkflowDict>(this.config.API_URL + `/workflow/${workflowId}`, {
            headers: BackendService.authorizationHeader(sessionId),
        });
    }

    getWorkflowMetadata(
        workflowId: UUID,
        sessionId: UUID,
    ): Observable<RasterResultDescriptorDict | VectorResultDescriptorDict | PlotResultDescriptorDict> {
        return this.http.get<RasterResultDescriptorDict | VectorResultDescriptorDict | PlotResultDescriptorDict>(
            this.config.API_URL + `/workflow/${workflowId}/metadata`,
            {
                headers: BackendService.authorizationHeader(sessionId),
            },
        );
    }

    setSessionProject(projectId: UUID, sessionId: UUID): Observable<void> {
        const response = new Subject<void>();
        this.http
            .post<void>(`${this.config.API_URL}/session/project/${projectId}`, null, {
                headers: BackendService.authorizationHeader(sessionId),
            })
            .subscribe(response);
        return response;
    }

    wfsGetFeature(
        request: {
            typeNames: string;
            bbox: BBoxDict;
            time?: TimeIntervalDict;
            srsName?: SrsString;
            namespaces?: string;
            count?: number;
            sortBy?: string;
            resultType?: string;
            filter?: string;
            propertyName?: string;
        },
        sessionId: UUID,
    ): Observable<any> {
        const params = new NullDiscardingHttpParams();

        params.set('service', 'WFS');
        params.set('version', '2.0.0');
        params.set('request', 'GetFeature');
        params.set('outputFormat', 'application/json');

        params.set('typeNames', request.typeNames);
        params.setMapped('bbox', request.bbox, (bbox) => bboxDictToExtent(bbox).join(','));
        params.setMapped('time', request.time, (time) => `${unixTimestampToIsoString(time.start)}/${unixTimestampToIsoString(time.end)}`);
        params.set('srsName', request.srsName);

        // these probably do not work yet
        params.set('namespaces', request.namespaces);
        params.setMapped('count', request.count, JSON.stringify);
        params.set('sortBy', request.sortBy);
        params.set('resultType', request.resultType);
        params.set('filter', request.filter);
        params.set('propertyName', request.propertyName);

        return this.http.get<any>(this.config.API_URL + '/wfs', {
            headers: BackendService.authorizationHeader(sessionId),
            params: params.httpParams,
        });
    }

    getPlot(
        workflowId: UUID,
        request: {
            bbox: BBoxDict;
            time: TimeIntervalDict;
            spatial_resolution: [number, number];
        },
        sessionId: UUID,
    ): Observable<PlotDataDict> {
        const params = new NullDiscardingHttpParams();

        params.setMapped('bbox', request.bbox, (bbox) => bboxDictToExtent(bbox).join(','));
        params.setMapped('time', request.time, (time) => `${unixTimestampToIsoString(time.start)}/${unixTimestampToIsoString(time.end)}`);
        params.setMapped('spatial_resolution', request.spatial_resolution, (resolution) => resolution.join(','));

        return this.http.get<PlotDataDict>(this.config.API_URL + `/plot/${workflowId}`, {
            headers: BackendService.authorizationHeader(sessionId),
            params: params.httpParams,
        });
    }

    // TODO: turn into paginated data source
    getDataSets(sessionId: UUID): Observable<Array<DataSetDict>> {
        const params = new NullDiscardingHttpParams();
        params.set('order', 'NameAsc');
        params.set('offset', '0');
        params.set('limit', '20');

        return this.http.get<Array<DataSetDict>>(this.config.API_URL + '/datasets', {
            params: params.httpParams,
            headers: BackendService.authorizationHeader(sessionId),
        });
    }

    upload(sessionId: UUID, form: FormData): Observable<HttpEvent<UploadResponseDict>> {
        return this.http.post<UploadResponseDict>(this.config.API_URL + '/upload', form, {
            headers: BackendService.authorizationHeader(sessionId),
            reportProgress: true,
            observe: 'events',
        });
    }

    createDataSet(sessionId: UUID, createDataSet: CreateDataSetDict): Observable<DataSetIdDict> {
        return this.http.post<DataSetIdDict>(this.config.API_URL + '/dataset', createDataSet, {
            headers: BackendService.authorizationHeader(sessionId),
        });
    }

    private static authorizationHeader(sessionId: UUID): HttpHeaders {
        return new HttpHeaders().set('Authorization', `Bearer ${sessionId}`);
    }
}

/**
 * A wrapper around `HttpParams` that automatically discards operations with empty values.
 */
class NullDiscardingHttpParams {
    httpParams: HttpParams = new HttpParams();

    set(param: string, value: string): void {
        if (value === undefined || value === null) {
            return;
        }

        this.httpParams = this.httpParams.set(param, value);
    }

    setMapped<V>(param: string, value: V, transform: (v: V) => string): void {
        if (value === undefined || value === null) {
            return;
        }

        this.httpParams = this.httpParams.set(param, transform(value));
    }
}
