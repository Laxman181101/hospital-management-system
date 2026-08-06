import React, { useState, useMemo } from 'react';
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import EmptyState from './EmptyState';

const DataTable = ({ 
  columns, 
  data, 
  keyField = 'id',
  searchQuery = '',
  searchKeys = [], // e.g. ['name', 'email']
  filterKey = null,
  filterValue = 'All',
  loading = false,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  onRowClick
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter & Search
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Search
      let matchesSearch = true;
      if (searchQuery && searchKeys.length > 0) {
        matchesSearch = searchKeys.some(key => {
          const value = key.split('.').reduce((obj, k) => (obj || {})[k], item);
          return String(value).toLowerCase().includes(searchQuery.toLowerCase());
        });
      }
      
      // Filter
      let matchesFilter = true;
      if (filterKey && filterValue !== 'All') {
        const value = filterKey.split('.').reduce((obj, k) => (obj || {})[k], item);
        matchesFilter = String(value) === String(filterValue);
      }
      
      return matchesSearch && matchesFilter;
    });
  }, [data, searchQuery, searchKeys, filterKey, filterValue]);

  // Sort
  const sortedData = useMemo(() => {
    let sortableItems = [...filteredData];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const valA = sortConfig.key.split('.').reduce((obj, k) => (obj || {})[k], a);
        const valB = sortConfig.key.split('.').reduce((obj, k) => (obj || {})[k], b);
        
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredData, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage) || 1;
  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (key) => {
    if (!key) return;
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-slate-50 z-10">
            <tr className="border-b border-slate-200 shadow-sm">
              {columns.map((col, idx) => (
                <th 
                  key={idx}
                  className={`px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider ${col.sortable ? 'cursor-pointer hover:bg-slate-100 transition-colors' : ''} ${col.align === 'right' ? 'text-right' : ''}`}
                  onClick={() => col.sortable ? handleSort(col.sortKey || col.key) : undefined}
                >
                  <div className={`flex items-center gap-1 ${col.align === 'right' ? 'justify-end' : ''}`}>
                    {col.header} {col.sortable && <ArrowUpDown size={12} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-center text-slate-500 text-sm">
                  Loading...
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-16 text-center">
                  <EmptyState 
                    icon={emptyIcon} 
                    title={emptyTitle || "No records found"} 
                    description={emptyDescription || "There is no data to display matching your criteria."} 
                    className="border-none bg-transparent"
                  />
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <tr 
                  key={row[keyField] || rowIndex} 
                  className={`hover:bg-slate-50/50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className={`px-6 py-4 ${col.align === 'right' ? 'text-right' : ''}`}>
                      {col.render ? col.render(row) : (
                        col.accessor 
                          ? (typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor])
                          : row[col.key]
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
        <p className="text-sm text-slate-500 font-medium">
          Showing {sortedData.length === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, sortedData.length)} of {sortedData.length} entries
        </p>
        <div className="flex gap-2">
          <button 
            disabled={currentPage === 1} 
            onClick={() => setCurrentPage(p => p - 1)}
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed bg-white text-slate-600 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button 
            disabled={currentPage === totalPages} 
            onClick={() => setCurrentPage(p => p + 1)}
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed bg-white text-slate-600 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
