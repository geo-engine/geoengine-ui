/**
 * This class represents a geo engine user.
 */
import {STRectangleDict, UUID} from '../backend/backend.model';
import {Moment} from 'moment';

export class User {
    id: string;

    realName?: string;
    email?: string;

    session: string;

    isGuest: boolean;

    constructor(config: {
        id: string;
        realName?: string;
        email?: string;
    }) {
        this.id = config.id;
        this.realName = config.realName;
        this.email = config.email;

        this.isGuest = !config.email || !config.realName;
    }
}

export interface Session {
    sessionToken: string;
    user: User;
    validUntil: Moment; // TODO: custom time point?
    lastProjectId?: UUID;
    lastView?: STRectangleDict;
}
