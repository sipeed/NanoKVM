import {
  DiscIcon,
  FileArchiveIcon,
  FileAudioIcon,
  FileIcon,
  FileImageIcon,
  FileTextIcon,
  FileVideoIcon,
  FolderSyncIcon,
  HardDriveIcon
} from 'lucide-react';

import type { MediaItem } from '@/api/media.ts';
import { extension } from '@/lib/file-names.ts';

// The glyphs the storage page and the desktop menu draw for media and for the
// files inside them. They live together so one thing cannot look like two: the
// shared folder is deliberately not a disk, because it is a directory this
// device exchanges with the target machine while an .img is a disk image the
// emulated USB disk carries, and the two used to share one icon.
export function MediaIcon({ item, className }: { item: MediaItem; className?: string }) {
  if (item.type === 'partition') {
    return <FolderSyncIcon size={14} className={className} />;
  }
  if (item.fs === 'iso9660') {
    return <DiscIcon size={14} className={className} />;
  }
  return <HardDriveIcon size={14} className={className} />;
}

// The shared folder carries whatever the two machines exchange, and a listing
// is read at a glance: an archive must not look like a movie or a picture.
// These are the kinds a shared folder mostly holds, and a file whose kind is
// not here is a payload rather than a mistake, so it keeps the plain file
// glyph. A .ts file is read as a document, not as an MPEG transport stream.
const archiveExtensions = new Set([
  '7z',
  'bz2',
  'cab',
  'deb',
  'gz',
  'jar',
  'rar',
  'rpm',
  'tar',
  'tgz',
  'txz',
  'xz',
  'zip',
  'zst'
]);
const documentExtensions = new Set([
  'c',
  'cfg',
  'conf',
  'cpp',
  'css',
  'csv',
  'doc',
  'docx',
  'go',
  'h',
  'hpp',
  'html',
  'ini',
  'java',
  'js',
  'json',
  'jsx',
  'log',
  'markdown',
  'md',
  'odt',
  'pdf',
  'php',
  'ppt',
  'pptx',
  'py',
  'rb',
  'rs',
  'sh',
  'sql',
  'toml',
  'ts',
  'tsx',
  'txt',
  'xls',
  'xlsx',
  'xml',
  'yaml',
  'yml'
]);
const videoExtensions = new Set([
  'avi',
  'flv',
  'm4v',
  'mkv',
  'mov',
  'mp4',
  'mpeg',
  'mpg',
  'ogv',
  'webm',
  'wmv'
]);
const imageExtensions = new Set([
  'avif',
  'bmp',
  'gif',
  'heic',
  'heif',
  'ico',
  'jpeg',
  'jpg',
  'png',
  'svg',
  'tif',
  'tiff',
  'webp'
]);
const audioExtensions = new Set(['aac', 'flac', 'm4a', 'mp3', 'oga', 'ogg', 'opus', 'wav', 'wma']);

// FileTypeIcon draws one entry of a listing, at the size and colour its rows
// use. Directories are not its business: the caller draws the folder glyph.
export function FileTypeIcon({ name }: { name: string }) {
  const ext = extension(name);
  const Icon = archiveExtensions.has(ext)
    ? FileArchiveIcon
    : videoExtensions.has(ext)
      ? FileVideoIcon
      : imageExtensions.has(ext)
        ? FileImageIcon
        : audioExtensions.has(ext)
          ? FileAudioIcon
          : documentExtensions.has(ext)
            ? FileTextIcon
            : FileIcon;

  return <Icon size={14} className="shrink-0 text-neutral-500" />;
}
