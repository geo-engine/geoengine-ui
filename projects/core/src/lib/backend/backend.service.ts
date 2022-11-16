import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpEvent, HttpHeaders, HttpParams} from '@angular/common/http';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {Config} from '../config.service';
import {bboxDictToExtent, unixTimestampToIsoString} from '../util/conversions';
import {
    BBoxDict,
    CreateProjectResponseDict,
    DatasetDict,
    PlotDict,
    ProjectLayerDict,
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
    UploadResponseDict,
    CreateDatasetDict,
    AutoCreateDatasetDict,
    DatasetIdResponseDict,
    MetaDataSuggestionDict,
    SuggestMetaDataDict,
    ResultDescriptorDict,
    SpatialReferenceSpecificationDict,
    DataSetProviderListingDict,
    ProvenanceOutputDict,
    DatasetOrderByDict,
    LayerDict,
    LayerCollectionDict,
    AuthCodeRequestURL,
    BackendInfoDict,
} from './backend.model';

export interface BackendStatus {
    available: boolean;
    httpError?: HttpErrorResponse;
    initial?: boolean;
}

@Injectable({
    providedIn: 'root',
})
export class BackendService {
    readonly wmsBaseUrl = `${this.config.API_URL}/wms`;
    protected readonly backendStatus$ = new BehaviorSubject<BackendStatus>({available: false, initial: true});

    constructor(protected readonly http: HttpClient, protected readonly config: Config) {
        this.triggerBackendStatusUpdate();
    }

    triggerBackendStatusUpdate(): void {
        this.getBackendAvailable().subscribe({
            next: () => {
                this.backendStatus$.next({available: true});
            },
            error: (err) => {
                this.backendStatus$.next({available: false, httpError: err});
            },
        });
    }

