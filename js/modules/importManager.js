import { log, showToast } from './utils.js';
import { state } from './state.js';

const importManager = {
    processFile: async (file, resolvedElements) => {
        try {
            log(`Procesando archivo: ${file.name}`, 'info');
            showToast(null, 'Procesando archivo...');
            
            // Leer el archivo
            const data = await readFileAsync(file);
            
            // Procesar los datos según el tipo de archivo
            const extension = file.name.split('.').pop().toLowerCase();
            let records = [];
            
            if (extension === 'csv') {
                records = processCSV(data);
            } else if (['xlsx', 'xls'].includes(extension)) {
                records = processExcel(data);
            } else {
                throw new Error('Formato de archivo no soportado');
            }
            
            if (records.length === 0) {
                throw new Error('No se encontraron datos en el archivo');
            }
            
            log(`Se encontraron ${records.length} registros`, 'info');
            
            // Importar los datos a la aplicación
            await importDataToApp(records, resolvedElements);
            
            showToast(null, `Se importaron ${records.length} registros correctamente`);
            return true;
        } catch (error) {
            log(`Error al procesar archivo: ${error.message}`, 'error');
            showToast(null, `Error al importar: ${error.message}`);
            return false;
        }
    }
};

// Función para leer el archivo
function readFileAsync(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('Error al leer el archivo'));
        reader.readAsBinaryString(file);
    });
}

// Procesar archivos Excel/CSV (función común para ambos formatos)
function processExcel(data) {
    try {
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Usar encabezados para la conversión (crea objetos en lugar de arrays)
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Mostrar encabezados exactos para diagnóstico
        if (jsonData.length > 0) {
            const headers = Object.keys(jsonData[0]);
            log(`Encabezados exactos en el archivo: ${headers.join(', ')}`, 'info');
            
            // Verificar el formato de la descripción en el primer registro
            const firstRow = jsonData[0];
            for (const header of headers) {
                if (header.toLowerCase().includes('desc') || 
                    header.toLowerCase().includes('name') || 
                    header.toLowerCase().includes('product')) {
                    log(`Posible campo de descripción: ${header} = "${firstRow[header]}"`, 'info');
                }
            }
        }
        
        // Mostrar los encabezados disponibles para diagnóstico
        const availableHeaders = Object.keys(jsonData[0] || {});
        log(`Encabezados disponibles: ${availableHeaders.join(', ')}`, 'info');
        
        // Procesar utilizando los nombres de encabezado
        const processedRecords = [];
        
        for (const row of jsonData) {
            // Buscar valores en las columnas por nombre, con manejo de diferentes formatos
            const sku = findValueByHeader(row, ['SKU', 'sku', 'Sku', 'Product ID', 'ID']);
            const serialNumber = findValueByHeader(row, ['Serial Number', 'serial number', 'Serial', 'S/N']);
            const description = findValueByHeader(row, [
                'Description', 'description', 'Desc', 'Product Description', 
                'DESCRIPTION', 'DESC', 'Descripcion', 'Descripción', 'DESCRIPCION',
                'Product Name', 'Item Description', 'Name', 'ProductName',
                'DESC.', 'PROD_DESC', 'Item Name', 'Nombre Producto', 'Prod. Desc.',
                'Producto', 'Artículo', 'Item', 'Articulo', 'Ítem', 'Item Name',
                'Prod Desc', 'Product Desc', 'Prodesc', 'Prod.'
            ]);
            
            // Agregar log para diagnóstico
            if (description) {
                log(`Descripción encontrada para SKU ${sku}: "${description}"`, 'debug');
            } else {
                log(`No se encontró descripción para SKU ${sku}. Encabezados disponibles: ${Object.keys(row).join(', ')}`, 'debug');
            }
            
            if (sku) { // Solo incluimos registros con SKU
                // Formatear el número de serie anteponiendo "S/N: " solo si existe
                const formattedSerialNumber = serialNumber 
                    ? `S/N: ${String(serialNumber).trim()}` 
                    : '';
                
                // Convertir texto descriptivo a mayúsculas al importar
                const upperCaseDescription = description 
                    ? String(description).trim().toUpperCase() 
                    : '';
                
                processedRecords.push({
                    barcodeData: String(sku).trim(),
                    additionalData: formattedSerialNumber,
                    labelText: upperCaseDescription
                });
            }
        }
        
        log(`Procesados ${processedRecords.length} registros con encabezados`, 'info');
        
        // Mostrar algunas muestras para depuración
        if (processedRecords.length > 0) {
            log(`Muestra de registros procesados:`, 'info');
            for (let i = 0; i < Math.min(3, processedRecords.length); i++) {
                log(`[${i}] SKU: ${processedRecords[i].barcodeData}, Serial: ${processedRecords[i].additionalData}, Desc: ${processedRecords[i].labelText}`, 'info');
            }
        }
        
        return processedRecords;
    } catch (error) {
        log(`Error procesando archivo: ${error.message}`, 'error');
        throw new Error('Error al procesar el archivo');
    }
}

