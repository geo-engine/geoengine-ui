interface UserConfig {
    id: number;
    name: string;

    firstName: string;
    lastName: string;
    email: string;

    passwordHash: string;
}

/**
 * This class represents a mapping user.
 */
export class User {
    id: number;
    name: string;

    firstName: string;
    lastName: string;
    email: string;

    passwordHash: string;

    constructor(config: UserConfig) {
        this.id = config.id;
        this.name = config.name;
        this.firstName = config.firstName;
        this.lastName = config.lastName;
        this.email = config.email;
        this.passwordHash = config.passwordHash;
    }

    /**
     * @returns true if the user is authenticated, false if he is a guest user.
     */
    isAuthenticated(): boolean {
        return this.passwordHash.length > 0;
    }
}

export class Guest extends User {
    constructor() {
        super({
            id: -1,
            name: "Guest",
            firstName: "",
            lastName: "",
            email: "",
            passwordHash: ""
        });
    }
}
