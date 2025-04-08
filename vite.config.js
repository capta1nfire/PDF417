// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
    root: './', // La raíz del proyecto es el directorio actual
    server: {
        open: true // Abre el navegador automáticamente al iniciar el servidor de desarrollo
    },
    build: {
        outDir: 'dist', // Carpeta de salida para los archivos empaquetados
        rollupOptions: {
            input: './index.html' // Punto de entrada principal
        }
    }
});