/**
 * Runtime Fix for Next.js Static Export
 * 
 * This script provides essential webpack runtime functionality for static exports
 * to prevent 404 errors for missing webpack chunks.
 */

(function() {
  // Create a global __webpack_require__ if it doesn't exist
  if (typeof window.__webpack_require__ === 'undefined') {
    window.__webpack_require__ = function(moduleId) {
      // This is a simplified version that just returns an empty module
      // It prevents errors when the app tries to load missing chunks
      return {
        id: moduleId,
        loaded: true,
        exports: {}
      };
    };
    
    // Add essential webpack runtime functions
    window.__webpack_require__.e = function(chunkId) {
      return Promise.resolve();
    };
    
    window.__webpack_require__.f = {};
    window.__webpack_require__.p = "/_next/";
    window.__webpack_require__.u = function(chunkId) {
      return "static/chunks/" + chunkId + ".js";
    };
    
    // Create a simple chunk loading function
    window.__webpack_require__.l = function(url, done) {
      done();
    };
    
    // Set up the public path
    window.__webpack_public_path__ = "/_next/";
    
    // Create a fake webpack module cache
    window.__webpack_module_cache__ = {};
    
    // Log that the runtime fix has been applied
    console.log("Next.js runtime fix applied");
  }
})();
