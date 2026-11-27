'use strict';

const { argumentos, canonical, hashRows, convertir } = require('./migrar-datos');

describe('migrar-datos', () => {
  test('requiere rutas y confirmación explícita para modo de escritura', () => {
    expect(() => argumentos([])).toThrow('Uso:');
    expect(() => argumentos(['--origen', 'x.sqlite', '--origen-archivos', 'docs'])).toThrow('--confirmado-migra');
    expect(argumentos(['--origen', 'x.sqlite', '--origen-archivos', 'docs', '--dry-run']).dryRun).toBe(true);
  });

  test('normaliza nulos, booleanos y fechas ISO de forma determinista', () => {
    expect(canonical(null, 'activo', 'boolean')).toBeNull();
    expect(canonical(1, 'activo', 'boolean')).toBe(true);
    expect(canonical('2026-01-02T03:00:00-05:00', 'creadoEn', 'text')).toBe('2026-01-02T08:00:00.000Z');
    expect(convertir({ activo: 0, rutaArchivo: 'documentos/a.pdf', creadoEn: '2026-01-02T03:00:00-05:00' }, [
      { name: 'activo', type: 'boolean' }, { name: 'rutaArchivo', type: 'text' }, { name: 'creadoEn', type: 'timestamp without time zone' },
    ])).toMatchObject({ activo: false, rutaArchivo: 'a.pdf', creadoEn: new Date('2026-01-02T08:00:00.000Z') });
  });

  test('ordena por id y excluye password del hash de usuarios', () => {
    const columns = [{ name: 'id', type: 'integer' }, { name: 'nombres', type: 'text' }, { name: 'password', type: 'text' }];
    const one = [{ id: 2, nombres: 'B', password: 'secret-1' }, { id: 1, nombres: 'A', password: 'secret-2' }];
    const two = [{ id: 1, nombres: 'A', password: 'secret-3' }, { id: 2, nombres: 'B', password: 'secret-4' }];
    expect(hashRows(one, columns, 'usuarios')).toBe(hashRows(two, columns, 'usuarios'));
    expect(hashRows(one, columns, 'usuarios')).not.toBe(hashRows(two.map(row => ({ ...row, nombres: row.nombres + 'x' })), columns, 'usuarios'));
  });
});
