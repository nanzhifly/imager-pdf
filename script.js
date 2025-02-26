document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const previewContainer = document.getElementById('previewContainer');
    const controls = document.getElementById('controls');
    const originalPreview = document.getElementById('originalPreview');
    const compressedPreview = document.getElementById('compressedPreview');
    const originalSize = document.getElementById('originalSize');
    const compressedSize = document.getElementById('compressedSize');
    const qualitySlider = document.getElementById('quality');
    const qualityValue = document.getElementById('qualityValue');
    const downloadBtn = document.getElementById('downloadBtn');

    let originalFile = null;

    // 拖放处理
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#007AFF';
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#DEDEDE';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#DEDEDE';
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    qualitySlider.addEventListener('input', (e) => {
        qualityValue.textContent = `${e.target.value}%`;
        if (originalFile) {
            compressImage(originalFile, e.target.value / 100);
        }
    });

    function handleFile(file) {
        if (!file.type.match('image.*')) {
            alert('请选择图片文件！');
            return;
        }

        originalFile = file;
        const reader = new FileReader();
        
        reader.onload = (e) => {
            originalPreview.src = e.target.result;
            originalPreview.style.display = 'block';
            originalSize.textContent = formatFileSize(file.size);
            previewContainer.hidden = false;
            controls.hidden = false;
            compressImage(file, qualitySlider.value / 100);
        };

        reader.readAsDataURL(file);
    }

    function compressImage(file, quality) {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            canvas.width = img.width;
            canvas.height = img.height;
            
            ctx.drawImage(img, 0, 0);
            
            // 先尝试使用 toBlob
            try {
                canvas.toBlob((blob) => {
                    if (!blob) {
                        throw new Error('Blob creation failed');
                    }
                    handleCompressedImage(blob, file);
                }, file.type, quality);
            } catch (e) {
                // 如果 toBlob 失败，使用 toDataURL 作为备选方案
                try {
                    const dataUrl = canvas.toDataURL(file.type, quality);
                    fetch(dataUrl)
                        .then(res => res.blob())
                        .then(blob => handleCompressedImage(blob, file));
                } catch (err) {
                    console.error('Image compression failed:', err);
                    // 如果压缩失败，使用原图
                    handleCompressedImage(file, file);
                }
            }
        };
    }

    function handleCompressedImage(blob, originalFile) {
        if (blob.size > originalFile.size) {
            // 如果压缩后更大，使用原图
            compressedPreview.src = URL.createObjectURL(originalFile);
            compressedSize.textContent = formatFileSize(originalFile.size);
            
            downloadBtn.onclick = () => {
                const link = document.createElement('a');
                link.href = URL.createObjectURL(originalFile);
                link.download = `compressed_${originalFile.name}`;
                link.click();
            };
            return;
        }

        compressedPreview.src = URL.createObjectURL(blob);
        compressedPreview.style.display = 'block';
        compressedSize.textContent = formatFileSize(blob.size);
        
        downloadBtn.onclick = () => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `compressed_${originalFile.name}`;
            link.click();
        };
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}); 