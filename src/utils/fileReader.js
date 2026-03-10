function readBlobAsDataUrl(blob, filename = "file") {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error(`Failed to read file: ${filename}`));
        reader.readAsDataURL(blob);
    });
}

function loadImage(file) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const image = new Image();
        image.onload = () => {
            URL.revokeObjectURL(url);
            resolve(image);
        };
        image.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error(`Failed to load image: ${file.name}`));
        };
        image.src = url;
    });
}

async function compressImage(file, maxDimension = 1280, quality = 0.8) {
    const image = await loadImage(file);
    const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0, width, height);

    const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, "image/jpeg", quality);
    });

    if (!blob) {
        throw new Error(`Failed to process image: ${file.name}`);
    }

    return blob;
}

export async function readFileAsDataUrl(
    file,
    {
        maxSizeMB = 8,
        compressImages = true,
        maxDimension = 1280,
        quality = 0.8,
    } = {},
) {
    if (!file) throw new Error("No file selected.");

    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes && !file.type.startsWith("image/")) {
        throw new Error(`${file.name} is larger than ${maxSizeMB}MB. Please choose a smaller file.`);
    }

    if (compressImages && file.type.startsWith("image/")) {
        const compressed = await compressImage(file, maxDimension, quality);
        if (compressed.size > maxBytes) {
            throw new Error(`${file.name} is still larger than ${maxSizeMB}MB after compression.`);
        }
        return readBlobAsDataUrl(compressed, file.name);
    }

    return readBlobAsDataUrl(file, file.name);
}

export async function readFilesAsDataUrls(files, options) {
    const fileList = Array.from(files || []);
    return Promise.all(fileList.map((file) => readFileAsDataUrl(file, options)));
}
