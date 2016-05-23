interface UserConfig {
    id: number;
    name: string;

    realName: string;
    email: string;

    passwordHash: string;
}

/**
 * This class represents a mapping user.
 */
export class User {
    id: number;
    name: string;

    realName: string;
    email: string;

    passwordHash: string;

    constructor(config: UserConfig) {
        this.id = config.id;
        this.name = config.name;
        this.realName = config.realName;
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
            name: 'Guest',
            realName: '',
            email: '',
            passwordHash: '',
        });
    }
}
