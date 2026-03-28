export function initPhotoUpload(): void {
  const photoBox = document.getElementById('photo-box');
  const photoFile = document.getElementById('photo-file') as HTMLInputElement | null;
  const photoPreview = document.getElementById('photo-preview') as HTMLImageElement | null;

  if (!photoBox || !photoFile || !photoPreview) return;

  photoBox.addEventListener('click', () => photoFile.click());

  photoFile.addEventListener('change', function () {
    const file = this.files?.[0];
    if (!file) return;
    photoPreview.src = URL.createObjectURL(file);
    photoPreview.style.display = 'block';
  });
}
