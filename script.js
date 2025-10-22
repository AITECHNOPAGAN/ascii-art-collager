// DOM elements
const newLayerBtn = document.getElementById('newLayerBtn');
const layersList = document.getElementById('layersList');
const canvasContainer = document.querySelector('.canvas-container');
const enableParallaxToggle = document.getElementById('enableParallaxToggle');

// Layer control elements
const layerContentType = document.getElementsByName('layerContentType');
const layerImageUpload = document.getElementById('layerImageUpload');
const layerTextarea = document.getElementById('layerTextarea');
const layerColorPicker = document.getElementById('layerColorPicker');
const layerFontSize = document.getElementById('layerFontSize');
const layerFontSizeValue = document.getElementById('layerFontSizeValue');
const positionSelect = document.getElementById('positionSelect');
const offsetX = document.getElementById('offsetX');
const offsetXValue = document.getElementById('offsetXValue');
const offsetY = document.getElementById('offsetY');
const offsetYValue = document.getElementById('offsetYValue');
const scaleSlider = document.getElementById('scaleSlider');
const scaleValue = document.getElementById('scaleValue');
const parallaxSlider = document.getElementById('parallaxSlider');
const parallaxValue = document.getElementById('parallaxValue');

// Export button
const exportBtn = document.getElementById('exportBtn');
const saveLayerBtn = document.getElementById('saveLayerBtn');
const resolutionSelect = document.getElementById('resolutionSelect');

// Layer system state
let layers = [];
let activeLayerId = null;
let nextLayerId = 1;
let editingState = null; // Current layer being edited (uncommitted changes)
let hasUnsavedChanges = false;

// Parallax state
let parallaxEnabled = false;
let mouseX = 0.5;
let mouseY = 0.5;
let animationFrameId = null;

// Unicode block characters for ASCII art
const BLOCKS = [' ', '░', '▒', '▓', '█'];

// Event listeners
newLayerBtn.addEventListener('click', createNewLayer);
enableParallaxToggle.addEventListener('change', handleParallaxToggle);
document.addEventListener('mousemove', handleMouseMove);

// Layer control listeners
layerContentType.forEach(radio => {
    radio.addEventListener('change', handleLayerContentTypeChange);
});
layerImageUpload.addEventListener('change', handleLayerImageUpload);
layerTextarea.addEventListener('input', handleLayerTextInput);
layerColorPicker.addEventListener('input', handleLayerColorChange);
layerFontSize.addEventListener('input', handleLayerFontSizeChange);
positionSelect.addEventListener('change', handlePositionChange);
offsetX.addEventListener('input', handleOffsetXChange);
offsetY.addEventListener('input', handleOffsetYChange);
scaleSlider.addEventListener('input', handleScaleChange);
parallaxSlider.addEventListener('input', handleParallaxChange);

// Export listener
exportBtn.addEventListener('click', exportHTML);
saveLayerBtn.addEventListener('click', saveCurrentLayer);

// Resolution change listener
resolutionSelect.addEventListener('change', handleResolutionChange);

// Initialize
updateUI();
applyResolutionToCanvas();

function createNewLayer() {
    // Check for unsaved changes before creating new layer
    if (hasUnsavedChanges) {
        if (!promptSaveChanges()) {
            return; // User cancelled
        }
    }

    const layer = {
        id: nextLayerId++,
        name: `Layer ${nextLayerId - 1}`,
        asciiArt: '',
        imageData: null, // For hiresImage layers: store the base64 image data
        contentType: 'image', // 'image' (ASCII conversion), 'hiresImage', or 'text'
        position: 'center',
        offsetX: 0,
        offsetY: 0,
        scale: 1,
        fontSize: 12,
        color: '#000000',
        zIndex: layers.length + 2,
        visibility: true,
        parallaxStrength: 0.3 + (layers.length * 0.1)
    };

    layers.push(layer);
    activeLayerId = layer.id;
    
    // Initialize editing state for new layer
    editingState = { ...layer };
    hasUnsavedChanges = false;
    
    updateUI();
    renderLayers();
}

function handleLayerImageUpload(event) {
    const file = event.target.files[0];
    if (!file || !activeLayerId) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            if (!editingState) return;
            
            // Check the current content type
            if (editingState.contentType === 'hiresImage') {
                // Store the image data URL directly for hi-res display
                editingState.imageData = e.target.result;
                hasUnsavedChanges = true;
                renderLayers();
                updateUI();
            } else {
                // Convert to ASCII art for 'image' type
                convertImageToAscii(img);
            }
        };
        img.onerror = () => {
            alert('Failed to load image');
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    
    event.target.value = '';
}

