import {ActivatedRouteSnapshot, RouterStateSnapshot} from '@angular/router';
import {Observable, of} from 'rxjs';
import {UserService} from '../../users/user.service';

import {IsLoggedInGuard} from './is-logged-in.guard';

describe('IsLoggedInGuard', () => {
    let userServiceSpy: {isLoggedIn: jasmine.Spy};

    let guard: IsLoggedInGuard;

    beforeEach(() => {
        userServiceSpy = jasmine.createSpyObj('UserService', ['isLoggedIn']);

        guard = new IsLoggedInGuard(userServiceSpy as any as UserService);
    });

    it('should work if logged in', (done) => {
        userServiceSpy.isLoggedIn.and.returnValue(of<boolean>(true));

        const activateFn = guard.canActivate(undefined as unknown as ActivatedRouteSnapshot, undefined as unknown as RouterStateSnapshot);

        if (!(activateFn instanceof Observable)) {
            fail('Wrong type');
            return;
        }

        activateFn.subscribe(
            (result) => {
                expect(result).toBe(true);
            },
            (error) => fail(error),
            () => {
                done();
            },
        );
    });

    it('should prevent access when not logged in', (done) => {
        userServiceSpy.isLoggedIn.and.returnValue(of<boolean>(false));

        const activateFn = guard.canActivate(undefined as unknown as ActivatedRouteSnapshot, undefined as unknown as RouterStateSnapshot);

        if (!(activateFn instanceof Observable)) {
            fail('Wrong type');
            return;
        }

        activateFn.subscribe(
            (result) => {
                expect(result).toBe(false);
            },
            (error) => fail(error),
            () => {
                done();
            },
        );
    });
});