    registerUser(request: {email: string; password: string; realName: string}): Observable<RegistrationDict> {
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

    oidcInit(): Observable<AuthCodeRequestURL> {
        return this.http.post<AuthCodeRequestURL>(this.config.API_URL + '/oidcInit', null);
    }

    oidcLogin(request: {sessionState: string; code: string; state: string}): Observable<SessionDict> {
        return this.http.post<SessionDict>(this.config.API_URL + '/oidcLogin', request);
    }

    createProject(
        request: {
            name: string;
            description: string;
            bounds: STRectangleDict;
            timeStep: TimeStepDict;
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
            layers?: Array<ProjectLayerDict | 'none' | 'delete'>;
            plots?: Array<PlotDict | 'none' | 'delete'>;
            bounds?: STRectangleDict;
            timeStep?: TimeStepDict;
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

    getWorkflowMetadata(workflowId: UUID, sessionId: UUID): Observable<ResultDescriptorDict> {
        return this.http.get<ResultDescriptorDict>(this.config.API_URL + `/workflow/${workflowId}/metadata`, {
            headers: BackendService.authorizationHeader(sessionId),
        });
    }

    getBackendInfo(): Observable<BackendInfoDict> {
        return this.http.get<BackendInfoDict>(this.config.API_URL + '/info');
    }

    getBackendAvailable(): Observable<void> {
        return this.http.get<void>(this.config.API_URL + '/available');
    }

    getBackendStatus(): Observable<BackendStatus> {
        return this.backendStatus$;
    }

    getWorkflowProvenance(workflowId: UUID, sessionId: UUID): Observable<Array<ProvenanceOutputDict>> {
        return this.http.get<Array<ProvenanceOutputDict>>(this.config.API_URL + `/workflow/${workflowId}/provenance`, {
            headers: BackendService.authorizationHeader(sessionId),
        });
    }

    downloadWorkflowMetadata(workflowId: UUID, sessionId: UUID): Observable<HttpEvent<Blob>> {
        return this.http.get(this.config.API_URL + `/workflow/${workflowId}/allMetadata/zip`, {
            headers: BackendService.authorizationHeader(sessionId),
            responseType: 'blob',
            reportProgress: true,
            observe: 'events',
        });
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
            workflowId: UUID;
            bbox: BBoxDict;
            time?: TimeIntervalDict;
            srsName?: SrsString;
            namespaces?: string;
            count?: number;
            sortBy?: string;
            resultType?: string;
            filter?: string;
            propertyName?: string;
            // vendor parameter for specifying the spatial resolution
            queryResolution?: number; // TODO: allow x and y seperately
        },
        sessionId: UUID,
    ): Observable<any> {
        const params = new NullDiscardingHttpParams();

        params.set('service', 'WFS');
        params.set('version', '2.0.0');
        params.set('request', 'GetFeature');
        params.set('outputFormat', 'application/json');

        params.set('typeNames', `${request.workflowId}`);
        params.setMapped('bbox', request.bbox, (bbox) => bboxDictToExtent(bbox).join(','));
        params.setMapped('time', request.time, (time) => `${unixTimestampToIsoString(time.start)}/${unixTimestampToIsoString(time.end)}`);
        params.set('srsName', request.srsName);
        params.setMapped('queryResolution', request.queryResolution, (r) => r.toString());

        // these probably do not work yet
        params.set('namespaces', request.namespaces);
        params.setMapped('count', request.count, JSON.stringify);
        params.set('sortBy', request.sortBy);
        params.set('resultType', request.resultType);
        params.set('filter', request.filter);
        params.set('propertyName', request.propertyName);

        return this.http.get<any>(`${this.config.API_URL}/wfs/${request.workflowId}`, {
            headers: BackendService.authorizationHeader(sessionId),
            params: params.httpParams,
        });
    }

    getPlot(
        workflowId: UUID,
        request: {
            bbox: BBoxDict;
            crs: SrsString;
            time: TimeIntervalDict;
            spatialResolution: [number, number];
        },
        sessionId: UUID,
    ): Observable<PlotDataDict> {
        const params = new NullDiscardingHttpParams();

        params.setMapped('bbox', request.bbox, (bbox) => bboxDictToExtent(bbox).join(','));
        params.set('crs', request.crs);
        params.setMapped('time', request.time, (time) => `${unixTimestampToIsoString(time.start)}/${unixTimestampToIsoString(time.end)}`);
        params.setMapped('spatialResolution', request.spatialResolution, (resolution) => resolution.join(','));

        return this.http.get<PlotDataDict>(this.config.API_URL + `/plot/${workflowId}`, {
            headers: BackendService.authorizationHeader(sessionId),
            params: params.httpParams,
        });
    }

    getDataset(sessionId: UUID, datasetId: UUID): Observable<DatasetDict> {
        return this.http.get<DatasetDict>(this.config.API_URL + `/dataset/${datasetId}`, {
            headers: BackendService.authorizationHeader(sessionId),
        });
    }

    getDatasets(
        sessionId: UUID,
        offset: number = 0,
        limit: number = 20,
        order: DatasetOrderByDict = 'NameAsc',
    ): Observable<Array<DatasetDict>> {
        const params = new NullDiscardingHttpParams();
        params.setMapped('offset', offset, (r) => r.toString());
        params.setMapped('limit', limit, (r) => r.toString());
        params.set('order', order);

        return this.http.get<Array<DatasetDict>>(this.config.API_URL + '/datasets', {
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

    createDataset(sessionId: UUID, createDataset: CreateDatasetDict): Observable<DatasetIdResponseDict> {
        return this.http.post<DatasetIdResponseDict>(this.config.API_URL + '/dataset', createDataset, {
            headers: BackendService.authorizationHeader(sessionId),
        });
    }

    autoCreateDataset(sessionId: UUID, createDataset: AutoCreateDatasetDict): Observable<DatasetIdResponseDict> {
        return this.http.post<DatasetIdResponseDict>(this.config.API_URL + '/dataset/auto', createDataset, {
            headers: BackendService.authorizationHeader(sessionId),
        });
    }

    suggestMetaData(sessionId: UUID, suggestMetaData: SuggestMetaDataDict): Observable<MetaDataSuggestionDict> {
        const params = new NullDiscardingHttpParams();
        params.set('upload', suggestMetaData.upload);
        params.set('mainFile', suggestMetaData.mainFile);

        return this.http.get<MetaDataSuggestionDict>(this.config.API_URL + '/dataset/suggest', {
            params: params.httpParams,
            headers: BackendService.authorizationHeader(sessionId),
        });
    }

    getSpatialReferenceSpecification(sessionId: UUID, srsString: SrsString): Observable<SpatialReferenceSpecificationDict> {
        return this.http.get<SpatialReferenceSpecificationDict>(this.config.API_URL + `/spatialReferenceSpecification/${srsString}`, {
            headers: BackendService.authorizationHeader(sessionId),
        });
    }

    getDatasetProviders(sessionId: UUID): Observable<Array<DataSetProviderListingDict>> {
        const params = new NullDiscardingHttpParams();
        params.set('order', 'NameAsc');
        params.set('offset', '0');
        params.set('limit', '20');

        return this.http.get<Array<DataSetProviderListingDict>>(this.config.API_URL + '/providers', {
            params: params.httpParams,
            headers: BackendService.authorizationHeader(sessionId),
        });
    }

    getLayerCollectionItems(
        sessionId: UUID,
        provider: UUID,
        collection: string,
        offset: number = 0,
        limit: number = 20,
    ): Observable<LayerCollectionDict> {
        const params = new NullDiscardingHttpParams();
        params.setMapped('offset', offset, (r) => r.toString());
        params.setMapped('limit', limit, (r) => r.toString());

        // URI encode the collection id if it is a JSON string
        try {
            JSON.parse(collection);
            collection = encodeURIComponent(collection);
        } catch (e) {
            // do nothing
        }

        return this.http.get<LayerCollectionDict>(this.config.API_URL + `/layers/collections/${provider}/${collection}`, {
            params: params.httpParams,
            headers: BackendService.authorizationHeader(sessionId),
        });
    }

    getRootLayerCollectionItems(sessionId: UUID, offset: number = 0, limit: number = 20): Observable<LayerCollectionDict> {
        const params = new NullDiscardingHttpParams();
        params.setMapped('offset', offset, (r) => r.toString());
        params.setMapped('limit', limit, (r) => r.toString());

        return this.http.get<LayerCollectionDict>(this.config.API_URL + '/layers/collections', {
            params: params.httpParams,
            headers: BackendService.authorizationHeader(sessionId),
        });
    }

    getLayerCollectionLayer(sessionId: UUID, provider: UUID, layer: string): Observable<LayerDict> {
        // URI encode the layer id if it is a JSON string
        try {
            JSON.parse(layer);
            layer = encodeURIComponent(layer);
        } catch (e) {
            // do nothing
        }

        return this.http.get<LayerDict>(this.config.API_URL + `/layers/${provider}/${layer}`, {
            headers: BackendService.authorizationHeader(sessionId),
        });
    }

    public static authorizationHeader(sessionId: UUID): HttpHeaders {
        return new HttpHeaders().set('Authorization', `Bearer ${sessionId}`);
    }
}

/**
 * A wrapper around `HttpParams` that automatically discards operations with empty values.
 */
class NullDiscardingHttpParams {
    httpParams: HttpParams = new HttpParams();

    set(param: string, value: string | undefined): void {
        if (value === undefined || value === null) {
            return;
        }

        this.httpParams = this.httpParams.set(param, value);
    }

    setMapped<V>(param: string, value: V | undefined, transform: (v: V) => string): void {
        if (value === undefined || value === null) {
            return;
        }

        this.httpParams = this.httpParams.set(param, transform(value));
    }
}
