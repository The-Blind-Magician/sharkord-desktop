type SharkordFrameGuard = (url: string) => boolean;

type SharkordSecurity = {
  isSharkordFrame: SharkordFrameGuard;
  assertSharkordFrame: (url: string) => void;
};

const createSharkordSecurity = (sharkordOrigin: string): SharkordSecurity => {
  const isSharkordFrame: SharkordFrameGuard = (url: string) => {
    try {
      return new URL(url).origin === sharkordOrigin;
    } catch {
      return false;
    }
  };

  const assertSharkordFrame = (url: string) => {
    if (!isSharkordFrame(url)) {
      throw new Error('This desktop API is only available to Sharkord.');
    }
  };

  return { isSharkordFrame, assertSharkordFrame };
};

export { createSharkordSecurity };
export type { SharkordFrameGuard };
