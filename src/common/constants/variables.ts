
/** Cookie name used for the refresh token */
export const REFRESH_COOKIE = 'refresh_token';

/** Price Of a Conversation Per US Dollar */
export const CONVERSATION_COST = 2    // 2$

/** Base URL for the currency converter API */
export const CURRENCY_CONVERTER_API = 'https://api.frankfurter.app';

/** Base URL for the OpenRouteService API */
export const OPEN_ROUTE_SERVICE_API = 'https://api.openrouteservice.org';

/** Logistics estimation constants */
export const LOGISTICS_BASE_COST_USD = 50; // Fixed handling / baseline fee in USD
export const LOGISTICS_COST_PER_KM_USD = 0.45; // Cost per km in USD
export const LOGISTICS_KM_PER_DAY = 600; // Average km covered per transit day
export const LOGISTICS_BASE_DAYS = 2; // Baseline customs clearance and processing days

/** Notifications constants */
export const EMAIL_PROVIDER = 'EMAIL_PROVIDER';
export const SMS_PROVIDER = 'SMS_PROVIDER';

export const EMAIL_QUEUE_NAME = 'notifications-email';
export const SMS_QUEUE_NAME = 'notifications-sms';