function convertImageToAscii(img) {
    if (!editingState) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const width = 100;
    const height = Math.floor((img.height / img.width) * width * 0.55);
    
    canvas.width = width;
    canvas.height = height;

    // Fill canvas with white background to ensure proper color rendering
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
    
    // Draw image with proper alpha handling
    ctx.drawImage(img, 0, 0, width, height);

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    let asciiArt = '';
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        // Normalize alpha to 0-1 range
        const alpha = a / 255;

        // Only treat actually transparent pixels as invisible
        // Don't guess based on color - respect the source image's alpha channel
        const isTransparent = alpha < 0.1;

        if (isTransparent) {
            asciiArt += `<span style="opacity: 0;"> </span>`;
        } else {
            // Use perceptual brightness calculation (weighted for human vision)
            // This gives more accurate results than simple average
            const brightness = (0.299 * r + 0.587 * g + 0.114 * b);
            
            // Invert the block index mapping so darker colors get darker blocks
            const blockIndex = BLOCKS.length - 1 - Math.floor((brightness / 255) * (BLOCKS.length - 1));
            const block = BLOCKS[blockIndex];
            
            // Use rgba with actual alpha value for proper transparency handling
            const color = `rgba(${r}, ${g}, ${b}, ${alpha})`;
            asciiArt += `<span style="color: ${color};">${block}</span>`;
        }

        if ((Math.floor(i / 4) + 1) % width === 0) {
            asciiArt += '\n';
        }
    }

    editingState.asciiArt = asciiArt;
    editingState.contentType = 'image';
    hasUnsavedChanges = true;
    
    renderLayers();
    updateUI();
}

function handleLayerTextInput(e) {
    if (!editingState) return;

    editingState.asciiArt = e.target.value;
    editingState.contentType = 'text';
    hasUnsavedChanges = true;
    
    renderLayers();
    updateUI();
}

function handleLayerContentTypeChange(e) {
    if (!editingState) return;
    
    const mode = e.target.value;
    editingState.contentType = mode;
    
    if (mode === 'text') {
        document.getElementById('layerImageSection').style.display = 'none';
        document.getElementById('layerTextSection').style.display = 'block';
    } else {
        // Both 'image' (ASCII conversion) and 'hiresImage' use the image upload
        document.getElementById('layerImageSection').style.display = 'block';
        document.getElementById('layerTextSection').style.display = 'none';
    }
}

function handleLayerColorChange(e) {
    if (!editingState) return;

    editingState.color = e.target.value;
    hasUnsavedChanges = true;
    renderLayers();
    updateUI();
}

function handleLayerFontSizeChange(e) {
    if (!editingState) return;

    editingState.fontSize = parseInt(e.target.value);
    layerFontSizeValue.textContent = editingState.fontSize;
    hasUnsavedChanges = true;
    renderLayers();
    updateUI();
}

function handlePositionChange(e) {
    if (!editingState) return;

    editingState.position = e.target.value;
    hasUnsavedChanges = true;
    renderLayers();
    updateUI();
}

function handleOffsetXChange(e) {
    if (!editingState) return;

    editingState.offsetX = parseInt(e.target.value);
    offsetXValue.textContent = editingState.offsetX;
    hasUnsavedChanges = true;
    updateLayerTransforms();
    updateUI();
}

function handleOffsetYChange(e) {
    if (!editingState) return;

    editingState.offsetY = parseInt(e.target.value);
    offsetYValue.textContent = editingState.offsetY;
    hasUnsavedChanges = true;
    updateLayerTransforms();
    updateUI();
}

function handleScaleChange(e) {
    if (!editingState) return;

    editingState.scale = parseFloat(e.target.value);
    scaleValue.textContent = editingState.scale.toFixed(1);
    hasUnsavedChanges = true;
    updateLayerTransforms();
    updateUI();
}

function handleParallaxChange(e) {
    if (!editingState) return;

    editingState.parallaxStrength = parseFloat(e.target.value);
    parallaxValue.textContent = editingState.parallaxStrength.toFixed(1);
    hasUnsavedChanges = true;
    updateLayerTransforms();
    updateUI();
}

