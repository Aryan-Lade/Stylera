// Stylera Content Script
// Handles floating trigger, draggable/resizable modal container, dragstart interceptors, and hover buttons
import { APP_CONFIG } from '../shared/constants';
import { extractProductFromElement } from './adapters';

let isIframeMounted = false;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let initialLeft = 0;
let initialTop = 0;

function createFloatingButton() {
  if (document.getElementById('stylera-floating-trigger')) return;

  const btn = document.createElement('button');
  btn.id = 'stylera-floating-trigger';
  btn.className = 'stylera-launcher-btn';
  btn.innerHTML = `
    <span class="stylera-launcher-icon">✨</span>
    <span class="stylera-launcher-label">Try On</span>
  `;
  btn.title = 'Open Stylera Virtual Try-On';
  btn.addEventListener('click', toggleTryOnModal);
  document.body.appendChild(btn);
}

function createModalContainer(): HTMLElement {
  const container = document.createElement('div');
  container.id = APP_CONFIG.containerId;
  container.className = 'stylera-modal-container';

  // Draggable Header Drag Bar
  const dragBar = document.createElement('div');
  dragBar.className = 'stylera-drag-handle';
  dragBar.title = 'Drag to move Stylera window';

  const grip = document.createElement('div');
  grip.className = 'stylera-grip-dots';
  dragBar.appendChild(grip);

  // Resize Handle (bottom-right)
  const resizeHandle = document.createElement('div');
  resizeHandle.className = 'stylera-resize-handle';
  resizeHandle.title = 'Drag to resize window';

  const iframe = document.createElement('iframe');
  iframe.id = APP_CONFIG.iframeId;
  iframe.src = chrome.runtime.getURL('src/tryon-app/index.html');
  iframe.setAttribute('allow', 'camera; microphone; display-capture');
  iframe.className = 'stylera-tryon-frame';

  container.appendChild(dragBar);
  container.appendChild(iframe);
  container.appendChild(resizeHandle);
  document.body.appendChild(container);

  // Setup dragging
  dragBar.addEventListener('mousedown', (e) => {
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    const rect = container.getBoundingClientRect();
    initialLeft = rect.left;
    initialTop = rect.top;

    container.style.right = 'auto';
    container.style.bottom = 'auto';
    container.style.left = `${initialLeft}px`;
    container.style.top = `${initialTop}px`;

    const onMouseMove = (moveEv: MouseEvent) => {
      if (!isDragging) return;
      const dx = moveEv.clientX - dragStartX;
      const dy = moveEv.clientY - dragStartY;
      container.style.left = `${Math.max(10, Math.min(window.innerWidth - 100, initialLeft + dx))}px`;
      container.style.top = `${Math.max(10, Math.min(window.innerHeight - 100, initialTop + dy))}px`;
    };

    const onMouseUp = () => {
      isDragging = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });

  // Setup resizing
  let isResizing = false;
  let resizeStartX = 0;
  let resizeStartY = 0;
  let startWidth = 0;
  let startHeight = 0;

  resizeHandle.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    isResizing = true;
    resizeStartX = e.clientX;
    resizeStartY = e.clientY;
    const rect = container.getBoundingClientRect();
    startWidth = rect.width;
    startHeight = rect.height;

    const onResizeMove = (moveEv: MouseEvent) => {
      if (!isResizing) return;
      const dx = moveEv.clientX - resizeStartX;
      const dy = moveEv.clientY - resizeStartY;
      const newWidth = Math.max(320, Math.min(800, startWidth + dx));
      const newHeight = Math.max(480, Math.min(1000, startHeight + dy));
      container.style.width = `${newWidth}px`;
      container.style.height = `${newHeight}px`;
    };

    const onResizeUp = () => {
      isResizing = false;
      document.removeEventListener('mousemove', onResizeMove);
      document.removeEventListener('mouseup', onResizeUp);
    };

    document.addEventListener('mousemove', onResizeMove);
    document.addEventListener('mouseup', onResizeUp);
  });

  return container;
}

