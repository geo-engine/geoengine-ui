import {Injectable} from '@angular/core';
import {TypedResultDescriptor, Workflow, WorkflowsApi} from '@geoengine/openapi-client';
import {ReplaySubject, firstValueFrom} from 'rxjs';
import {SessionService, apiConfigurationWithAccessKey} from '../session/session.service';

@Injectable({
    providedIn: 'root',
})
export class WorkflowsService {
    workflowApi = new ReplaySubject<WorkflowsApi>(1);

    constructor(private sessionService: SessionService) {
        this.sessionService.getSessionStream().subscribe({
            next: (session) => this.workflowApi.next(new WorkflowsApi(apiConfigurationWithAccessKey(session.id))),
        });
    }

    async getWorkflow(id: string): Promise<Workflow> {
        const workflowApi = await firstValueFrom(this.workflowApi);

        return workflowApi.loadWorkflowHandler({
            id,
        });
    }

    async getMetadata(id: string): Promise<TypedResultDescriptor> {
        const workflowApi = await firstValueFrom(this.workflowApi);

        return workflowApi.getWorkflowMetadataHandler({
            id,
        });
    }

    async registerWorkflow(workflow: Workflow): Promise<string> {
        const workflowApi = await firstValueFrom(this.workflowApi);

        return workflowApi
            .registerWorkflowHandler({
                workflow,
            })
            .then((response) => response.id);
    }
}
