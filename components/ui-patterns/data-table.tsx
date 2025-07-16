"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  Search, 
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X
} from "lucide-react"
import { EmptyState } from "./empty-state"
import { cn } from "@/lib/utils"

export interface Column<T> {
  header: string
  accessorKey: keyof T | string
  cell?: (item: T) => React.ReactNode
  sortable?: boolean
  className?: string
}

export interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  searchPlaceholder?: string
  searchKey?: keyof T | string
  emptyState?: {
    icon?: any
    title: string
    description?: string
    action?: {
      label: string
      href?: string
      onClick?: () => void
    }
  }
  initialSortColumn?: string
  initialSortDirection?: "asc" | "desc"
  pageSize?: number
  className?: string
  stickyHeader?: boolean
  onRowClick?: (item: T) => void
}

export function DataTable<T>({
  data,
  columns,
  searchPlaceholder = "Search...",
  searchKey,
  emptyState,
  initialSortColumn,
  initialSortDirection = "asc",
  pageSize = 10,
  className,
  stickyHeader = false,
  onRowClick,
}: DataTableProps<T>) {
  // State for search, sorting, and pagination
  const [searchQuery, setSearchQuery] = useState("")
  const [sortColumn, setSortColumn] = useState<string | undefined>(initialSortColumn)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(initialSortDirection)
  const [currentPage, setCurrentPage] = useState(1)

  // Filter data based on search query
  const filteredData = searchKey && searchQuery
    ? data.filter(item => {
        const value = getNestedValue(item, searchKey as string)
        return value && String(value).toLowerCase().includes(searchQuery.toLowerCase())
      })
    : data

  // Sort data based on sort column and direction
  const sortedData = sortColumn
    ? [...filteredData].sort((a, b) => {
        const aValue = getNestedValue(a, sortColumn)
        const bValue = getNestedValue(b, sortColumn)

        if (aValue === bValue) return 0

        // Handle different data types
        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortDirection === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue)
        }

        if (aValue === null || aValue === undefined) return sortDirection === "asc" ? -1 : 1
        if (bValue === null || bValue === undefined) return sortDirection === "asc" ? 1 : -1

        return sortDirection === "asc"
          ? (aValue < bValue ? -1 : 1)
          : (bValue < aValue ? -1 : 1)
      })
    : filteredData

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize)
  const paginatedData = sortedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  // Handle sort click
  const handleSortClick = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(columnKey)
      setSortDirection("asc")
    }
  }

  // Helper function to get nested object values using dot notation
  function getNestedValue(obj: any, path: string | keyof T): any {
    if (!path) return undefined
    
    const pathArray = typeof path === "string" ? path.split(".") : [path]
    let value = obj
    
    for (const key of pathArray) {
      if (value === null || value === undefined) return undefined
      value = value[key]
    }
    
    return value
  }

  // Render cell content
  const renderCell = (item: T, column: Column<T>) => {
    if (column.cell) {
      return column.cell(item)
    }
    
    const value = getNestedValue(item, column.accessorKey)
    return value !== undefined && value !== null ? String(value) : ""
  }

  // Pagination controls
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Reset search
  const handleResetSearch = () => {
    setSearchQuery("")
  }

  return (
    <div className="space-y-4">
      {searchKey && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={handleResetSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      <div className={cn("rounded-md border", className)}>
        <Table>
          <TableHeader className={stickyHeader ? "sticky top-0 z-10 bg-background" : ""}>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead 
                  key={index}
                  className={cn(
                    column.sortable && "cursor-pointer select-none",
                    column.className
                  )}
                  onClick={() => column.sortable && handleSortClick(column.accessorKey as string)}
                >
                  <div className="flex items-center gap-1">
                    {column.header}
                    {column.sortable && (
                      <div className="ml-1">
                        {sortColumn === column.accessorKey ? (
                          sortDirection === "asc" ? (
                            <ArrowUp className="h-4 w-4" />
                          ) : (
                            <ArrowDown className="h-4 w-4" />
                          )
                        ) : (
                          <ArrowUpDown className="h-4 w-4 opacity-50" />
                        )}
                      </div>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((item, rowIndex) => (
                <TableRow 
                  key={rowIndex} 
                  className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
                  onClick={() => onRowClick && onRowClick(item)}
                >
                  {columns.map((column, colIndex) => (
                    <TableCell key={colIndex} className={column.className}>
                      {renderCell(item, column)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center">
                  {emptyState ? (
                    <EmptyState
                      icon={emptyState.icon}
                      title={emptyState.title}
                      description={emptyState.description}
                      action={emptyState.action}
                      compact
                    />
                  ) : (
                    <div className="text-muted-foreground">No results found</div>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} entries
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                
                return (
                  <Button
                    key={i}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="icon"
                    onClick={() => handlePageChange(pageNum)}
                    className="h-8 w-8"
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
} 