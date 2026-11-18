import {defineConfig} from 'vite';
export default defineConfig({optimizeDeps:{include:['three','three/examples/jsm/controls/OrbitControls.js']},server:{proxy:{'/api':{target:'http://127.0.0.1:8000',changeOrigin:true}}},build:{rollupOptions:{onwarn(warning,warn){if(warning.code==='MODULE_LEVEL_DIRECTIVE')return;warn(warning)}}}});
