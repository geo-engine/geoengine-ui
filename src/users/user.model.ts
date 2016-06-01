import Config from '../app/config.model';

interface UserConfig {
    name: string;

    realName: string;
    email: string;
}

/**
 * This class represents a mapping user.
 */
export class User {
    name: string;

    realName: string;
    email: string;

    session: string;

    constructor(config: UserConfig) {
        this.name = config.name;
        this.realName = config.realName;
        this.email = config.email;
    }
}

export class Guest extends User {
    constructor() {
        super({
            name: Config.USER.GUEST.NAME,
            realName: 'Guest',
            email: 'guest@mapping',
        });
    }
}
