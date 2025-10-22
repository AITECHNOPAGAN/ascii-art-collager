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

// Initialize
updateUI();

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
        contentType: 'image', // 'image' or 'text'
        position: 'center',
        offsetX: 0,
        offsetY: 0,
        scale: 1,
        fontSize: 12,
        color: '#ffffff',
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
            convertImageToAscii(img);
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
    const ctx = canvas.getContext('2d');

    const width = 100;
    const height = Math.floor((img.height / img.width) * width * 0.55);
    
    canvas.width = width;
    canvas.height = height;

    ctx.drawImage(img, 0, 0, width, height);

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    let asciiArt = '';
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const isWhite = r > 240 && g > 240 && b > 240;

        if (isWhite) {
            asciiArt += `<span style="opacity: 0;"> </span>`;
        } else {
            const brightness = (r + g + b) / 3;
            const blockIndex = Math.floor((brightness / 255) * (BLOCKS.length - 1));
            const block = BLOCKS[blockIndex];
            const color = `rgb(${r}, ${g}, ${b})`;
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
    const mode = e.target.value;
    if (mode === 'image') {
        document.getElementById('layerImageSection').style.display = 'block';
        document.getElementById('layerTextSection').style.display = 'none';
    } else {
        document.getElementById('layerImageSection').style.display = 'none';
        document.getElementById('layerTextSection').style.display = 'block';
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
    const existingLayers = canvasContainer.querySelectorAll('.ascii-layer');
    existingLayers.forEach(el => el.remove());

    // Render each visible layer
    layers.forEach(layer => {
        // Use editingState for active layer, saved layer for others
        const layerData = (layer.id === activeLayerId && editingState) ? editingState : layer;
        
        if (!layerData.visibility || !layerData.asciiArt) return;

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
            // Strip HTML tags from preview and show first 30 chars
            const asciiText = displayData.asciiArt ? displayData.asciiArt.replace(/<[^>]*>/g, '') : '';
            const preview = asciiText ? asciiText.substring(0, 30).replace(/\n/g, ' ') + '...' : '(empty)';
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
        
        if (editingState.contentType === 'image') {
            document.getElementById('layerImageSection').style.display = 'block';
            document.getElementById('layerTextSection').style.display = 'none';
        } else {
            document.getElementById('layerImageSection').style.display = 'none';
            document.getElementById('layerTextSection').style.display = 'block';
            layerTextarea.value = editingState.asciiArt;
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
    const hasLayers = layers.length > 0 && layers.some(l => l.asciiArt);
    exportBtn.disabled = !hasLayers;
}

function saveCurrentLayer() {
    if (!editingState || !activeLayerId) return;
    
    const layer = layers.find(l => l.id === activeLayerId);
    if (!layer) return;
    
    // Copy editingState to the layer
    layer.asciiArt = editingState.asciiArt;
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
    const visibleLayers = layers.filter(l => l.visibility && l.asciiArt);
    if (visibleLayers.length === 0) return;

    // Generate layers HTML
    let layersHTML = '';
    visibleLayers.forEach(layer => {
        const positionClass = `position-${layer.position}`;
        let content = '';
        
        if (layer.contentType === 'text') {
            content = `<span style="color: ${layer.color};">${layer.asciiArt}</span>`;
        } else {
            content = layer.asciiArt;
        }
        
        layersHTML += `        <div class="ascii-layer ${positionClass}" data-layer-id="${layer.id}" data-parallax="${layer.parallaxStrength}" data-offset-x="${layer.offsetX}" data-offset-y="${layer.offsetY}" data-scale="${layer.scale}" style="z-index: ${layer.zIndex}; font-size: ${layer.fontSize}px;">
${content}
        </div>\n`;
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
            font-family: 'Courier New', monospace;
            width: 100vw;
            height: 100vh;
            overflow: hidden;
        }
        
        .canvas-container {
            position: relative;
            width: 100%;
            height: 100%;
        }
        
        .ascii-layer {
            position: absolute;
            line-height: 1;
            white-space: pre;
            font-family: 'Courier New', monospace;
            transition: transform 0.05s ease-out;
        }
        
        .ascii-layer.position-top-left {
            top: 0;
            left: 0;
        }
        
        .ascii-layer.position-top-right {
            top: 0;
            right: 0;
        }
        
        .ascii-layer.position-bottom-left {
            bottom: 0;
            left: 0;
        }
        
        .ascii-layer.position-bottom-right {
            bottom: 0;
            right: 0;
        }
        
        .ascii-layer.position-center {
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
        let mouseX = 0.5;
        let mouseY = 0.5;
        let animationFrameId = null;

        // Get all layers and their properties
        const layers = Array.from(document.querySelectorAll('.ascii-layer')).map(layerDiv => ({
            element: layerDiv,
            parallaxStrength: parseFloat(layerDiv.dataset.parallax),
            offsetX: parseInt(layerDiv.dataset.offsetX),
            offsetY: parseInt(layerDiv.dataset.offsetY),
            scale: parseFloat(layerDiv.dataset.scale),
            position: layerDiv.className.match(/position-([\\w-]+)/)[1]
        }));

        // Mouse movement handler
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX / window.innerWidth;
            mouseY = e.clientY / window.innerHeight;
        });

        // Update layer transforms with parallax
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
                
                // Apply parallax offset
                const translateX = offsetX + (mouseX - 0.5) * parallaxStrength * 100;
                const translateY = offsetY + (mouseY - 0.5) * parallaxStrength * 100;
                
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

        // Start animation on page load
        animate();
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