function renderLayers() {
    // Remove all existing layer elements
    const existingLayers = canvasContainer.querySelectorAll('.ascii-layer, .image-layer');
    existingLayers.forEach(el => el.remove());

    // Render each visible layer
    layers.forEach(layer => {
        // Use editingState for active layer, saved layer for others
        const layerData = (layer.id === activeLayerId && editingState) ? editingState : layer;
        
        if (!layerData.visibility) return;
        
        // Skip if no content
        if (layerData.contentType === 'hiresImage' && !layerData.imageData) return;
        if ((layerData.contentType === 'image' || layerData.contentType === 'text') && !layerData.asciiArt) return;

        if (layerData.contentType === 'hiresImage') {
            // Render as hi-res image
            const layerDiv = document.createElement('div');
            layerDiv.className = 'image-layer';
            layerDiv.id = `layer-${layer.id}`;
            
            const img = document.createElement('img');
            img.src = layerData.imageData;
            img.style.maxWidth = '100%';
            img.style.maxHeight = '100%';
            img.style.display = 'block';
            
            layerDiv.appendChild(img);
            
            // Apply positioning class
            layerDiv.classList.add(`position-${layerData.position}`);
            layerDiv.style.zIndex = layerData.zIndex;
            
            canvasContainer.appendChild(layerDiv);
        } else {
            // Render as ASCII (either converted image or text)
            const layerDiv = document.createElement('div');
            layerDiv.className = 'ascii-layer';
            layerDiv.id = `layer-${layer.id}`;
            
            // For text content, wrap in a span with color
            if (layerData.contentType === 'text') {
                layerDiv.innerHTML = `<span style="color: ${layerData.color};">${layerData.asciiArt}</span>`;
            } else {
                layerDiv.innerHTML = layerData.asciiArt;
            }
            
            // Apply positioning class
            layerDiv.classList.add(`position-${layerData.position}`);
            layerDiv.style.fontSize = layerData.fontSize + 'px';
            layerDiv.style.zIndex = layerData.zIndex;
            
            canvasContainer.appendChild(layerDiv);
        }
    });

    updateLayerTransforms();
}

function updateLayerTransforms() {
    layers.forEach(layer => {
        const layerDiv = document.getElementById(`layer-${layer.id}`);
        if (!layerDiv) return;

        // Use editingState for active layer, saved layer for others
        const layerData = (layer.id === activeLayerId && editingState) ? editingState : layer;

        const scale = layerData.scale;
        let transformOrigin = 'center';
        
        switch(layerData.position) {
            case 'top-left':
                transformOrigin = 'top left';
                break;
            case 'top-right':
                transformOrigin = 'top right';
                break;
            case 'bottom-left':
                transformOrigin = 'bottom left';
                break;
            case 'bottom-right':
                transformOrigin = 'bottom right';
                break;
            case 'center':
                transformOrigin = 'center';
                break;
        }
        
        layerDiv.style.transformOrigin = transformOrigin;
        
        let translateX = layerData.offsetX;
        let translateY = layerData.offsetY;
        
        if (parallaxEnabled) {
            translateX += (mouseX - 0.5) * layerData.parallaxStrength * 100;
            translateY += (mouseY - 0.5) * layerData.parallaxStrength * 100;
        }
        
        // For center position, add the centering transform
        if (layerData.position === 'center') {
            layerDiv.style.transform = `translate(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px)) scale(${scale})`;
        } else {
            layerDiv.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
        }
    });
}

