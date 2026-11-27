#!/usr/bin/env node
'use strict';

// Importación controlada de las diez tablas históricas. SQLite siempre se abre
// con readonly=true; nunca se ejecuta una sentencia de escritura sobre el origen.
require('dotenv').config({ quiet: true });
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');
const { Pool } = require('pg');

const TABLAS = [
  ['usuarios', 7], ['programas', 6], ['estudiantes', 6],
  ['plantillas_requisito', 6], ['solicitudes', 12],
  ['validaciones_requisito', 11], ['documentos_solicitud', 17],
  ['revisiones', 34], ['historial_estados', 56], ['auditoria', 68],
];
const BOOLS = new Set(['activo', 'obligatorio', 'puedeAprobar', 'habilitadoTramites']);

function argumentos(argv) {
  const result = { dryRun: false, confirmado: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run') result.dryRun = true;
    else if (arg === '--confirmado-migra') result.confirmado = true;
    else if (arg === '--origen' || arg === '--origen-archivos') {
      const value = argv[++i];
      if (!value || value.startsWith('--')) throw new Error(`Falta el valor de ${arg}.`);
      result[arg === '--origen' ? 'origen' : 'archivos'] = path.resolve(value);
    } else throw new Error(`Argumento no reconocido: ${arg}`);
  }
  if (!result.origen || !result.archivos) {
    throw new Error('Uso: node scripts/migrar-datos.js --origen <grados.sqlite> --origen-archivos <directorio> [--dry-run]');
  }
  if (!result.dryRun && !result.confirmado) {
    throw new Error('La carga requiere --confirmado-migra, solo después de la confirmación explícita del responsable.');
  }
  return result;
}

function safeName(name) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) throw new Error('Nombre de columna no permitido.');
  return `"${name}"`;
}

function canonical(value, column, pgType) {
  if (value === null || value === undefined) return null;
  if (BOOLS.has(column) || pgType === 'boolean') return value === true || value === 1 || value === '1';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string' && (/(?:timestamp|date|time)/i.test(pgType || '') || /(?:En|fecha|Fecha)$/.test(column)) && value !== '') {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) throw new Error('Fecha inválida en el origen.');
    return parsed.toISOString();
  }
  if (typeof value === 'object' && !Buffer.isBuffer(value)) return sortObject(value);
  return value;
}

function sortObject(value) {
  if (Array.isArray(value)) return value.map(sortObject);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, sortObject(value[key])]));
}

function hashRows(rows, columns, table) {
  const usable = columns.filter(column => !(table === 'usuarios' && column.name === 'password'));
  const ordered = [...rows].sort((a, b) => Number(a.id) - Number(b.id));
  const summary = ordered.map(row => usable.map(column => canonical(row[column.name], column.name, column.type)));
  return crypto.createHash('sha256').update(JSON.stringify(summary), 'utf8').digest('hex');
}

function convertir(row, columns) {
  const result = { ...row };
  for (const column of columns) {
    const value = result[column.name];
    if (value === null || value === undefined) continue;
    if (BOOLS.has(column.name) || column.type === 'boolean') {
      if (![0, 1, true, false, '0', '1'].includes(value)) throw new Error(`Booleano inválido en ${column.name}.`);
      result[column.name] = value === true || value === 1 || value === '1';
    } else if (/timestamp|date|time/i.test(column.type) || /(?:En|fecha|Fecha)$/.test(column.name)) {
      const date = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(date.getTime())) throw new Error(`Fecha inválida en ${column.name}.`);
      result[column.name] = date;
    }
    if (column.name === 'rutaArchivo') result[column.name] = path.basename(String(value));
  }
  return result;
}

