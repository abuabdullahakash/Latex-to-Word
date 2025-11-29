
/**
 * Perspective Warping Utilities
 * Implements a 4-point Homography transformation to flatten document images.
 */

export interface Point {
  x: number;
  y: number;
}

// Calculate the Euclidean distance between two points
const dist = (p1: Point, p2: Point) => Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));

// Calculate the center of the image to default handles
export const getDefaultCorners = (width: number, height: number): Point[] => {
  const padX = width * 0.2;
  const padY = height * 0.2;
  return [
    { x: padX, y: padY }, // TL
    { x: width - padX, y: padY }, // TR
    { x: width - padX, y: height - padY }, // BR
    { x: padX, y: height - padY }, // BL
  ];
};

// Gaussian elimination to solve linear system Ax = B
const solveMatrix = (A: number[][], B: number[]): number[] => {
    const n = A.length;
    for (let i = 0; i < n; i++) {
        let maxEl = Math.abs(A[i][i]);
        let maxRow = i;
        for (let k = i + 1; k < n; k++) {
            if (Math.abs(A[k][i]) > maxEl) {
                maxEl = Math.abs(A[k][i]);
                maxRow = k;
            }
        }

        for (let k = i; k < n; k++) {
            const tmp = A[maxRow][k];
            A[maxRow][k] = A[i][k];
            A[i][k] = tmp;
        }
        const tmp = B[maxRow];
        B[maxRow] = B[i];
        B[i] = tmp;

        for (let k = i + 1; k < n; k++) {
            const c = -A[k][i] / A[i][i];
            for (let j = i; j < n; j++) {
                if (i === j) {
                    A[k][j] = 0;
                } else {
                    A[k][j] += c * A[i][j];
                }
            }
            B[k] += c * B[i];
        }
    }

    const x = new Array(n).fill(0);
    for (let i = n - 1; i > -1; i--) {
        let sum = 0;
        for (let j = i + 1; j < n; j++) {
            sum += A[i][j] * x[j];
        }
        x[i] = (B[i] - sum) / A[i][i];
    }
    return x;
}

/**
 * Applies perspective warp to an image based on 4 source points.
 * Calculates correct destination aspect ratio based on edge lengths.
 */
export const warpPerspective = async (
  imageSrc: string,
  srcPoints: Point[]
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      // 1. Calculate the Correct Dimensions (CamScanner Logic)
      const widthTop = dist(srcPoints[0], srcPoints[1]);
      const widthBottom = dist(srcPoints[3], srcPoints[2]);
      const maxWidth = Math.round(Math.max(widthTop, widthBottom));

      const heightLeft = dist(srcPoints[0], srcPoints[3]);
      const heightRight = dist(srcPoints[1], srcPoints[2]);
      const maxHeight = Math.round(Math.max(heightLeft, heightRight));

      // 2. Create Destination Canvas
      const canvas = document.createElement('canvas');
      canvas.width = maxWidth;
      canvas.height = maxHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject("No context");

      // 3. Compute Homography Matrix H mapping Dest -> Source
      const dstPoints = [
          { x: 0, y: 0 },
          { x: maxWidth, y: 0 },
          { x: maxWidth, y: maxHeight },
          { x: 0, y: maxHeight }
      ];

      const A: number[][] = [];
      const B: number[] = [];

      for(let i=0; i<4; i++) {
          const sx = srcPoints[i].x;
          const sy = srcPoints[i].y;
          const dx = dstPoints[i].x;
          const dy = dstPoints[i].y;

          A.push([dx, dy, 1, 0, 0, 0, -dx*sx, -dy*sx]);
          A.push([0, 0, 0, dx, dy, 1, -dx*sy, -dy*sy]);
          B.push(sx);
          B.push(sy);
      }

      const H = solveMatrix(A, B);

      // 4. Pixel Mapping (Inverse: Iterate Dest -> Sample Source)
      const imgData = ctx.createImageData(maxWidth, maxHeight);
      const data = imgData.data;

      // Draw source to temp canvas
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      const tempCtx = tempCanvas.getContext('2d');
      if(!tempCtx) return reject("No temp context");
      tempCtx.drawImage(img, 0, 0);
      const srcData = tempCtx.getImageData(0, 0, img.width, img.height).data;
      const srcW = img.width;
      const srcH = img.height;

      // Initialize with White (255)
      for (let i = 0; i < data.length; i += 4) {
          data[i] = 255; data[i + 1] = 255; data[i + 2] = 255; data[i + 3] = 255;
      }

      for (let y = 0; y < maxHeight; y++) {
          for (let x = 0; x < maxWidth; x++) {
              const denom = H[6]*x + H[7]*y + 1;
              const u = (H[0]*x + H[1]*y + H[2]) / denom;
              const v = (H[3]*x + H[4]*y + H[5]) / denom;

              const srcX = Math.round(u);
              const srcY = Math.round(v);

              if (srcX >= 0 && srcX < srcW && srcY >= 0 && srcY < srcH) {
                  const dstIdx = (y * maxWidth + x) * 4;
                  const srcIdx = (srcY * srcW + srcX) * 4;
                  
                  data[dstIdx] = srcData[srcIdx];
                  data[dstIdx+1] = srcData[srcIdx+1];
                  data[dstIdx+2] = srcData[srcIdx+2];
                  data[dstIdx+3] = srcData[srcIdx+3];
              }
          }
      }

      ctx.putImageData(imgData, 0, 0);
      resolve(canvas.toDataURL("image/jpeg", 0.95));
    };
    img.onerror = reject;
    img.src = imageSrc;
  });
};

export const resizeImage = async (base64: string, width: number, height: number): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.95));
        };
        img.src = base64;
    });
};
