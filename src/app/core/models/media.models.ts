export interface MediaItemDto {
  id: string;
  title: string;
  imageUrl: string;
  ageRating?: string;
  qualityTag?: string; // e.g., 4K, HD, Top
  durationText?: string; // e.g., 2h 01m
  category?: string; // e.g., Podcast, Docu
  vipOnly?: boolean;
  isNew?: boolean;
}

export interface SectionDto {
  key: string;
  title: string;
  subtitle?: string;
  items: MediaItemDto[];
}
