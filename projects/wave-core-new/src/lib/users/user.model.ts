/**
 * This class represents a geo engine user.
 */
export class User {
    id: string;

    realName?: string;
    email?: string;

    session: string;

    isGuest: boolean;

    constructor(config: {id: string; realName?: string; email?: string}) {
        this.id = config.id;
        this.realName = config.realName;
        this.email = config.email;

        this.isGuest = !config.email || !config.realName;
    }
}
