import 'jest-canvas-mock';

// No reemplazar todo el objeto process, solo agregar lo necesario
if (typeof process.env === 'undefined') {
  process.env = {};
}
process.env.NODE_ENV = 'test';

// Añadir soporte para isTTY si no existe
if (typeof process.stdout === 'undefined') {
  process.stdout = {};
}
if (process.stdout && typeof process.stdout.isTTY === 'undefined') {
  process.stdout.isTTY = true;
}