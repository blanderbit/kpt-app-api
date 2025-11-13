import { NavigationGuard, RouteRecordRaw } from 'vue-router';
type Resolver = NavigationGuard

export class ResolverStore {
  private resolvers: Record<string, Resolver> = {};
  public registerResolverByComponentName(name: string, resovler: Resolver) {
    this.resolvers[name] = resovler;
  }

  public getResolverByComponentName(name): Resolver {
    return this.resolvers[name];
  }

  public searchRouterForAttachResolverByName(routes: RouteRecordRaw[]): RouteRecordRaw[] {
    routes.map((route: RouteRecordRaw): RouteRecordRaw => {
      route = this._attachResolverToRoute(route);
      if(route.children && route.children.length) {
        route.children = this.searchRouterForAttachResolverByName.call(this, route.children);
      }
      return route;
    });

    return routes;
  }

  private _attachResolverToRoute(route: RouteRecordRaw): RouteRecordRaw {
    const name = route?.name;
    const beforeEnter = this.getResolverByComponentName(name);
    if(name && beforeEnter) {
      route.beforeEnter = beforeEnter;
    }
    return route;
  }
}