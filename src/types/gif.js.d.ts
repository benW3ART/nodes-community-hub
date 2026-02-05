declare module 'gif.js' {
  interface GIFOptions {
    workers?: number;
    quality?: number;
    width?: number;
    height?: number;
    workerScript?: string;
    repeat?: number; // 0 = loop forever, -1 = no repeat, n = repeat n times
    background?: string;
    transparent?: string | null;
    dither?: boolean | string;
  }

  interface AddFrameOptions {
    delay?: number;
    copy?: boolean;
    dispose?: number;
  }

  class GIF {
    constructor(options?: GIFOptions);
    addFrame(
      image: CanvasRenderingContext2D | CanvasImageSource | ImageData,
      options?: AddFrameOptions
    ): void;
    on(event: 'finished', callback: (blob: Blob) => void): void;
    on(event: 'progress', callback: (progress: number) => void): void;
    on(event: 'start' | 'abort', callback: () => void): void;
    render(): void;
    abort(): void;
  }

  export default GIF;
}
