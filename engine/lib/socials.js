// Helper to generate HTML block with social icons and subscriber counts
function generateSocialIconsHtml(subs) {
    return `<script src="https://apis.google.com/js/platform.js"></script>
<div class="social-icons">
    <div class="g-ytsubscribe" data-channelid="UCBFYIbjqFFhFZBvE1JmvpEg" data-layout="default" data-count="default"></div>
    <a href="https://www.instagram.com/mixvlad/" title="Instagram"><i class="fab fa-instagram"></i>${subs.Instagram ? `<span class='sub-count'>${subs.Instagram}</span>` : ''}</a>
    <a href="https://t.me/koztv" title="Telegram"><i class="fab fa-telegram"></i>${subs.Telegram ? `<span class='sub-count'>${subs.Telegram}</span>` : ''}</a>
    <a href="https://www.threads.com/@mixvlad" title="Threads"><i class="fas fa-at"></i>${subs.Threads ? `<span class='sub-count'>${subs.Threads}</span>` : ''}</a>
  </div>`;
}

export { generateSocialIconsHtml };