function loadSqlite(db) {
  const data = new Map();
  for (const [table, expected] of TABLAS) {
    const exists = db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(table);
    if (!exists) throw new Error(`Falta tabla de origen ${table}.`);
    const columns = db.prepare(`PRAGMA table_info(${safeName(table)})`).all().map(c => ({ name: c.name, type: /INT|BOOL/i.test(c.type) && /BOOL/i.test(c.type) ? 'boolean' : c.type.toLowerCase() }));
    if (!columns.some(c => c.name === 'id')) throw new Error(`Falta clave primaria id en ${table}.`);
    const rows = db.prepare(`SELECT * FROM ${safeName(table)} ORDER BY id`).all();
    data.set(table, { rows, columns, expected });
  }
  return data;
}

async function pgMetadata(client, table) {
  const result = await client.query(
    'SELECT column_name, data_type, is_identity, column_default FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = $1 ORDER BY ordinal_position',
    [table],
  );
  if (!result.rows.some(c => c.column_name === 'id')) throw new Error(`Falta tabla o clave id en destino: ${table}.`);
  return result.rows.map(c => ({ name: c.column_name, type: c.data_type, isIdentity: c.is_identity === 'YES', default: c.column_default }));
}

async function readTarget(client, table, columns) {
  const result = await client.query(`SELECT ${columns.map(c => safeName(c.name)).join(', ')} FROM ${safeName(table)} ORDER BY "id"`);
  return result.rows;
}

async function report({ source, client, dryRun }) {
  const rows = [];
  for (const [table, expected] of TABLAS) {
    const src = source.get(table);
    const cols = await pgMetadata(client, table);
    const destCount = Number((await client.query(`SELECT count(*)::int AS n FROM ${safeName(table)}`)).rows[0].n);
    const targetRows = await readTarget(client, table, cols);
    const shared = src.columns.filter(c => cols.some(target => target.name === c.name));
    const comparableTarget = cols.filter(c => shared.some(sourceColumn => sourceColumn.name === c.name));
    rows.push({ table, expected, origen: src.rows.length, destino: destCount,
      origenValido: src.rows.length === expected, destinoVacio: destCount === 0,
      hashOrigen: hashRows(src.rows, shared, table),
      hashDestino: hashRows(targetRows, comparableTarget, table),
      destColumns: cols, destRows: targetRows });
  }
  return rows;
}

function imprimir(rows, dryRun) {
  console.log(`Modo: ${dryRun ? 'DRY-RUN (solo lectura; sin escritura)' : 'MIGRACIÓN'}`);
  console.log('Tabla | Esperado | Origen | Destino | SHA-256 origen (usuarios excluye password) | SHA-256 destino');
  for (const row of rows) console.log(`${row.table} | ${row.expected} | ${row.origen} | ${row.destino} | ${row.hashOrigen} | ${row.hashDestino}`);
}

async function migrate(client, source, preflight, filesDir) {
  const copied = [];
  await client.query('BEGIN');
  try {
    const current = await report({ source, client, dryRun: true });
    for (const row of current) if (row.destino !== 0) throw new Error(`Destino dejó de estar vacío en ${row.table}; abortado sin insertar.`);
    for (const [table] of TABLAS) {
      const src = source.get(table);
      const targetCols = preflight.find(item => item.table === table).destColumns;
      const columns = src.columns.filter(c => targetCols.some(target => target.name === c.name));
      const rows = src.rows.map(item => convertir(item, columns));
      for (const row of rows) {
        const names = Object.keys(row).filter(name => columns.some(c => c.name === name));
        const values = names.map(name => row[name]);
        const placeholders = names.map((_, i) => `$${i + 1}`);
        await client.query(`INSERT INTO ${safeName(table)} (${names.map(safeName).join(', ')}) VALUES (${placeholders.join(', ')})`, values);
      }
      await client.query(`SELECT setval(pg_get_serial_sequence($1, 'id'), COALESCE((SELECT MAX(id) FROM ${safeName(table)}), 1), EXISTS(SELECT 1 FROM ${safeName(table)}))`, [table]);
    }
    const after = await report({ source, client, dryRun: false });
    for (const row of after) {
      if (row.destino !== row.expected || row.origen !== row.expected || row.hashDestino !== row.hashOrigen) {
        throw new Error(`Reconciliación fallida en ${row.table}; transacción revertida.`);
      }
      if (row.table === 'usuarios') {
        const sourcePasswords = source.get('usuarios').rows.map(r => [r.id, r.password]);
        const destPasswords = row.destRows.map(r => [r.id, r.password]);
        if (JSON.stringify(sourcePasswords) !== JSON.stringify(destPasswords)) throw new Error('Verificación interna de credenciales fallida; transacción revertida.');
      }
    }
    // Los adjuntos se copian con nombres ya comprobados; no se toca el origen.
    const docs = source.get('documentos_solicitud').rows;
    const destDir = path.resolve(process.env.SIGEP_UPLOAD_DIR || path.join(__dirname, '..', 'uploads', 'documentos'));
    for (const doc of docs) {
      const filename = path.basename(String(doc.rutaArchivo));
      const from = path.join(filesDir, filename);
      if (!fs.existsSync(from)) throw new Error(`Falta archivo requerido ${filename}; transacción revertida.`);
      fs.mkdirSync(destDir, { recursive: true });
      const to = path.join(destDir, filename);
      if (!fs.existsSync(to)) { fs.copyFileSync(from, to, fs.constants.COPYFILE_EXCL); copied.push(to); }
    }
    await client.query('COMMIT');
    imprimir(after, false);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    for (const filename of copied) { try { fs.unlinkSync(filename); } catch {} }
    throw error;
  }
}

