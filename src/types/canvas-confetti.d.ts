declare module 'canvas-confetti' {
  export interface Options {
    particleCount?: number;
    angle?: number;
    spread?: number;
    startVelocity?: number;
    decay?: number;
    gravity?: number;
    drift?: number;
    ticks?: number;
    origin?: {
      x?: number;
      y?: number;
    };
    colors?: string[];
    shapes?: string[];
    scalar?: number;
    zIndex?: number;
    disableForReducedMotion?: boolean;
  }

  export interface GlobalOptions {
    resize?: boolean;
    useWorker?: boolean;
  }

  function confetti(options?: Options): Promise<null>;
  
  namespace confetti {
    function reset(): void;
    function create(canvas: HTMLCanvasElement | null, options?: GlobalOptions): (options?: Options) => Promise<null>;
  }

  export default confetti;
}
