declare module 'node-notifier' {
  interface NotificationOptions {
    title?: string;
    message?: string;
    sound?: string | boolean;
    wait?: boolean;
    timeout?: number | false;
    subtitle?: string;
    appIcon?: string;
    contentImage?: string;
    open?: string;
  }

  interface NotificationCallback {
    (err: Error | null, response?: any): void;
  }

  interface Notifier {
    notify(options: NotificationOptions, callback?: NotificationCallback): void;
  }

  const notifier: Notifier;
  export = notifier;
}