function updateUI() {
    // Update layer list
    layersList.innerHTML = '';
    
    if (layers.length === 0) {
        layersList.innerHTML = '<div class="empty-state">No layers yet. Click "+ New Layer" to start!</div>';
        document.getElementById('layerControls').style.display = 'none';
    } else {
        // Display layers
        layers.forEach((layer, index) => {
            const layerItem = document.createElement('div');
            layerItem.className = 'layer-item';
            if (layer.id === activeLayerId) {
                layerItem.classList.add('active');
            }
            
            // Show editingState preview for active layer with unsaved changes, otherwise saved state
            const displayData = (layer.id === activeLayerId && editingState) ? editingState : layer;
            
            // Create preview based on content type
            let preview;
            if (displayData.contentType === 'hiresImage') {
                preview = displayData.imageData ? '🖼️ Hi-Res Image' : '(no image)';
            } else if (displayData.contentType === 'image') {
                const asciiText = displayData.asciiArt ? displayData.asciiArt.replace(/<[^>]*>/g, '') : '';
                preview = asciiText ? '🎨 ' + asciiText.substring(0, 25).replace(/\n/g, ' ') + '...' : '(no ASCII art)';
            } else {
                const asciiText = displayData.asciiArt ? displayData.asciiArt.replace(/<[^>]*>/g, '') : '';
                preview = asciiText ? asciiText.substring(0, 30).replace(/\n/g, ' ') + '...' : '(empty)';
            }
            const unsavedIndicator = (layer.id === activeLayerId && hasUnsavedChanges) ? ' *' : '';
            
            layerItem.innerHTML = `
                <div class="layer-header" data-layer-id="${layer.id}">
                    <span class="layer-name">${layer.name}${unsavedIndicator}</span>
                    <div class="layer-controls">
                        <button class="layer-btn visibility-btn" data-layer-id="${layer.id}" title="Toggle visibility">
                            ${layer.visibility ? '👁️' : '👁️‍🗨️'}
                        </button>
                        <button class="layer-btn up-btn" data-layer-id="${layer.id}" title="Move up" ${index === layers.length - 1 ? 'disabled' : ''}>↑</button>
                        <button class="layer-btn down-btn" data-layer-id="${layer.id}" title="Move down" ${index === 0 ? 'disabled' : ''}>↓</button>
                        <button class="layer-btn delete-btn" data-layer-id="${layer.id}" title="Delete">🗑️</button>
                    </div>
                </div>
                <div class="layer-preview">${preview}</div>
            `;
            
            layersList.appendChild(layerItem);
        });
    }

    // Add event listeners to layer controls
    document.querySelectorAll('.layer-header').forEach(header => {
        header.addEventListener('click', (e) => {
            if (!e.target.closest('button')) {
                const layerId = parseInt(header.dataset.layerId);
                setActiveLayer(layerId);
            }
        });
    });

    document.querySelectorAll('.visibility-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const layerId = parseInt(btn.dataset.layerId);
            toggleLayerVisibility(layerId);
        });
    });

    document.querySelectorAll('.up-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const layerId = parseInt(btn.dataset.layerId);
            moveLayerUp(layerId);
        });
    });

    document.querySelectorAll('.down-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const layerId = parseInt(btn.dataset.layerId);
            moveLayerDown(layerId);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const layerId = parseInt(btn.dataset.layerId);
            deleteLayer(layerId);
        });
    });

    // Update active layer controls
    const activeLayer = layers.find(l => l.id === activeLayerId);
    const hasActiveLayer = activeLayer !== undefined;
    
    // Enable/disable controls based on active layer
    if (hasActiveLayer) {
        document.getElementById('layerControls').style.display = 'block';
    }
    
    if (activeLayer && editingState) {
        // Update content type - use editingState
        const contentTypeRadio = document.querySelector(`input[name="layerContentType"][value="${editingState.contentType}"]`);
        if (contentTypeRadio) contentTypeRadio.checked = true;
        
        if (editingState.contentType === 'text') {
            document.getElementById('layerImageSection').style.display = 'none';
            document.getElementById('layerTextSection').style.display = 'block';
            layerTextarea.value = editingState.asciiArt;
        } else {
            // Both 'image' (ASCII conversion) and 'hiresImage' use the image upload
            document.getElementById('layerImageSection').style.display = 'block';
            document.getElementById('layerTextSection').style.display = 'none';
        }
        
        // Update other controls - use editingState
        layerColorPicker.value = editingState.color;
        layerFontSize.value = editingState.fontSize;
        layerFontSizeValue.textContent = editingState.fontSize;
        positionSelect.value = editingState.position;
        offsetX.value = editingState.offsetX;
        offsetXValue.textContent = editingState.offsetX;
        offsetY.value = editingState.offsetY;
        offsetYValue.textContent = editingState.offsetY;
        scaleSlider.value = editingState.scale;
        scaleValue.textContent = editingState.scale.toFixed(1);
        parallaxSlider.value = editingState.parallaxStrength;
        parallaxValue.textContent = editingState.parallaxStrength.toFixed(1);
    }

    // Enable/disable export button
    const hasLayers = layers.length > 0 && layers.some(l => l.asciiArt || l.imageData);
    exportBtn.disabled = !hasLayers;
}

