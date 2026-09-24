// Static design photography; listing images are supplied by the property API.
export const photos = Array.from(
  { length: 5 },
  (_, index) => '/images/boarding-' + (index + 1) + '.jpg',
);
