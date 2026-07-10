export interface JwtPayload {
  sub: string;   // user id
  name: string;  // user name
  jti?: string;  // refresh_tokens.id — only present on refresh tokens
}
