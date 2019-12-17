import {NgModule, Optional, SchemaMetadata, Type} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {ResponseOptions, XHRBackend, Response} from '@angular/http';
import {MockBackend} from '@angular/http/testing';

@NgModule({
    providers: [
        {provide: XHRBackend, useClass: MockBackend}
    ]
})
class HttpMockModule {}

export interface Mock {
    module: any;
}

const mockModules: { [key: string]: Mock } = {
    'http': {module: HttpMockModule}
};


export class ServiceSpecHelper<T> {

    type: Type<T>;

    constructor(_app_module: {
        providers?: any[];
        declarations?: any[];
        imports?: any[];
        schemas?: Array<SchemaMetadata | any[]>;
        aotSummaries?: () => any[];
    }, type: Type<T>, mocks: string[]) {
        this.type = type;

        @NgModule({
            providers: [
                type
            ]
        })
        class EntryModule {}
        _app_module.imports.push(EntryModule);

        for (const mock of mocks) {
            _app_module.imports.push(mockModules[mock].module);
        }

        TestBed.configureTestingModule(_app_module).compileComponents();
    }

    /** Use the inject functionality in @angular/core/testing to get the XHRBackend injection.
     * If you chose to mock http this is an instance of type MockBackend.
     * The given data is then chosen to be the response of http requests for this module.
     *
     * @param {MockBackend} mockBackend: The injected instance of MockBackend.
     * @param {any} mockedResponse: The response that should be given.
     */
    httpResponseMock(mockedResponse: any) {
        TestBed.get(XHRBackend).connections.subscribe((connection) => {
            connection.mockRespond(new Response(new ResponseOptions({
                body: JSON.stringify(mockedResponse)
            })));
        });
    }

    getService(): T {
        return TestBed.get(this.type);
    }
}

/** LAYOUT ON HOW TO USE THIS:
 * Assume we want to test TestedService, a service that uses http. The tested-service.spec.ts would look like this:
 *
 * let helper: ServiceFixtureHelper;
 * let service: TestedService;
 * let mockedData: any; // The response of backend when using http.
 *
 * beforeEach(() => {
 *    helper = new HTTPServiceFixtureHelper({
 *        providers: [...], // whatever is needed for TestedService to run.
 *        imports: [...],
 *        ...
 *    }, TestedService, 'http');
 *    service = helper.getService();
 *    helper.httpResponseMock(mockedData);
 * });
 *
 * it("...", () => {
 *    teste service mit http funktionalität hier; die Response ist das oben angegebene mockedData
 *
 *    helper.httpResponseMock(otherMockedData);
 *
 *    hier kann man dann mit der anderen data testen.
 * });
 */
