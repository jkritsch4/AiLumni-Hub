/// <reference types="vite/client" />

// Declare module for Vue components and shims
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface ImportMetaEnv {
  // see https://vitejs.dev/guide/env-and-mode.html#env-files
  readonly VITE_API_URL: string
  readonly VITE_APP_TITLE: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Global type augmentation for AWS Amplify
declare module 'aws-amplify' {
  interface API {
    get(apiName: string, path: string, init?: {}): Promise<any>
    post(apiName: string, path: string, init?: {}): Promise<any>
    put(apiName: string, path: string, init?: {}): Promise<any>
    del(apiName: string, path: string, init?: {}): Promise<any>
  }
}
