import { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";
import Pagination from "./Pagination";

export default function ReusableTable({
  columns = [],
  data = [],
  visibleColumns = 5,
  currentPage = 1,
  itemsPerPage = 10,
  onPageChange,
  getRowProps = () => ({}),
}) {
  // ✅ Ensure safe array values
  const safeColumns = Array.isArray(columns) ? columns : [];
  const safeData = Array.isArray(data)
    ? data.filter((row) => typeof row === "object" && row !== null)
    : [];

  // ✅ Initialize table safely
  const table = useReactTable({
    data: safeData,
    columns: safeColumns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  // ✅ Safe pagination
  const paginatedData = useMemo(() => {
    const start = Math.max(0, (currentPage - 1) * itemsPerPage);
    return table.getRowModel().rows.slice(start, start + itemsPerPage);
  }, [table.getRowModel().rows, currentPage, itemsPerPage]);

  const limitedColumns = safeColumns.slice(0, visibleColumns);

  return (
    <div className="flex flex-col h-full border-gray-200 rounded-xl shadow-sm border">
      {/* Scrollable Table Section */}
      <div className="flex-1 overflow-y-auto rounded-t-xl">
        <table className="min-w-full border-collapse bg-white">
          <thead className="bg-gray-50 sticky top-0 z-10">
            {table.getHeaderGroups().length > 0 ? (
              table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers
                    .slice(0, visibleColumns)
                    .map((header) => (
                      <th
                        key={header.id}
                        className="px-4 py-2 text-left text-sm font-medium text-gray-600 border-b bg-gray-50"
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        ) ?? ""}
                      </th>
                    ))}
                </tr>
              ))
            ) : (
              <tr>
                <th className="text-center py-3 text-gray-400">
                  No columns available
                </th>
              </tr>
            )}
          </thead>

          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row) => {
                const rowProps = getRowProps(row) || {};
                return (
                  <tr
                    key={row.id}
                    {...rowProps}
                    className={`hover:bg-gray-50 ${rowProps.className || ""}`}
                  >
                    {row
                      .getVisibleCells()
                      .slice(0, visibleColumns)
                      .map((cell) => (
                        <td
                          key={cell.id}
                          className="px-4 py-3 text-sm text-gray-800 border-b"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          ) ?? <span className="text-gray-400">—</span>}
                        </td>
                      ))}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={limitedColumns.length || 1}
                  className="text-center py-6 text-gray-400"
                >
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination pinned to bottom */}
      <div className="p-3 border-t">
        <Pagination
          totalLength={safeData.length}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          handlePageClick={(e) => onPageChange?.(e.selected + 1)}
        />
      </div>
    </div>
  );
}
