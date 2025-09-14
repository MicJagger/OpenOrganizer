export {};

declare global {
  interface Window {
    electronAPI: {
      sqliteRead: (key: string) => Promise<string>;
      sqliteCreate: (key: string, value: string) => Promise<boolean>;
      sqliteUpdate: (key: string, value: string) => Promise<boolean>;
      sqliteDelete: (key: string) => Promise<boolean>;
    };
  }
}
