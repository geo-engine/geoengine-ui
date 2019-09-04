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
        this.http = TestBed.get(HttpTestingController);
        this.backend = new MockBackend(this.http, MockConfig.MOCK_URL);


        // Answer default guest logins with empty sessionToken.
        this.http.match((req) => req.body.includes('request=login&')).forEach(req =>
            req.flush({
                result: true,
                session: ''
            })
        );

        // Answer the info requests with the default guest setup.
        this.http.match((req) => req.body.includes('request=info&')).forEach(req =>
            req.flush({
                email: 'guest',
                externalid: '',
                realname: 'guest',
                result: true,
                username: 'guest'
            })
        );

        this.http.match((req) => req.body.includes('request=sourcelist&')).forEach(req =>
            req.flush({
                result: true,
                sourcelist: []
            })
        );

        expect(this.http.match(req => true).length).toBe(0);
    });

    it('detects wrong credentials and sets session accordingly', () => {
        let completed = null;
        this.service.login({user: 'test', password: 'test'})
            .subscribe((login_response) => {
                expect(login_response).toBe(false);

                expect(this.service.getSession().user).toBe(MockConfig.MOCK_USER.GUEST.NAME);
                expect(this.service.getSession().sessionToken).toBe('');
            },
                (error) => {},
                () => {
                    completed = true;
                }
        );

        this.backend.testLogin();
        this.http.verify();
        expect(this.service.getSession()).toEqual({
            user: 'guest',
            sessionToken: '',
            staySignedIn: true,
            isExternallyConnected: false
        });
        expect(completed).toBeTruthy();
    });

    it('detects right credentials and sets session accordingly', () => {
        let completed = null;
        this.service.login({user: 'test', password: 'test_pw'})
            .subscribe((login_response) => {
                    expect(login_response).toBe(true);

                    expect(this.service.getSession().user).toBe('test');
                    expect(this.service.getSession().sessionToken).toBe('mockSessionToken')
                },
                (error) => {},
                () => {
                    completed = true;
                }
            );

        this.backend.testLogin();
        this.http.verify();
        expect(this.service.getSession()).toEqual({
            user: 'test',
            sessionToken: 'mockSessionToken',
            staySignedIn: true,
            isExternallyConnected: false
        });
        expect(completed).toBeTruthy();
    });
});

class MockBackend {

    logins = [
        {user: 'test', email: 'test_mail', realname: 'test_name test_after', password: 'test_pw', sources: []}
    ];

    constructor(private httpTestingController: HttpTestingController, private URL: string) {
        let reqs = this.httpTestingController.match(() => true);
        for (let i = 0; i < reqs.length; i++) {
            reqs[i].flush(reqs[i].request.body);
        }
    }

    public testLogin() {
        const request = this.httpTestingController.expectOne(this.URL);
        for (let login of this.logins) {
            if (request.request.body.includes('username=' + login.user + '&')
                && request.request.body.includes('password=' + login.password + '&')) {
                request.flush({result: true, session: 'mockSessionToken'});
                // SessionToken now changed from '' to 'mockSessionToken'; session$ got changed and so rastersources expect an http result.
                this.httpTestingController.match((req) => req.body.includes('request=sourcelist&'))
                    .forEach(req => {
                            expect(req.request.body.includes('sessiontoken=mockSessionToken')).toBeTruthy();
                            req.flush({
                                result: true,
                                sourcelist: login.sources
                            });
                        }
                    );
                this.httpTestingController.match((req) => req.body.includes('request=info&'))
                    .forEach(req => {
                        expect(req.request.body.includes('sessiontoken=mockSessionToken')).toBeTruthy();
                        req.flush({
                            email: login.email,
                            externalid: '',
                            realname: login.realname,
                            result: true,
                            username: login.user
                        });
                    });
                // flush all the others with their own request
                this.httpTestingController.match((req) => true)
                    .forEach(req => req.flush(req.request.body));
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
