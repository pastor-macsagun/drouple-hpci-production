export * from './rbac';
export declare function decodeJwt(token: string): any;
export declare function isTokenExpired(token: string): boolean;
export declare function getTokenTimeLeft(token: string): number;
export declare const TOKEN_REFRESH_THRESHOLD = 300;
export declare function shouldRefreshToken(token: string): boolean;
