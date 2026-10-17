import { LiveArtifact } from "../types";

export interface ArtifactLogMessage {
  id: string;
  level: "log" | "info" | "warn" | "error";
  text: string;
  timestamp: string;
}

/**
 * Builds a complete self-contained HTML page for the sandboxed iframe.
 * Seamlessly compiles React (JSX/TSX), executes HTML/JS, or renders SVG.
 */
export function generateSandboxHtml(artifact: LiveArtifact, theme: "dark" | "light" = "dark"): string {
  const { type, code, title } = artifact;

  if (type === "svg") {
    return generateSvgHtml(code, title, theme);
  }

  if (type === "react") {
    return generateReactHtml(code, title, theme);
  }

  // Standard HTML / JS / Web
  return generateStandardHtml(code, title, theme);
}

/**
 * Generates an interactive preview wrapper for SVG artifacts
 */
function generateSvgHtml(svgCode: string, title: string, theme: "dark" | "light"): string {
  const isDark = theme === "dark";
  const bgClass = isDark ? "bg-neutral-950 text-neutral-100" : "bg-neutral-50 text-neutral-900";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { margin: 0; padding: 2rem; display: flex; align-items: center; justify-content: center; min-height: 100vh; overflow: auto; }
    svg { max-width: 100%; max-height: 80vh; height: auto; }
  </style>
</head>
<body class="${bgClass}">
  <div class="flex flex-col items-center justify-center p-6 border rounded-2xl shadow-xl transition-all ${
    isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-neutral-200"
  }">
    ${svgCode}
  </div>
</body>
</html>`;
}

/**
 * Generates an execution wrapper for React (TSX/JSX) components
 */
function generateReactHtml(rawCode: string, title: string, theme: "dark" | "light"): string {
  const isDark = theme === "dark";
  const bgClass = isDark ? "bg-neutral-950 text-neutral-100" : "bg-neutral-50 text-neutral-900";

  // Preprocess React code: strip import statements and identify component name
  const { transformedCode, componentName } = preprocessReactCode(rawCode);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
            mono: ['JetBrains Mono', 'monospace'],
          }
        }
      }
    };
  </script>

  <!-- React 18 & ReactDOM -->
  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>

  <!-- Babel Standalone for live JSX/TSX compilation -->
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

  <style>
    body {
      margin: 0;
      padding: 0;
      min-height: 100vh;
      font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
      box-sizing: border-box;
    }
    #error-display {
      display: none;
      padding: 1.5rem;
      margin: 1.5rem;
      border-radius: 1rem;
      background: #450a0a;
      border: 1px solid #dc2626;
      color: #fecaca;
      font-family: monospace;
      font-size: 0.825rem;
      line-height: 1.5;
      white-space: pre-wrap;
    }
  </style>
</head>
<body class="${bgClass} ${isDark ? "dark" : ""}">
  <div id="error-display"></div>
  <div id="root">
    <div style="min-height:100vh; display:flex; align-items:center; justify-content:center; flex-direction:column; gap:0.75rem; color:#888; font-family:sans-serif; font-size:13px;">
      <div style="width:28px; height:28px; border:2px solid #6366f1; border-top-color:transparent; border-radius:50%; animation:spin 0.8s linear infinite;"></div>
      <span>Mounting Live React Artifact...</span>
    </div>
  </div>

  <style>
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  </style>

  <!-- Console Log & Error Interceptor -->
  <script>
    (function() {
      const postLog = (level, args) => {
        try {
          const text = Array.from(args).map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ');
          window.parent.postMessage({ type: 'NEXA_ARTIFACT_LOG', level, text, timestamp: new Date().toLocaleTimeString() }, '*');
        } catch(e) {}
      };

      const originalLog = console.log;
      const originalWarn = console.warn;
      const originalError = console.error;
      const originalInfo = console.info;

      console.log = (...args) => { originalLog.apply(console, args); postLog('log', args); };
      console.warn = (...args) => { originalWarn.apply(console, args); postLog('warn', args); };
      console.error = (...args) => { originalError.apply(console, args); postLog('error', args); };
      console.info = (...args) => { originalInfo.apply(console, args); postLog('info', args); };

      window.onerror = function(msg, url, line, col, err) {
        const errorText = 'Runtime Error: ' + msg + (line ? ' (Line: ' + line + ')' : '');
        postLog('error', [errorText]);
        const errDisplay = document.getElementById('error-display');
        if (errDisplay) {
          errDisplay.style.display = 'block';
          errDisplay.textContent = errorText;
        }
        return false;
      };
    })();
  </script>

  <!-- Built-in Icon & React Helper Proxy -->
  <script>
    // Universal icon proxy so lucide-react imports or <Icon /> calls don't crash
    window.LucideIcons = new Proxy({}, {
      get: function(target, prop) {
        return function(props) {
          const size = props?.size || 18;
          const className = props?.className || '';
          return React.createElement('svg', {
            xmlns: 'http://www.w3.org/2000/svg',
            width: size,
            height: size,
            viewBox: '0 0 24 24',
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth: '2',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            className: className,
            ...props
          }, React.createElement('circle', { cx: 12, cy: 12, r: 9 }));
        };
      }
    });
  </script>

  <!-- React Artifact Script -->
  <script type="text/babel" data-presets="react,env">
    const { useState, useEffect, useRef, useMemo, useCallback, useId, useReducer } = React;

    // React Error Boundary
    class ArtifactErrorBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
      }
      static getDerivedStateFromError(error) {
        return { hasError: true, error };
      }
      componentDidCatch(error, errorInfo) {
        console.error("Artifact Render Fault:", error, errorInfo);
      }
      render() {
        if (this.state.hasError) {
          return (
            <div className="p-6 m-4 rounded-2xl bg-rose-950/70 border border-rose-800 text-rose-200 font-sans text-xs">
              <div className="flex items-center gap-2 mb-2 font-bold text-sm text-rose-300">
                <span>⚠️ Live Component Error</span>
              </div>
              <p className="font-mono bg-rose-900/40 p-3 rounded-lg border border-rose-800/60 overflow-x-auto">
                {this.state.error?.message || "An unexpected error occurred in this React component."}
              </p>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="mt-3 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold transition-colors"
              >
                Retry Render
              </button>
            </div>
          );
        }
        return this.props.children;
      }
    }

    try {
      ${transformedCode}

      // Mount Target Component
      const TargetComponent = typeof ${componentName} !== 'undefined' ? ${componentName} : (typeof App !== 'undefined' ? App : null);

      if (TargetComponent) {
        const rootElement = document.getElementById('root');
        const root = ReactDOM.createRoot(rootElement);
        root.render(
          React.createElement(ArtifactErrorBoundary, null, React.createElement(TargetComponent))
        );
      } else {
        console.error("Could not find root component (${componentName}) to mount.");
      }
    } catch (compErr) {
      console.error("Artifact Compilation Error:", compErr);
      const errDisplay = document.getElementById('error-display');
      if (errDisplay) {
        errDisplay.style.display = 'block';
        errDisplay.textContent = 'Artifact Compilation Error:\\n' + compErr.message;
      }
    }
  </script>
</body>
</html>`;
}

