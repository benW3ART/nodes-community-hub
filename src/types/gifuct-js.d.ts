declare module 'gifuct-js' {
  interface GIFFrame {
    dims: {
      width: number;
      height: number;
      top: number;
      left: number;
    };
    patch: ArrayBuffer;
    delay: number;
    disposalType: number;
    transparentIndex?: number;
  }

  interface ParsedGIF {
    lsd: {
      width: number;
      height: number;
    };
    frames: GIFFrame[];
  }

  export function parseGIF(buffer: ArrayBuffer): ParsedGIF;
  export function decompressFrames(gif: ParsedGIF, buildImagePatches: boolean): GIFFrame[];
}
