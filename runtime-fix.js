/**
 * Webpack Runtime Fix for Cloudflare Pages
 * 
 * This script provides a minimal webpack runtime implementation to prevent 404 errors
 * for missing webpack chunks in Cloudflare Pages deployments.
 */

(function() {
  console.log('[Runtime Fix] Initializing webpack runtime fix');
  
  // Store the original __webpack_require__ if it exists
  const originalRequire = window.__webpack_require__;
  
  // Create a minimal webpack runtime implementation
  window.__webpack_require__ = function(moduleId) {
    // If the original require exists and the module is available, use it
    if (originalRequire && originalRequire.m && originalRequire.m[moduleId]) {
      return originalRequire(moduleId);
    }
    
    // Otherwise, return an empty module to prevent errors
    console.warn(`[Runtime Fix] Module ${moduleId} not found, returning empty module`);
    return {};
  };
  
  // Copy properties from the original require
  if (originalRequire) {
    for (const key in originalRequire) {
      if (Object.prototype.hasOwnProperty.call(originalRequire, key)) {
        window.__webpack_require__[key] = originalRequire[key];
      }
    }
  }
  
  // Add minimal webpack runtime functions
  window.__webpack_require__.m = window.__webpack_require__.m || {};
  window.__webpack_require__.c = window.__webpack_require__.c || {};
  window.__webpack_require__.d = window.__webpack_require__.d || function(exports, definition) {
    for(var key in definition) {
      Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
    }
  };
  window.__webpack_require__.r = window.__webpack_require__.r || function(exports) {
    Object.defineProperty(exports, '__esModule', { value: true });
  };
  window.__webpack_require__.n = window.__webpack_require__.n || function(module) {
    var getter = module && module.__esModule ?
      function getDefault() { return module['default']; } :
      function getModuleExports() { return module; };
    window.__webpack_require__.d(getter, { a: getter });
    return getter;
  };
  
  // Handle chunk loading (prevent 404 errors)
  window.__webpack_require__.e = window.__webpack_require__.e || function(chunkId) {
    console.log(`[Runtime Fix] Handling chunk request: ${chunkId}`);
    return Promise.resolve();
  };
  
  console.log('[Runtime Fix] Webpack runtime fix initialized');
})();
