import {Injectable} from "angular2/core";
import {BehaviorSubject, Observable} from "rxjs/Rx";

import {User, Guest} from "../models/user.model";

/**
 * A service that is responsible for retrieving user information and modifying the current user.
 */
@Injectable()
export class UserService {
    private user$: BehaviorSubject<User>;

    constructor() {
        this.user$ = new BehaviorSubject(new Guest());
    }

    /**
     * @returns Retrieve the current user.
     */
    getUser() {
        return this.user$.getValue();
    }

    /**
     * @returns Retrieve a stream that notifies about the current user.
     */
    getUserStream() {
        return this.user$;
    }

    /**
     * Login using user credentials. If it was successful, set a new user.
     * @param credentials.user The user name.
     * @param credentials.password The user's password.
     * @returns `true` if the login was succesful, `false` otherwise.
     */
    login(credentials: {user: string, password: string}): boolean {
        // TODO: implement
        throw "Login not yet implemented!";
    }

    /**
     * Change the details of the current user.
     * @param details.firstName The first name
     * @param details.lastName  The last name
     * @param details.email     The E-Mail address
     */
    changeDetails(details: {firstName: string, lastName: string, email: string}) {
        let user = this.getUser();
        user.firstName = details.firstName;
        user.lastName = details.lastName;
        user.email = details.email;

        this.user$.next(user);
    }

}
