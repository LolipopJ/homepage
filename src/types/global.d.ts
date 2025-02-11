declare global {
  interface Window {
    /**
     * Gitalk is a modern comment component based on GitHub Issue and Preact.
     * @link https://github.com/gitalk/gitalk
     */
    Gitalk?: Gitalk.default.Constructor;
  }
}

export {};
