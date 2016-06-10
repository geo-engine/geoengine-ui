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
    DEVELOPER_MODE: true,
    MAPPING_DEBUG_MODE: false,
    USER: {
        GUEST: {
            NAME: 'guest',
            PASSWORD: 'guest',
        },
    },
};
