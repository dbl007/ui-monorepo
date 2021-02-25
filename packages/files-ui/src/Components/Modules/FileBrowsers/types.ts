import { Crumb } from "@chainsafe/common-components"
import {
  FileSystemItem,
  BucketType,
  UploadProgress,
} from "../../../Contexts/DriveContext"

export type FileOperation =
  | "rename"
  | "delete"
  | "download"
  | "share"
  | "move"
  | "info"
  | "recover"
  | "preview"
  | "view_folder"

export interface IFilesBrowserModuleProps {
  heading?: string
  // TODO: once pagination & unique content requests are present, this might change to a passed in function
  controls?: boolean
}

export interface IFileConfigured extends FileSystemItem {
  operations: FileOperation[]
}

export interface IBulkOperations {
  [index: string]: FileOperation[]
}

export interface IFilesTableBrowserProps
  extends Omit<
    IFilesBrowserModuleProps,
    "fileOperations" | "folderOperations"
  > {
  bulkOperations?: IBulkOperations
  handleRename?: (path: string, new_path: string) => Promise<void>
  handleMove?: (path: string, new_path: string) => Promise<void>
  downloadFile?: (cid: string) => Promise<void>
  deleteFile?: (cid: string) => Promise<void>
  bulkMoveFileToTrash?: (cids: string[]) => Promise<void>
  recoverFile?: (cid: string) => Promise<void>
  viewFolder?: (cid: string) => void
  allowDropUpload?: boolean

  handleUploadOnDrop?: (
    files: File[],
    fileItems: DataTransferItemList,
    path: string,
  ) => void

  updateCurrentPath: (
    newPath: string,
    newBucketType?: BucketType,
    showLoading?: boolean,
  ) => void
  loadingCurrentPath: boolean
  uploadsInProgress?: UploadProgress[]
  showUploadsInTable: boolean

  sourceFiles: IFileConfigured[]
  currentPath?: string
  crumbs: Crumb[] | undefined
}
