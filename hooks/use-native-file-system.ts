'use client'

import { useCallback, useState } from 'react'
import { useHaptic } from './use-haptic'

// File System Access API types
interface FileSystemFileHandle {
  createWritable(): Promise<FileSystemWritableFileStream>
  getFile(): Promise<File>
  name: string
  kind: 'file'
}

interface FileSystemWritableFileStream extends WritableStream {
  write(data: string | BufferSource | Blob): Promise<void>
  close(): Promise<void>
}

interface FilePickerOptions {
  types?: Array<{
    description: string
    accept: Record<string, string[]>
  }>
  excludeAcceptAllOption?: boolean
  multiple?: boolean
}

interface SaveFileOptions {
  suggestedName?: string
  types?: Array<{
    description: string
    accept: Record<string, string[]>
  }>
}

declare global {
  interface Window {
    showOpenFilePicker?: (options?: FilePickerOptions) => Promise<FileSystemFileHandle[]>
    showSaveFilePicker?: (options?: SaveFileOptions) => Promise<FileSystemFileHandle>
  }
}

export function useNativeFileSystem() {
  const [isSupported, setIsSupported] = useState(() => {
    if (typeof window === 'undefined') return false
    return 'showOpenFilePicker' in window && 'showSaveFilePicker' in window
  })
  const { triggerHaptic } = useHaptic()

  const saveFile = useCallback(async (
    data: string | Blob,
    options?: {
      fileName?: string
      type?: string
      description?: string
    }
  ): Promise<boolean> => {
    try {
      if (isSupported && window.showSaveFilePicker) {
        triggerHaptic('light')
        
        const fileHandle = await window.showSaveFilePicker({
          suggestedName: options?.fileName || 'download.txt',
          types: options?.type ? [{
            description: options.description || 'File',
            accept: { [options.type]: [] }
          }] : undefined
        })

        const writable = await fileHandle.createWritable()
        await writable.write(data)
        await writable.close()
        
        triggerHaptic('success')
        return true
      } else {
        // Fallback to traditional download
        return downloadFile(data, options?.fileName || 'download.txt', options?.type)
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        // User cancelled - not an error
        return false
      }
      
      triggerHaptic('error')
      console.error('Failed to save file:', error)
      
      // Fallback to traditional download
      return downloadFile(data, options?.fileName || 'download.txt', options?.type)
    }
  }, [isSupported, triggerHaptic])

  const openFile = useCallback(async (options?: {
    accept?: string[]
    multiple?: boolean
  }): Promise<File[]> => {
    try {
      if (isSupported && window.showOpenFilePicker) {
        triggerHaptic('light')
        
        const fileHandles = await window.showOpenFilePicker({
          types: options?.accept ? [{
            description: 'Files',
            accept: Object.fromEntries(options.accept.map(type => [type, []]))
          }] : undefined,
          multiple: options?.multiple || false
        })

        const files: File[] = []
        for (const handle of fileHandles) {
          const file = await handle.getFile()
          files.push(file)
        }
        
        triggerHaptic('success')
        return files
      } else {
        // Fallback to traditional file input
        return openFileTraditional(options)
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        // User cancelled - return empty array
        return []
      }
      
      triggerHaptic('error')
      console.error('Failed to open file:', error)
      
      // Fallback to traditional file input
      return openFileTraditional(options)
    }
  }, [isSupported, triggerHaptic])

  // CSV-specific helper
  const saveCSV = useCallback(async (
    data: Array<Record<string, any>>,
    filename?: string,
    headers?: string[]
  ): Promise<boolean> => {
    const csvContent = convertToCSV(data, headers)
    return saveFile(csvContent, {
      fileName: filename || 'export.csv',
      type: 'text/csv',
      description: 'CSV File'
    })
  }, [saveFile])

  // JSON-specific helper
  const saveJSON = useCallback(async (
    data: any,
    filename?: string
  ): Promise<boolean> => {
    const jsonContent = JSON.stringify(data, null, 2)
    return saveFile(jsonContent, {
      fileName: filename || 'data.json',
      type: 'application/json',
      description: 'JSON File'
    })
  }, [saveFile])

  // Image-specific helper
  const saveImage = useCallback(async (
    imageData: Blob,
    filename?: string,
    format: 'png' | 'jpeg' | 'webp' = 'png'
  ): Promise<boolean> => {
    return saveFile(imageData, {
      fileName: filename || `image.${format}`,
      type: `image/${format}`,
      description: `${format.toUpperCase()} Image`
    })
  }, [saveFile])

  return {
    isSupported,
    saveFile,
    openFile,
    saveCSV,
    saveJSON,
    saveImage
  }
}

// Helper functions for fallback behavior
function downloadFile(data: string | Blob, fileName: string, mimeType?: string): boolean {
  try {
    const blob = typeof data === 'string' 
      ? new Blob([data], { type: mimeType || 'text/plain' })
      : data

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    return true
  } catch (error) {
    console.error('Fallback download failed:', error)
    return false
  }
}

function openFileTraditional(options?: {
  accept?: string[]
  multiple?: boolean
}): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    
    if (options?.accept && options.accept.length > 0) {
      input.accept = options.accept.join(',')
    }
    
    if (options?.multiple) {
      input.multiple = true
    }

    input.addEventListener('change', (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || [])
      resolve(files)
    })

    input.addEventListener('cancel', () => {
      resolve([])
    })

    document.body.appendChild(input)
    input.click()
    document.body.removeChild(input)
  })
}

function convertToCSV(data: Array<Record<string, any>>, customHeaders?: string[]): string {
  if (data.length === 0) return ''

  // Get headers
  const headers = customHeaders || Object.keys(data[0])
  
  // Create CSV content
  const csvRows = [
    // Header row
    headers.map(header => `"${header}"`).join(','),
    // Data rows
    ...data.map(row =>
      headers.map(header => {
        const value = row[header]
        const stringValue = value === null || value === undefined ? '' : String(value)
        // Escape quotes and wrap in quotes if necessary
        return `"${stringValue.replace(/"/g, '""')}"`
      }).join(',')
    )
  ]

  return csvRows.join('\n')
}