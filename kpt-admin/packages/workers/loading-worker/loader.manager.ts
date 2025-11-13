import { ComponentInternalInstance } from "vue";

import Loader from "./Loader.vue";

// noinspection JSAnnotator
export type LoaderInstance = InstanceType<typeof Loader>;

export class LoaderManager {
  private loaders: Record<string, LoaderInstance> = {};

  private getLoaderByName(name: string): LoaderInstance {
    if (!this.loaders[name]) {
      throw new Error(`[LoaderManager]: can't find instance ${name}`);
    }
    return this.loaders[name];
  }

  public registerLoaderInstance(
    name: string,
    instance: ComponentInternalInstance
  ): void {
    if (this.loaders[name]) {
      return
      throw new Error(`[LoaderManager]: instance ${name} already exist`);
    }
    this.loaders[name] = instance;
  }

  public unRegisterLoaderInstance(name: string): void {
    if (this.loaders[name]) {
      delete this.loaders[name];
    }
  }

  public startSpinnerByName(name: string): void {
    const loader = this.getLoaderByName(name);
    if (!loader) return;
    loader.vnode.el.parentNode.style.positionOld =
      loader.vnode.el.parentNode.style.position;
    loader.vnode.el.parentNode.style.position = "relative";
    loader.props.isLoading = true;
  }

  public finishSpinnerByName(name: string): void {
    const loader = this.getLoaderByName(name);
    if (!loader) return;
    loader.vnode.el.parentNode.style.position =
      loader.vnode.el.parentNode.style.positionOld;
    delete loader.vnode.el.parentNode.style.positionOld;
    loader.props.isLoading = false;
  }
}
