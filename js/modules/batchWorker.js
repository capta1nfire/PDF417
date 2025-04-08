// js/modules/batchWorker.js
importScripts(
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
);

self.addEventListener('message', async (e) => {
    if (e.data.action === 'generatePDF') {
        try {
            const { barcodeData } = e.data;
            const { jsPDF } = jspdf;

            // Configuración básica (simulada, ya que no tenemos DOM real en el worker)
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'in',
                format: [4, 6] // Dimensiones predeterminadas
            });

            // Simulamos el renderizado del barcode (en producción, necesitarías pasar el canvas pre-renderizado)
            pdf.text(`Barcode: ${barcodeData}`, 0.5, 0.5);

            const pdfData = pdf.output('arraybuffer');
            self.postMessage({ action: 'pdfGenerated', pdfData });
        } catch (error) {
            self.postMessage({ action: 'error', message: error.message });
        }
    }
});