function saveCurrentLayer() {
    if (!editingState || !activeLayerId) return;
    
    const layer = layers.find(l => l.id === activeLayerId);
    if (!layer) return;
    
    // Copy editingState to the layer
    layer.asciiArt = editingState.asciiArt;
    layer.imageData = editingState.imageData;
    layer.contentType = editingState.contentType;
    layer.position = editingState.position;
    layer.offsetX = editingState.offsetX;
    layer.offsetY = editingState.offsetY;
    layer.scale = editingState.scale;
    layer.fontSize = editingState.fontSize;
    layer.color = editingState.color;
    layer.parallaxStrength = editingState.parallaxStrength;
    
    hasUnsavedChanges = false;
    renderLayers(); // Update the canvas to show saved state
    updateUI();
}

function promptSaveChanges() {
    const result = confirm('You have unsaved changes. Do you want to save them?\n\nOK = Save changes\nCancel = Discard changes');
    
    if (result) {
        // User clicked OK - save changes
        saveCurrentLayer();
    } else {
        // User clicked Cancel - discard changes
        hasUnsavedChanges = false;
    }
    
    return true; // Always proceed with the action
}

function setActiveLayer(layerId) {
    // Check for unsaved changes before switching
    if (hasUnsavedChanges && activeLayerId !== layerId) {
        if (!promptSaveChanges()) {
            return; // User cancelled
        }
    }
    
    activeLayerId = layerId;
    
    // Initialize editingState with the new active layer
    const layer = layers.find(l => l.id === layerId);
    if (layer) {
        editingState = { ...layer };
        hasUnsavedChanges = false;
    }
    
    updateUI();
    renderLayers();
}

function toggleLayerVisibility(layerId) {
    const layer = layers.find(l => l.id === layerId);
    if (layer) {
        layer.visibility = !layer.visibility;
        renderLayers();
        updateUI();
    }
}

function moveLayerUp(layerId) {
    const index = layers.findIndex(l => l.id === layerId);
    if (index < layers.length - 1) {
        const temp = layers[index].zIndex;
        layers[index].zIndex = layers[index + 1].zIndex;
        layers[index + 1].zIndex = temp;
        
        [layers[index], layers[index + 1]] = [layers[index + 1], layers[index]];
        
        renderLayers();
        updateUI();
    }
}

function moveLayerDown(layerId) {
    const index = layers.findIndex(l => l.id === layerId);
    if (index > 0) {
        const temp = layers[index].zIndex;
        layers[index].zIndex = layers[index - 1].zIndex;
        layers[index - 1].zIndex = temp;
        
        [layers[index], layers[index - 1]] = [layers[index - 1], layers[index]];
        
        renderLayers();
        updateUI();
    }
}

function deleteLayer(layerId) {
    // Check for unsaved changes if deleting active layer
    if (layerId === activeLayerId && hasUnsavedChanges) {
        const result = confirm('This layer has unsaved changes. Are you sure you want to delete it?');
        if (!result) return;
    } else {
        const confirmDelete = confirm('Are you sure you want to delete this layer?');
        if (!confirmDelete) return;
    }
    
    layers = layers.filter(l => l.id !== layerId);
    if (activeLayerId === layerId) {
        activeLayerId = layers.length > 0 ? layers[layers.length - 1].id : null;
        editingState = null;
        hasUnsavedChanges = false;
        
        // Load editingState for the new active layer
        if (activeLayerId) {
            const newActiveLayer = layers.find(l => l.id === activeLayerId);
            if (newActiveLayer) {
                editingState = { ...newActiveLayer };
            }
        }
    }
    renderLayers();
    updateUI();
}

// Resolution handling
function handleResolutionChange() {
    applyResolutionToCanvas();
}

function applyResolutionToCanvas() {
    const resolution = resolutionSelect.value;
    const container = canvasContainer;
    
    // Reset all styles first
    container.style.removeProperty('max-width');
    container.style.removeProperty('max-height');
    container.style.removeProperty('width');
    container.style.removeProperty('height');
    container.style.removeProperty('border');
    container.style.removeProperty('margin');
    
    switch(resolution) {
        case 'square':
            container.style.maxWidth = '800px';
            container.style.maxHeight = '800px';
            container.style.width = '100vmin';
            container.style.height = '100vmin';
            container.style.border = '2px solid #000000';
            container.style.margin = 'auto';
            break;
        case 'landscape':
            container.style.maxWidth = '1200px';
            container.style.maxHeight = '675px';
            container.style.width = 'min(90vw, 1200px)';
            container.style.height = 'calc(min(90vw, 1200px) * 9 / 16)';
            container.style.border = '2px solid #000000';
            container.style.margin = 'auto';
            break;
        case 'portrait':
            container.style.maxWidth = '675px';
            container.style.maxHeight = '1200px';
            container.style.width = 'calc(min(90vh, 1200px) * 9 / 16)';
            container.style.height = 'min(90vh, 1200px)';
            container.style.border = '2px solid #000000';
            container.style.margin = 'auto';
            break;
        case 'responsive':
        default:
            // Default styles already set in CSS, no changes needed
            break;
    }
}

