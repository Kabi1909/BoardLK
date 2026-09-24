import api from './api.js';
export async function syncPropertyImages(property, selected, onProgress) {
  let saved = property;
  const wanted = [...selected];
  const removable = () => saved.images.filter((image) => !wanted.includes(image.url));
  const remove = async (image) => {
    saved = (await api.delete('/properties/' + saved._id + '/images/' + image._id)).data.data;
    onProgress(saved, wanted);
  };
  // Free slots while keeping one image for a currently published listing.
  for (const source of [...wanted].filter((value) => value.startsWith('data:'))) {
    while (saved.images.length >= 8 && removable().length) await remove(removable()[0]);
    const data = new FormData(),
      blob = await (await fetch(source)).blob();
    data.append(
      'images',
      blob,
      'property.' +
        (blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg'),
    );
    const before = new Set(saved.images.map((image) => image._id));
    saved = (await api.post('/properties/' + saved._id + '/images', data)).data.data;
    const uploaded = saved.images.find((image) => !before.has(image._id));
    wanted[wanted.indexOf(source)] = uploaded.url;
    onProgress(saved, wanted);
  }
  for (const image of removable()) await remove(image);
  const cover = saved.images.find((image) => image.url === wanted[0]);
  if (cover)
    saved = (await api.patch('/properties/' + saved._id + '/cover', { imageId: cover._id })).data
      .data;
  onProgress(saved, wanted);
  return saved;
}
