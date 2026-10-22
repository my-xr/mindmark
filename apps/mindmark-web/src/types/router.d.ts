import 'vue-router';

import type { RoleCode, PortalCode } from './user';

declare module 'vue-router' {
  interface RouteMeta {
    title: string;
    portal: PortalCode;
    requiresAuth?: boolean;
    roles?: RoleCode[];
    menuKey?: string;
  }
}