// Parallax handling
function handleParallaxToggle(e) {
    parallaxEnabled = e.target.checked;
    if (parallaxEnabled) {
        startParallax();
    } else {
        stopParallax();
        updateLayerTransforms();
    }
}

function handleMouseMove(e) {
    if (!parallaxEnabled) return;
    mouseX = e.clientX / window.innerWidth;
    mouseY = e.clientY / window.innerHeight;
}

function startParallax() {
    function animate() {
        updateLayerTransforms();
        animationFrameId = requestAnimationFrame(animate);
    }
    animate();
}

function stopParallax() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

// Export function
function exportHTML() {
    if (layers.length === 0) return;

    // Filter visible layers with content
    const visibleLayers = layers.filter(l => l.visibility && (l.asciiArt || l.imageData));
    if (visibleLayers.length === 0) return;

    // Get selected resolution
    const resolution = resolutionSelect.value;
    
    // Define resolution dimensions and styles
    let containerStyles = '';
    let bodyStyles = '';
    
    switch(resolution) {
        case 'square':
            containerStyles = `
            max-width: 800px;
            max-height: 800px;
            width: 100vmin;
            height: 100vmin;
            border: 1px solid #000000;`;
            bodyStyles = `
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #f0f0f0;`;
            break;
        case 'landscape':
            containerStyles = `
            max-width: 1200px;
            max-height: 675px;
            width: 90vw;
            height: calc(90vw * 9 / 16);
            border: 2px solid #000000;`;
            bodyStyles = `
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #f0f0f0;`;
            break;
        case 'portrait':
            containerStyles = `
            max-width: 675px;
            max-height: 1200px;
            width: calc(90vh * 9 / 16);
            height: 90vh;
            border: 2px solid #000000;`;
            bodyStyles = `
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #f0f0f0;`;
            break;
        case 'responsive':
        default:
            containerStyles = `
            width: 100%;
            height: 100%;`;
            bodyStyles = `
            width: 100vw;
            height: 100vh;
            overflow: hidden;`;
            break;
    }

    // Generate layers HTML
    let layersHTML = '';
    visibleLayers.forEach(layer => {
        const positionClass = `position-${layer.position}`;
        
        if (layer.contentType === 'hiresImage' && layer.imageData) {
            // Render hi-res image layer
            layersHTML += `        <div class="image-layer ${positionClass}" data-layer-id="${layer.id}" data-parallax="${layer.parallaxStrength}" data-offset-x="${layer.offsetX}" data-offset-y="${layer.offsetY}" data-scale="${layer.scale}" style="z-index: ${layer.zIndex};">
            <img src="${layer.imageData}" style="max-width: 100%; max-height: 100%; display: block;">
        </div>\n`;
        } else if (layer.contentType === 'text' && layer.asciiArt) {
            // Render ASCII text layer
            let content = `<span style="color: ${layer.color};">${layer.asciiArt}</span>`;
            layersHTML += `        <div class="ascii-layer ${positionClass}" data-layer-id="${layer.id}" data-parallax="${layer.parallaxStrength}" data-offset-x="${layer.offsetX}" data-offset-y="${layer.offsetY}" data-scale="${layer.scale}" style="z-index: ${layer.zIndex}; font-size: ${layer.fontSize}px;">
${content}
        </div>\n`;
        } else if (layer.contentType === 'image' && layer.asciiArt) {
            // Render ASCII-converted image layer
            layersHTML += `        <div class="ascii-layer ${positionClass}" data-layer-id="${layer.id}" data-parallax="${layer.parallaxStrength}" data-offset-x="${layer.offsetX}" data-offset-y="${layer.offsetY}" data-scale="${layer.scale}" style="z-index: ${layer.zIndex}; font-size: ${layer.fontSize}px;">
${layer.asciiArt}
        </div>\n`;
        }
    });

    // Generate the complete HTML
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ASCII Art</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            background-color: #ffffff;
            font-family: 'Courier New', monospace;${bodyStyles}
        }
        
        .canvas-container {
            position: relative;
            background-color: #ffffff;
            overflow: hidden;${containerStyles}
        }
        
        .ascii-layer {
            position: absolute;
            line-height: 1;
            white-space: pre;
            font-family: 'Courier New', monospace;
            transition: transform 0.05s ease-out;
        }
        
        .image-layer {
            position: absolute;
            transition: transform 0.05s ease-out;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .image-layer img {
            max-width: 100%;
            max-height: 100%;
            display: block;
        }
        
        .ascii-layer.position-top-left,
        .image-layer.position-top-left {
            top: 0;
            left: 0;
        }
        
        .ascii-layer.position-top-right,
        .image-layer.position-top-right {
            top: 0;
            right: 0;
        }
        
        .ascii-layer.position-bottom-left,
        .image-layer.position-bottom-left {
            bottom: 0;
            left: 0;
        }
        
        .ascii-layer.position-bottom-right,
        .image-layer.position-bottom-right {
            bottom: 0;
            right: 0;
        }
        
        .ascii-layer.position-center,
        .image-layer.position-center {
            top: 50%;
            left: 50%;
        }
    </style>
</head>
<body>
    <div class="canvas-container">
${layersHTML}
    </div>

    <script>
        // Parallax state
        const parallaxEnabled = ${parallaxEnabled};
        let mouseX = 0.5;
        let mouseY = 0.5;
        let animationFrameId = null;

        // Get all layers and their properties
        const layers = Array.from(document.querySelectorAll('.ascii-layer, .image-layer')).map(layerDiv => ({
            element: layerDiv,
            parallaxStrength: parseFloat(layerDiv.dataset.parallax),
            offsetX: parseInt(layerDiv.dataset.offsetX),
            offsetY: parseInt(layerDiv.dataset.offsetY),
            scale: parseFloat(layerDiv.dataset.scale),
            position: layerDiv.className.match(/position-([\\w-]+)/)[1]
        }));

        // Mouse movement handler
        if (parallaxEnabled) {
            document.addEventListener('mousemove', (e) => {
                const container = document.querySelector('.canvas-container');
                const rect = container.getBoundingClientRect();
                mouseX = (e.clientX - rect.left) / rect.width;
                mouseY = (e.clientY - rect.top) / rect.height;
            });
        }

        // Update layer transforms with or without parallax
        function updateLayerTransforms() {
            layers.forEach(layer => {
                const { element, parallaxStrength, offsetX, offsetY, scale, position } = layer;
                
                // Calculate transform origin
                let transformOrigin = 'center';
                switch(position) {
                    case 'top-left':
                        transformOrigin = 'top left';
                        break;
                    case 'top-right':
                        transformOrigin = 'top right';
                        break;
                    case 'bottom-left':
                        transformOrigin = 'bottom left';
                        break;
                    case 'bottom-right':
                        transformOrigin = 'bottom right';
                        break;
                    case 'center':
                        transformOrigin = 'center';
                        break;
                }
                
                element.style.transformOrigin = transformOrigin;
                
                // Apply parallax offset only if parallax is enabled
                let translateX = offsetX;
                let translateY = offsetY;
                
                if (parallaxEnabled) {
                    translateX += (mouseX - 0.5) * parallaxStrength * 100;
                    translateY += (mouseY - 0.5) * parallaxStrength * 100;
                }
                
                // Apply transform based on position
                if (position === 'center') {
                    element.style.transform = \`translate(calc(-50% + \${translateX}px), calc(-50% + \${translateY}px)) scale(\${scale})\`;
                } else {
                    element.style.transform = \`translate(\${translateX}px, \${translateY}px) scale(\${scale})\`;
                }
            });
        }

        // Animation loop
        function animate() {
            updateLayerTransforms();
            animationFrameId = requestAnimationFrame(animate);
        }

        // Start animation only if parallax is enabled, otherwise set transforms once
        if (parallaxEnabled) {
            animate();
        } else {
            updateLayerTransforms();
        }
    </script>
</body>
</html>`;

    downloadFile(htmlContent, 'ascii-art.html');
}

function downloadFile(content, filename) {
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