/**
 * Generates an execution wrapper for HTML / CSS / JS applications
 */
function generateStandardHtml(rawCode: string, title: string, theme: "dark" | "light"): string {
  const isDark = theme === "dark";
  const bgClass = isDark ? "bg-neutral-950 text-neutral-100" : "bg-neutral-50 text-neutral-900";

  // Check if complete HTML document
  const isCompleteDoc = /<html/i.test(rawCode) && /<\/html>/i.test(rawCode);

  const consoleInterceptor = `
  <script>
    (function() {
      const postLog = (level, args) => {
        try {
          const text = Array.from(args).map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ');
          window.parent.postMessage({ type: 'NEXA_ARTIFACT_LOG', level, text, timestamp: new Date().toLocaleTimeString() }, '*');
        } catch(e) {}
      };
      const originalLog = console.log;
      const originalWarn = console.warn;
      const originalError = console.error;
      const originalInfo = console.info;

      console.log = (...args) => { originalLog.apply(console, args); postLog('log', args); };
      console.warn = (...args) => { originalWarn.apply(console, args); postLog('warn', args); };
      console.error = (...args) => { originalError.apply(console, args); postLog('error', args); };
      console.info = (...args) => { originalInfo.apply(console, args); postLog('info', args); };

      window.onerror = function(msg, url, line) {
        postLog('error', ['Runtime Error: ' + msg + (line ? ' (Line: ' + line + ')' : '')]);
      };
    })();
  </script>
  `;

  if (isCompleteDoc) {
    // Inject Tailwind and console logger into the head
    let modified = rawCode;
    if (modified.includes("<head>")) {
      modified = modified.replace(
        "<head>",
        `<head>\n<script src="https://cdn.tailwindcss.com"></script>\n${consoleInterceptor}`
      );
    } else {
      modified = `<script src="https://cdn.tailwindcss.com"></script>\n${consoleInterceptor}\n` + modified;
    }
    return modified;
  }

  // Fragment: wrap in standard responsive shell
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
    };
  </script>
  ${consoleInterceptor}
  <style>
    body {
      margin: 0;
      padding: 1.5rem;
      min-height: 100vh;
      font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
      box-sizing: border-box;
    }
  </style>
</head>
<body class="${bgClass} ${isDark ? "dark" : ""}">
  ${rawCode}
</body>
</html>`;
}

/**
 * Preprocesses React code from markdown to make it runnable in browser Babel Standalone
 */
function preprocessReactCode(code: string): { transformedCode: string; componentName: string } {
  let transformed = code;

  // 1. Remove standard module imports
  transformed = transformed.replace(/import\s+React(?:\s*,\s*\{[^}]*\})?\s+from\s+['"][^'"]+['"];?/g, "");
  transformed = transformed.replace(/import\s+\{[^}]*\}\s+from\s+['"]react['"];?/g, "");
  transformed = transformed.replace(/import\s+\{[^}]*\}\s+from\s+['"]lucide-react['"];?/g, "");
  transformed = transformed.replace(/import\s+[^;]+from\s+['"][^'"]+['"];?/g, "");

  // 2. Identify target component name
  let componentName = "App";

  // Check `export default function ComponentName`
  const exportDefaultFuncMatch = /export\s+default\s+function\s+([A-Z]\w*)/.exec(transformed);
  if (exportDefaultFuncMatch) {
    componentName = exportDefaultFuncMatch[1];
    transformed = transformed.replace(/export\s+default\s+function\s+([A-Z]\w*)/, "function $1");
  } else {
    // Check `export default ComponentName;`
    const exportDefaultVarMatch = /export\s+default\s+([A-Z]\w*)\s*;?/.exec(transformed);
    if (exportDefaultVarMatch) {
      componentName = exportDefaultVarMatch[1];
      transformed = transformed.replace(/export\s+default\s+[A-Z]\w*\s*;?/, "");
    } else {
      // Find top-level PascalCase function or const
      const funcMatch = /(?:function|const)\s+([A-Z]\w*)\s*(?:=|\()/.exec(transformed);
      if (funcMatch) {
        componentName = funcMatch[1];
      }
    }
  }

  // Strip remaining export statements
  transformed = transformed.replace(/export\s+(?:default\s+)?/g, "");

  return { transformedCode: transformed, componentName };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