// Función auxiliar para buscar valores por diferentes variantes del nombre de encabezado
function findValueByHeader(row, possibleHeaders) {
    // 1. Buscar coincidencia exacta
    for (const header of possibleHeaders) {
        if (row[header] !== undefined) {
            return row[header];
        }
    }
    
    // 2. Buscar coincidencia insensible a mayúsculas/minúsculas
    const rowKeys = Object.keys(row);
    for (const possibleHeader of possibleHeaders) {
        const lowerPossibleHeader = possibleHeader.toLowerCase();
        for (const key of rowKeys) {
            if (key.toLowerCase() === lowerPossibleHeader) {
                return row[key];
            }
        }
    }
    
    // 3. Buscar coincidencia parcial
    for (const possibleHeader of possibleHeaders) {
        const lowerPossibleHeader = possibleHeader.toLowerCase();
        for (const key of rowKeys) {
            if (key.toLowerCase().includes(lowerPossibleHeader) || 
                lowerPossibleHeader.includes(key.toLowerCase())) {
                return row[key];
            }
        }
    }
    
    return null;
}

// Alias para mantener compatibilidad, pero ahora simplemente llama a processExcel
const processCSV = processExcel;

// Importar los datos a la aplicación
async function importDataToApp(records, resolvedElements) {
    if (!records || records.length === 0) {
        return;
    }
    
    // Marcar que los datos provienen de importación
    state.dataFromImport = true;
    
    // Verificar que estamos recibiendo múltiples registros
    log(`Procesando ${records.length} registros para importación`, 'info');
    
    // Guardar TODOS los registros en lotsPreviewsData
    state.lotsPreviewsData = [];
    records.forEach(record => {
        state.lotsPreviewsData.push({
            barcodeData: record.barcodeData || '',
            additionalData: record.additionalData || '',
            labelText: record.labelText || ''
        });
    });
    
    log(`Guardados ${state.lotsPreviewsData.length} registros en state.lotsPreviewsData`, 'info');
    
    // Actualizar el PRIMER registro en los campos de entrada
    if (records[0]) {
        resolvedElements.lotsDataInput.value = records[0].barcodeData || '';
        resolvedElements.lotsAdditionalData.value = records[0].additionalData || '';
        
        if (records[0].labelText) {
            resolvedElements.lotsLabelTextInput.value = records[0].labelText;
        }
    }
    
    // Actualizar contadores de texto
    if (resolvedElements.lotsDataInput.dispatchEvent) {
        resolvedElements.lotsDataInput.dispatchEvent(new Event('input'));
        resolvedElements.lotsAdditionalData.dispatchEvent(new Event('input'));
        resolvedElements.lotsLabelTextInput.dispatchEvent(new Event('input'));
    }
    
    // Resetear índice de vista previa
    state.currentPreviewIndexLots = 0;
    
    // Hacer visible la navegación de lotes
    resolvedElements.previewNavigation.classList.add('visible');
    
    // Activar botón de generación de lotes
    resolvedElements.generateBatchBtn.classList.add('visible-in-batch');
    
    // Actualizar contador de vista previa - IMPORTANTE mostrar el total correcto
    resolvedElements.previewCounter.textContent = `1 / ${state.lotsPreviewsData.length}`;
    
    // Actualizar botones de navegación
    updateNavigationButtons(resolvedElements);
}

// Actualizar estado de botones de navegación
function updateNavigationButtons(resolvedElements) {
    const totalPreviews = state.lotsPreviewsData.length;
    const currentIndex = state.currentPreviewIndexLots;
    
    resolvedElements.prevPreviewBtn.disabled = currentIndex === 0;
    resolvedElements.nextPreviewBtn.disabled = currentIndex === totalPreviews - 1;
    resolvedElements.firstPreviewBtn.disabled = currentIndex === 0;
    resolvedElements.lastPreviewBtn.disabled = currentIndex === totalPreviews - 1;
}

export { importManager };