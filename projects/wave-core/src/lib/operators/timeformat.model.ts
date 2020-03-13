class TimeFormatCollection {
    ALL_FORMATS: Array<{display: string, value: string}>;

    constructor() {
        this.ALL_FORMATS = [
            {display: 'yyyy-MM-ddTHH:mm:ssZ', value: '%Y-%m-%dT%H:%M:%SZ'},
            {display: 'yyyy-MM-ddTHH:mmZ', value: '%Y-%m-%dT%H:%MZ'},
            {display: 'dd-MM-yyyy HH:mm:ss', value: '%d-%m-%Y %H:%M:%S'},
            {display: 'dd.MM.yyyy HH:mm:ss', value: '%d.%m.%Y %H:%M:%S'},
            {display: 'yyyy-MM-dd HH:mm:ssZ', value: '%Y-%m-%d %H:%M:%SZ'},
            {display: 'yyyy-MM-dd HH:mmZ', value: '%Y-%m-%d %H:%MZ'},
            {display: 'dd.MM.yyyy', value: '%d.%m.%Y'},
            {display: 'yyyy-MM-dd', value: '%Y-%m-%d'},
        ];
    }
}

export const TimeFormats = new TimeFormatCollection();
