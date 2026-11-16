// Reads an uploaded image, validates it and shrinks it so it fits in localStorage.

const MAX_BYTES = 8 * 1024 * 1024; // reject files larger than 8 MB
const MAX_DIMENSION = 900; // longest side after resizing

export function readImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No file selected.'));
    if (!file.type.startsWith('image/'))
      return reject(new Error('Only image files (JPG, PNG, GIF, WebP) are supported.'));
    if (file.size > MAX_BYTES) return reject(new Error('That image is larger than 8 MB.'));

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('The file could not be read.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('This image could not be decoded. Try another file.'));
      img.onload = () => {
        const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff'; // JPEG has no transparency
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve({ dataUrl: canvas.toDataURL('image/jpeg', 0.8), name: file.name });
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
