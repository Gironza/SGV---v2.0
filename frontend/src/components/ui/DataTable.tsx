import type { ReactNode } from "react";

export interface Column<T> {
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyMessage?: string;
}

/** Tabla genérica: cada panel define sus columnas (con `render`) y pasa
 * sus datos. Así Admin, Docente y Candidato reutilizan la misma tabla
 * en lugar de tener cada uno su <table> con filas escritas a mano. */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  emptyMessage = "No hay registros para mostrar.",
}: DataTableProps<T>) {
  if (rows.length === 0) {
    return <p className="data-table-empty">{emptyMessage}</p>;
  }

  return (
    <table className="data-table">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.header}>{col.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={rowKey(row)}>
            {columns.map((col) => (
              <td key={col.header} className={col.className}>
                {col.render(row)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default DataTable;
