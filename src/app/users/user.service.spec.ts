import {configureWaveTesting} from '../spec/wave-testing.configuration';
import {ServiceSpecHelper} from '../spec/service-spec.helper';
import {Config} from '../config.service';
import {inject, TestBed} from '@angular/core/testing';
import {HttpClientModule} from '@angular/common/http';
import {UserService} from './user.service';
import {HttpClientTestingModule, HttpTestingController, TestRequest} from '@angular/common/http/testing';
import {NotificationService} from '../notification.service';

describe('Service: User Service', () => {

    configureWaveTesting(() => {
        TestBed.configureTestingModule({
            providers: [
                {provide: Config, useClass: MockConfig},
                UserService,
                {provide: NotificationService, useClass: MockNotificationService}
            ],
            imports: [
                HttpClientTestingModule
            ]
        });
        this.service = TestBed.get(UserService);
        this.backend = new MockBackend(TestBed.get(HttpTestingController), MockConfig.MOCK_URL);
    });

    // it('detects wrong credentials and behaves properly', () => {
    //     this.service.login({user: 'test', password: 'test'})
    //         .subscribe((login_response) => {
    //             expect(login_response).toBe({result: 'UserDB: username or password wrong'})
    //
    //             expect(this.service.getSession()).toBe({
    //                 user: MockConfig.MOCK_USER.GUEST.NAME,
    //                 sessionToken: ''
    //             });
    //         }
    //     );
    //
    //     this.backend.testLogin();
    // });
    //
    // it('detects right credentials and behaves properly', () => {
    //     this.service.login({user: 'test', password: 'test_pw'})
    //         .subscribe((login_response) => {
    //                 expect(login_response).toBe({result: true, session: 'mockSessionToken'})
    //
    //                 expect(this.service.getSession()).toBe({
    //                     user: 'test',
    //                     sessionToken: 'mockSessionToken'
    //                 });
    //             }
    //         );
    //
    //     this.backend.testLogin();
    // });
});

class MockBackend {

    logins = [
        {user: 'test', password: 'test_pw'}
    ];

    constructor(private httpTestingController: HttpTestingController, private URL: string) {
        let reqs = this.httpTestingController.match(() => true);
        for (let i = 0; i < reqs.length; i++) {
            reqs[i].flush(reqs[i].request.body);
        }
    }

    public testLogin() {
        const request = this.httpTestingController.expectOne(this.URL);
        if (this.logins.indexOf(request.request.body as {user: string, password: string}) >= 0) {
            request.flush({result: true, session: 'mockSessionToken'});
        } else {
            request.flush({result: 'UserDB: username or password wrong'});
        }
    }
}

class MockConfig {

    static MOCK_URL = 'localhost:8089/mapping-mock';
    static MOCK_USER = {
        GUEST: {
            NAME: 'guest',
            PASSWORD: 'guest',
        }
    };

    get MAPPING_URL(): string {
        return MockConfig.MOCK_URL;
    }

    get USER(): { GUEST: { NAME: string, PASSWORD: string} } {
        return MockConfig.MOCK_USER;
    }
}

class MockNotificationService {
    info(message: string) {}
    error(message: string) {}
}
