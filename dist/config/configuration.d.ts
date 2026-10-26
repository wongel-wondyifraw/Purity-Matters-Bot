declare const _default: () => {
    port: string | number;
    nodeEnv: string;
    telegram: {
        token: string;
        mode: string;
        webhookDomain: string;
        webhookPath: string;
        webhookSecret: string;
    };
    database: {
        host: string;
        port: number;
        username: string;
        password: string;
        database: string;
        synchronize: boolean;
        logging: boolean;
        ssl: boolean | {
            rejectUnauthorized: boolean;
        };
    };
    jwt: {
        secret: string;
        expiresIn: string;
    };
    defaultAdmin: {
        email: string;
        password: string;
        firstName: string;
        middleName: string;
        lastName: string;
        role: string;
    };
};
export default _default;
