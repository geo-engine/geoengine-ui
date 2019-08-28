import {configureWaveTesting} from '../spec/wave-testing.configuration';
import {ServiceSpecHelper} from '../spec/service-spec.helper';
import {Config} from '../config.service';
import {inject, TestBed} from '@angular/core/testing';
import {HttpClientModule} from '@angular/common/http';
import {UserService} from './user.service';
import {HttpClientTestingModule, HttpTestingController, TestRequest} from '@angular/common/http/testing';
import {NotificationService} from '../notification.service';

describe('Service: User Service', () => {

    // configureWaveTesting(() => {
    //     TestBed.configureTestingModule({
    //         providers: [
    //             {provide: Config, useClass: MockConfig},
    //             UserService,
    //             {provide: NotificationService, useClass: MockNotificationService}
    //         ],
    //         imports: [
    //             HttpClientTestingModule
    //         ]
    //     });
    //     this.service = TestBed.get(UserService);
    //     this.http = TestBed.get(HttpTestingController);
    //     this.backend = new MockBackend(this.http, MockConfig.MOCK_URL);
    //
    //     this.http.match((req) => req.request === 'info').forEach(req => req.flush(req.session === '' ? {
    //         email: 'guest',
    //         externalid: '',
    //         realname: 'guest',
    //         result: true,
    //         username: 'guest'
    //     } : {
    //         email: 'test',
    //         externalid: '',
    //         realname: 'test',
    //         result: true,
    //         username: 'test'
    //     }));
    //     this.http.match((req) => req.request === 'login').forEach(req => req.flush(
    //         (req.username === MockConfig.MOCK_USER.GUEST.NAME && req.password === MockConfig.MOCK_USER.GUEST.PASSWORD) ?
    //         {result: true, session: ''} : {result: true, session: '0'})
    //     );
    //     // const isValidReq = this.http.match((req) => req.request === 'login' && req.sessionToken === '');
    //     // expect(isValidReq.length).toBe(1);
    //     // isValidReq.forEach(
    //     //     req => req.flush({result: false})
    //     // );
    //     // const guestLoginReq = this.http.match((req) => req.user === MockConfig.MOCK_USER.GUEST.NAME &&
    //     //     req.password === MockConfig.MOCK_USER.GUEST.PASSWORD
    //     // );
    //     // expect(guestLoginReq.length).toBe(1);
    //     // guestLoginReq.forEach(req => req.flush({result: true, session: ''}));
    // });

    // it('detects wrong credentials and sets session properly', () => {
    //     this.http.match((req) => req.body.includes('username=guest'))
    //         .forEach(req => req.flush({result: true, session: ''}));
    //     this.service.login({user: 'test', password: 'test'})
    //         .subscribe((login_response) => {
    //             expect(login_response).toBe(false);
    //
    //             expect(this.service.getSession().user).toBe(MockConfig.MOCK_USER.GUEST.NAME);
    //             expect(this.service.getSession().sessionToken).toBe('');
    //         }
    //     );
    //
    //     this.backend.testLogin();
    // });
    //
    // it('detects right credentials and sets session properly', () => {
    //     this.http.match((req) => req.body.includes('username=guest'))
    //         .forEach(req => req.flush({result: true, session: ''}));
    //     this.service.login({user: 'test', password: 'test_pw'})
    //         .subscribe((login_response) => {
    //                 expect(login_response).toBe(true);
    //
    //                 expect(this.service.getSession().user).toBe('test');
    //                 expect(this.service.getSession().sessionToken).toBe('mockSessionToken')
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
        // this.httpTestingController.match((req) => true).forEach(req => console.log(req));
        const request = this.httpTestingController.expectOne(this.URL);
        for (let login of this.logins) {
            if (request.request.body.includes('username=' + login.user + '&')
                && request.request.body.includes('password=' + login.password + '&')) {
                request.flush({result: true, session: 'mockSessionToken'});
                return;
            }
        }
        request.flush({result: 'UserDB: username or password wrong'});
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
