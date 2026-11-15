(function () {
    'use strict';

    function storyLink(story) {
        const fallback = 'https://news.ycombinator.com/item?id=' + encodeURIComponent(story.id);
        if (!story.url) return fallback;
        try {
            const parsed = new URL(story.url);
            if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return parsed.href;
        } catch (e) {
            return fallback;
        }
        return fallback;
    }

    function storyHost(url) {
        try {
            return new URL(url).hostname;
        } catch (e) {
            return 'news.ycombinator.com';
        }
    }

    function renderStory(story) {
        const href = storyLink(story);
        const card = document.createElement('a');
        card.href = href;
        card.target = '_blank';
        card.rel = 'noopener noreferrer';
        card.className = 'service-card';

        const score = document.createElement('p');
        score.className = 'hn-score';
        const bolt = document.createElement('i');
        bolt.className = 'fa-solid fa-bolt';
        bolt.setAttribute('aria-hidden', 'true');
        score.appendChild(bolt);
        score.appendChild(document.createTextNode(' SCORE: ' + (story.score || 0)));

        const title = document.createElement('h3');
        title.className = 'hn-title';
        title.textContent = story.title;

        const source = document.createElement('p');
        source.className = 'hn-source';
        source.textContent = 'Source: ' + storyHost(href);

        card.appendChild(score);
        card.appendChild(title);
        card.appendChild(source);
        return card;
    }

    function showFeedMessage(feed, message, isError) {
        feed.textContent = '';
        const card = document.createElement('div');
        card.className = 'service-card feed-status';
        const p = document.createElement('p');
        if (isError) p.className = 'feed-error';
        p.textContent = message;
        card.appendChild(p);
        feed.appendChild(card);
    }

    async function fetchHackerNews() {
        const feed = document.getElementById('hn-feed');
        try {
            const topStoriesRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
            if (!topStoriesRes.ok) throw new Error('top stories unavailable');
            const storyIds = await topStoriesRes.json();
            if (!Array.isArray(storyIds)) throw new Error('unexpected payload');

            const stories = await Promise.all(storyIds.slice(0, 6).map(async function (id) {
                try {
                    const storyRes = await fetch('https://hacker-news.firebaseio.com/v0/item/' + encodeURIComponent(id) + '.json');
                    if (!storyRes.ok) return null;
                    return await storyRes.json();
                } catch (e) {
                    return null;
                }
            }));

            const usable = stories.filter(function (story) { return story && story.title; });
            if (!usable.length) throw new Error('no stories');

            feed.textContent = '';
            usable.forEach(function (story) { feed.appendChild(renderStory(story)); });
        } catch (error) {
            showFeedMessage(feed, 'The Hacker News feed could not be loaded right now. Please try again later.', true);
        }
    }
    fetchHackerNews();
})();
