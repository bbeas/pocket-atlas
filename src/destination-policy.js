// Hover-only discoveries stay animated but never enter the album/navigation flow.
export const canBrowsePlace = place => Boolean(place?.visited && !place.hoverOnly);
