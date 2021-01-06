import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Config} from '../config.service';
import {
    CreateProjectResponseDict, LayerDict, ProjectDict, ProjectFilterDict,
    ProjectListingDict, ProjectOrderByDict, ProjectPermissionDict,
    RegistrationDict,
    SessionDict, STRectangleDict,
    UUID
} from './backend.model';

@Injectable({
    providedIn: 'root'
})
export class BackendService {

    constructor(protected readonly http: HttpClient,
                protected readonly config: Config) {
    }

    registerUser(request: {
        email: string,
        password: string,
        real_name: string,
    }): Observable<RegistrationDict> {
        return this.http.post<RegistrationDict>(this.config.API_URL + '/user', request);
    }

    loginUser(request: {
        email: string,
        password: string,
    }): Observable<SessionDict> {
        return this.http.post<SessionDict>(this.config.API_URL + '/login', request);
    }

    getSession(sessionId: UUID): Observable<SessionDict> {
        return this.http.get<SessionDict>(this.config.API_URL + '/session', {
            headers: new HttpHeaders()
                .set('Authorization', `Bearer ${sessionId}`)
        });
    }

    logoutUser(sessionId: UUID): Observable<{}> {
        return this.http.post<{}>(this.config.API_URL + '/logout', null, {
            headers: new HttpHeaders()
                .set('Authorization', `Bearer ${sessionId}`)
        });
    }

    createAnonymousUserSession(): Observable<SessionDict> {
        return this.http.post<SessionDict>(this.config.API_URL + '/anonymous', null);
    }

    createProject(
        request: {
            request: {
                name: string,
                description: string,
                bounds: STRectangleDict,
            }
        },
        sessionId: UUID): Observable<CreateProjectResponseDict> {
        return this.http.post<CreateProjectResponseDict>(this.config.API_URL + '/project', request, {
            headers: BackendService.authorizationHeader(sessionId),
        });
    }

    updateProject(
        request: {
            id: UUID,
            name?: string,
            description?: string,
            layers?: Array<LayerDict>,
            bounds?: STRectangleDict,
        },
        sessionId: UUID): Observable<{}> {
        return this.http.patch<{}>(`${this.config.API_URL}/project/${request.id}`, request, {
            headers: BackendService.authorizationHeader(sessionId),
        });
    }

    deleteProject(projectId: UUID, sessionId: UUID): Observable<{}> {
        return this.http.get<ProjectDict>(`${this.config.API_URL}/project/${projectId}`, {
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
            permissions: Array<ProjectPermissionDict>,
            filter: ProjectFilterDict,
            order: ProjectOrderByDict,
            offset: number,
            limit: number
        },
        sessionId: UUID): Observable<Array<ProjectListingDict>> {
        return this.http.request<Array<ProjectListingDict>>('get', this.config.API_URL + '/project', {
            body: request,
            headers: BackendService.authorizationHeader(sessionId),
        });
    }

    private static authorizationHeader(sessionId: UUID): HttpHeaders {
        return new HttpHeaders()
            .set('Authorization', `Bearer ${sessionId}`);
    }
}
