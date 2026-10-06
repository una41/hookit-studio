import { AsyncLocalStorage } from 'node:async_hooks';
export const context = new AsyncLocalStorage();
export function settings() {
  const value = context.getStore();
  if (!value) throw Error('Request context missing');
  return value;
}
export function defineSecret(name) {
  return {
    value() {
      const value = settings()[name];
      if (!value) throw Error('Missing server secret: ' + name);
      return value;
    },
  };
}
