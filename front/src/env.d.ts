// Define the type of the environment variables.
declare interface Env {
  readonly NODE_ENV: string
  // Replace the following with your own environment variables.
  // Example: NGX_VERSION: string;
  NG_APP_SERVER_URL: string
  NG_APP_VERSION: string
  NG_APP_MATOMO: null | number
  NG_APP_MATOMO_TM: null | string
  NG_APP_FORCE_SSL: boolean
  NG_APP_SUPPORT_EMAIL: string
  NG_APP_MAPBOX_TOKEN: string
  NG_APP_MAPBOX_STYLE: string
  NG_APP_GITBOOK_TOKEN: string
  NG_APP_GITBOOK_ID: string
  NG_APP_GITBOOK_ORG_ID: string
  NG_APP_ENABLE_SSO: boolean
  NG_APP_CRISP: string
  NG_APP_NODE_ENV: string
  [key: string]: any
}

// Choose how to access the environment variables.
// Remove the unused options.

// 1. Use import.meta.env.YOUR_ENV_VAR in your code. (conventional)
declare interface ImportMeta {
  readonly env: Env
}

// 2. Use _NGX_ENV_.YOUR_ENV_VAR in your code. (customizable)
// You can modify the name of the variable in angular.json.
// ngxEnv: {
//  define: '_NGX_ENV_',
// }
declare const _NGX_ENV_: Env

// 3. Use process.env.YOUR_ENV_VAR in your code. (deprecated)
declare namespace NodeJS {
  export interface ProcessEnv extends Env {}
}
