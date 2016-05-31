export default {
    MAPPING_URL: '/cgi-bin/mapping',
    WMS: {
        VERSION: '1.3.0',
        FORMAT: 'image/png',
    },
    WFS: {
        VERSION: '2.0.0',
        FORMAT: 'application/json',
    },
    DEBUG_MODE: true,
    USER: {
        DEFAULT: {
            NAME: 'guest',
            PASSWORD: 'guest',
        },
    },
};
