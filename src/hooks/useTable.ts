/**
 * Hook para manejo de tablas con paginación, ordenamiento y filtrado
 */

import { useState, useMemo } from 'react'
import { sortBy, paginate } from '@/utils/helpers'
import { PAGINATION } from '@/utils/constants'

interface UseTableOptions<T> {
  data: T[]
  initialPageSize?: number
  initialSortKey?: keyof T
  initialSortOrder?: 'asc' | 'desc'
}

export function useTable<T>({
  data,
  initialPageSize = PAGINATION.DEFAULT_PAGE_SIZE,
  initialSortKey,
  initialSortOrder = 'asc',
}: UseTableOptions<T>) {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [sortKey, setSortKey] = useState<keyof T | undefined>(initialSortKey)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialSortOrder)

  const sortedData = useMemo(() => {
    if (!sortKey) return data
    return sortBy(data, sortKey, sortOrder)
  }, [data, sortKey, sortOrder])

  const paginatedData = useMemo(() => {
    return paginate(sortedData, currentPage, pageSize)
  }, [sortedData, currentPage, pageSize])

  const handleSort = (key: keyof T) => {
    if (sortKey === key) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortOrder('asc')
    }
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(1)
  }

  const goToFirstPage = () => setCurrentPage(1)
  const goToLastPage = () => setCurrentPage(paginatedData.totalPages)
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, paginatedData.totalPages))
  const goToPrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1))

  return {
    data: paginatedData.data,
    currentPage,
    pageSize,
    totalPages: paginatedData.totalPages,
    total: paginatedData.total,
    hasMore: paginatedData.hasMore,
    sortKey,
    sortOrder,
    handleSort,
    handlePageChange,
    handlePageSizeChange,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPrevPage,
  }
}
