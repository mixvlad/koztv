(() => {
  // Replace project cover images with autoplay videos if conditions are met.
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (connection) {
    if (connection.saveData) return; // Respect user save-data preference
    const slow = /2g|3g|slow/.test(connection.effectiveType || "");
    if (slow) return; // Do not load videos on slow connections
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.project-item[data-video]').forEach(item => {
      const img = item.querySelector('img');
      if (!img) return;

      const href = item.getAttribute('href');
      if (!href) return;
      // Derive project folder path from href (remove index.html and any trailing slashes)
      let folder = href.replace(/\\/g, '/').replace(/index\.html.*$/, '');
      if (!folder.endsWith('/')) folder += '/';
      const videoSrc = folder + 'video.mp4';

      // Prepare video element
      const video = document.createElement('video');
      video.src = videoSrc;
      video.muted = true;
      video.loop = true;
      video.autoplay = true;
      video.playsInline = true;
      video.poster = img.getAttribute('src');
      video.style.width = '100%';
      video.style.borderRadius = getComputedStyle(img).borderRadius;
      video.style.display = 'none';

      const swapInVideo = () => {
        img.replaceWith(video);
        video.style.display = 'block';
      };

      // Swap when video is ready to play through
      video.addEventListener('canplaythrough', swapInVideo, { once: true });
      // If loading fails, remove the video element to free memory
      video.addEventListener('error', () => video.remove(), { once: true });

      // Attach video element after image but hidden until ready
      img.after(video);
    });
  });
})(); 