const MAX_DIMENSION = 1200;
const JPEG_QUALITY = 0.6;
const MAX_DATA_URL_BYTES = 700 * 1024;

/**
 * Compress an image file to a data URL.
 * Browser-only utility used for doctor's notes.
 */
export async function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error("Could not read the file."));
    };

    reader.onload = () => {
      img.onerror = () => {
        reject(new Error("Could not read the image."));
      };

      img.onload = () => {
        let { width, height } = img;

        if (width > height && width > MAX_DIMENSION) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else if (height > MAX_DIMENSION) {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");

        if (!context) {
          reject(new Error("Could not create image canvas."));
          return;
        }

        context.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);

        if (dataUrl.length > MAX_DATA_URL_BYTES) {
          reject(
            new Error(
              "Image is still too large after compression. Try a smaller photo or crop it tighter.",
            ),
          );
          return;
        }

        resolve(dataUrl);
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}
