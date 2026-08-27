export type GallerySection =
  | "construction"
  | "architecture"
  | "renovation"
  | "household"
  | "documents"
  | "inspiration"
  | "other";

export type GallerySourceType =
  | "construction_media"
  | "apartment_media"
  | "household_item"
  | "apartment_document";

export interface GalleryItem {
  id: string;

  entityId: string;

  apartmentId: string;

  section: GallerySection;

  title: string;
  description: string | null;

  room: string | null;

  tags: string[];

  imageUrl: string;

  referenceDate: string | null;
  createdAt: string;

  sourceType: GallerySourceType;

  sourceLabel: string;

  sourceHref: string | null;

  sourceId: string;

  isExternal: boolean;

  canDeleteHere: boolean;

  bucketId: string | null;

  storagePath: string | null;
}

export interface GalleryCounts {
  total: number;
  construction: number;
  architecture: number;
  renovation: number;
  household: number;
  documents: number;
  inspiration: number;
  other: number;
}

export interface GalleryPageData {
  apartmentId: string;
  apartmentName: string;

  canEdit: boolean;

  items: GalleryItem[];

  rooms: string[];

  counts: GalleryCounts;
}