async function main() {
  let sourceDb;
  let pool;
  try {
    const args = argumentos(process.argv.slice(2));
    if (!fs.existsSync(args.origen)) throw new Error('No se encuentra el archivo SQLite indicado.');
    if (!fs.statSync(args.origen).isFile()) throw new Error('El origen no es un archivo regular.');
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl || !databaseUrl.startsWith('postgresql://')) throw new Error('DATABASE_URL debe apuntar a PostgreSQL.');
    const targetName = new URL(databaseUrl).pathname.replace(/^\//, '').split('?')[0];
    if (targetName !== 'sigep') throw new Error('DATABASE_URL debe apuntar a la base sigep.');
    sourceDb = new DatabaseSync(args.origen, { readOnly: true });
    sourceDb.exec('PRAGMA query_only = ON');
    const source = loadSqlite(sourceDb);
    pool = new Pool({ connectionString: databaseUrl, max: 1 });
    const client = await pool.connect();
    try {
      const rows = await report({ source, client, dryRun: args.dryRun });
      if (args.dryRun) {
        imprimir(rows, true);
        const sourceMismatch = rows.filter(row => !row.origenValido);
        const occupied = rows.filter(row => !row.destinoVacio);
        if (sourceMismatch.length || occupied.length) {
          const details = [...sourceMismatch.map(row => `origen ${row.table}=${row.origen}/${row.expected}`), ...occupied.map(row => `destino ${row.table}=${row.destino}`)];
          throw new Error(`DRY-RUN ABORTADO: ${details.join('; ')}. PostgreSQL no fue modificado.`);
        }
      } else {
        const occupied = rows.filter(row => !row.destinoVacio);
        const sourceMismatch = rows.filter(row => !row.origenValido);
        if (occupied.length || sourceMismatch.length) throw new Error('Precondición incumplida: origen o destino no reconciliados; PostgreSQL no fue modificado.');
        await migrate(client, source, rows, args.archivos);
      }
    } finally { client.release(); }
  } catch (error) {
    // Errores de drivers pueden incluir URL/credenciales o valores de filas.
    console.error(`Error: ${error.message && /conteo|tabla|origen|destino|argumento|uso|confirmación|URL|PostgreSQL|reconciliación|booleano|fecha|archivo|clave|credenciales/i.test(error.message) ? error.message : 'falló una operación; detalles sensibles ocultos.'}`);
    process.exitCode = 1;
  } finally {
    if (sourceDb) sourceDb.close();
    if (pool) await pool.end().catch(() => {});
  }
}

if (require.main === module) main();
module.exports = { argumentos, canonical, hashRows, convertir };