function toggleTryOnModal() {
  let container = document.getElementById(APP_CONFIG.containerId);
  if (container) {
    if (container.style.display === 'none') {
      container.style.display = 'flex';
    } else {
      container.style.display = 'none';
      const iframe = document.getElementById(APP_CONFIG.iframeId) as HTMLIFrameElement | null;
      iframe?.contentWindow?.postMessage({ type: 'STYLERIA_PARENT_CLOSED' }, '*');
    }
    return;
  }

  container = createModalContainer();
  container.style.display = 'flex';
  isIframeMounted = true;
}

// Attach Drag & Drop interceptors across page
function setupDragInterceptors() {
  document.addEventListener(
    'dragstart',
    (e: DragEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const metadata = extractProductFromElement(target);
      if (metadata && metadata.imageUrl) {
        if (e.dataTransfer) {
          e.dataTransfer.setData('text/uri-list', metadata.imageUrl);
          e.dataTransfer.setData('text/plain', metadata.imageUrl);
          e.dataTransfer.setData('application/json', JSON.stringify(metadata));
        }

        // Auto-reveal the Try-On window if hidden so the user can drop into it
        let container = document.getElementById(APP_CONFIG.containerId);
        if (!container) {
          container = createModalContainer();
          isIframeMounted = true;
        }
        container.style.display = 'flex';
      }
    },
    true
  );
}

// Inject hover "Try On" buttons on product images
function setupHoverButtons() {
  const processedElements = new WeakSet<HTMLElement>();

  const scanForProducts = () => {
    const images = document.querySelectorAll<HTMLElement>(
      '.product-base, .pdp-image-container, .product-sliderContainer, .product-card, img[src*="myntassets"], img[src*="ajio"]'
    );

    images.forEach((item) => {
      if (processedElements.has(item)) return;
      processedElements.add(item);

      item.style.position = 'relative';

      // Attach button on hover
      item.addEventListener('mouseenter', () => {
        if (item.querySelector('.stylera-hover-tryon-btn')) return;

        const hoverBtn = document.createElement('button');
        hoverBtn.className = 'stylera-hover-tryon-btn';
        hoverBtn.innerHTML = `<span>✨ Try On</span>`;
        hoverBtn.addEventListener('click', (ev) => {
          ev.stopPropagation();
          ev.preventDefault();

          const meta = extractProductFromElement(item);
          if (meta) {
            if (!document.getElementById(APP_CONFIG.containerId)) {
              toggleTryOnModal();
            }
            const iframe = document.getElementById(APP_CONFIG.iframeId) as HTMLIFrameElement | null;
            iframe?.contentWindow?.postMessage({ type: 'INGEST_IMAGE_URL', payload: meta }, '*');
          }
        });

        item.appendChild(hoverBtn);
      });

      item.addEventListener('mouseleave', () => {
        const btn = item.querySelector('.stylera-hover-tryon-btn');
        btn?.remove();
      });
    });
  };

  scanForProducts();
  setInterval(scanForProducts, 2500);
}

// Window messages from iframe
window.addEventListener('message', (event) => {
  const container = document.getElementById(APP_CONFIG.containerId);
  if (!container) return;

  if (event.data?.type === 'STYLERIA_CLOSE_MODAL') {
    container.style.display = 'none';
    const iframe = document.getElementById(APP_CONFIG.iframeId) as HTMLIFrameElement | null;
    iframe?.contentWindow?.postMessage({ type: 'STYLERIA_PARENT_CLOSED' }, '*');
  } else if (event.data?.type === 'STYLERIA_TOGGLE_MINIMIZE') {
    if (event.data.minimized) {
      container.classList.add('stylera-minimized');
    } else {
      container.classList.remove('stylera-minimized');
    }
  }
});

// Runtime messages from background service worker
chrome.runtime.onMessage.addListener((msg, _sender, _sendResponse) => {
  if (msg.type === 'TOGGLE_TRYON_MODAL') {
    toggleTryOnModal();
  } else if (msg.type === 'STYLERIA_CONTEXT_TRYON') {
    if (!isIframeMounted) {
      toggleTryOnModal();
    }
    const iframe = document.getElementById(APP_CONFIG.iframeId) as HTMLIFrameElement | null;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'INGEST_IMAGE_URL', url: msg.imageUrl }, '*');
    }
  }
});

// Auto-inject
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    createFloatingButton();
    setupDragInterceptors();
    setupHoverButtons();
  });
} else {
  createFloatingButton();
  setupDragInterceptors();
  setupHoverButtons();
}

// Close modal when Escape key is pressed
