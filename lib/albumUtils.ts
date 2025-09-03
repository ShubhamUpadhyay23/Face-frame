/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
// Helper function to load an image and return it as an HTMLImageElement
function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(new Error(`Failed to load image: ${src.substring(0, 50)}...`));
        img.src = src;
    });
}

/**
 * Creates a single image containing a grid of the generated profile pictures.
 * @param imageData A record mapping style strings (e.g. 'Instagram_1') to their image data URLs.
 * @returns A promise that resolves to a data URL of the generated grid image (JPEG format).
 */
export async function createAlbumPage(imageData: Record<string, string>): Promise<string> {
    const canvas = document.createElement('canvas');
    // Landscape canvas to fit a 4x2 grid
    const canvasWidth = 3200;
    const canvasHeight = 1800;
    const padding = 100;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Could not get 2D canvas context');
    }

    // 1. Draw the background
    ctx.fillStyle = '#f4f4f5'; // light neutral color
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 2. Load all the images concurrently
    const sortedImageEntries = Object.entries(imageData).sort(([keyA], [keyB]) => keyA.localeCompare(keyB));
    
    const imagesWithStyles = sortedImageEntries.map(([key, url]) => ({
        style: key.split('_')[0], // Extract 'Instagram' from 'Instagram_1'
        variation: key.split('_')[1],
        imgPromise: loadImage(url),
    }));

    const loadedImages = await Promise.all(imagesWithStyles.map(i => i.imgPromise));

    // 3. Define 4x2 grid layout and draw each image
    const grid = { cols: 4, rows: 2 };
    const totalContentWidth = canvasWidth - padding * 2;
    const totalContentHeight = canvasHeight - padding * 2;
    const cellWidth = totalContentWidth / grid.cols;
    const cellHeight = totalContentHeight / grid.rows;
    const imagePadding = 30;
    
    const imageWidth = cellWidth - imagePadding * 2;
    // Calculate imageHeight to maintain a 1:1 aspect ratio based on the derived width
    const imageHeight = imageWidth;


    loadedImages.forEach((img, index) => {
        const { style, variation } = imagesWithStyles[index];
        const row = Math.floor(index / grid.cols);
        const col = index % grid.cols;

        const cellX = padding + col * cellWidth;
        const cellY = padding + row * cellHeight;

        // Center the image box within the cell
        const imgX = cellX + (cellWidth - imageWidth) / 2;
        const imgY = cellY + (cellHeight - imageHeight - 60) / 2; // Move up to make space for caption
        
        ctx.save();

        // Draw a soft shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 25;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 8;

        // Draw the image
        ctx.drawImage(img, imgX, imgY, imageWidth, imageHeight);
        
        ctx.shadowColor = 'transparent'; // Remove shadow for text

        // Draw the style name below the image
        ctx.fillStyle = '#333';
        ctx.font = `42px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const captionY = imgY + imageHeight + 20;
        ctx.fillText(`${style} (v${variation})`, cellX + cellWidth / 2, captionY);
        
        ctx.restore();
    });

    // 4. Draw footer text
    ctx.fillStyle = '#999';
    ctx.font = `28px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('Generated with FaceFrame on Google AI Studio', canvasWidth / 2, canvasHeight - 30);


    // Convert canvas to a high-quality JPEG and return the data URL
    return canvas.toDataURL('image/jpeg', 0.95);
}