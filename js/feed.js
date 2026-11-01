const HN_TOP = "https://hacker-news.firebaseio.com/v0/topstories.json";
const HN_ITEM = "https://hacker-news.firebaseio.com/v0/item/";

function storyLink(story) {
    const fallback = "https://news.ycombinator.com/item?id=" + encodeURIComponent(story.id);
    if (!story.url) return fallback;
    try {
        const parsed = new URL(story.url);
        if (parsed.protocol === "http:" || parsed.protocol === "https:") return parsed.href;
    } catch (error) {
        return fallback;
    }
    return fallback;
}

function storyHost(url) {
    try {
        return new URL(url).hostname;
    } catch (error) {
        return "news.ycombinator.com";
    }
}

function externalNote() {
    const note = document.createElement("span");
    note.className = "sr-only";
    note.textContent = " (opens in a new tab)";
    return note;
}

function renderStory(story) {
    const href = storyLink(story);
    const card = document.createElement("a");
    card.href = href;
    card.target = "_blank";
    card.rel = "noopener noreferrer";
    card.className = "service-card";

    const score = document.createElement("p");
    score.className = "hn-score";
    const bolt = document.createElement("i");
    bolt.className = "fa-solid fa-bolt";
    bolt.setAttribute("aria-hidden", "true");
    score.append(bolt, document.createTextNode(" SCORE: " + (story.score || 0)));

    const title = document.createElement("h3");
    title.className = "hn-title";
    title.textContent = story.title;

    const source = document.createElement("p");
    source.className = "hn-source";
    source.textContent = "Source: " + storyHost(href);

    card.append(score, title, source, externalNote());
    return card;
}

function showFeedMessage(feed, message, isError) {
    const card = document.createElement("div");
    card.className = "service-card feed-status";
    const paragraph = document.createElement("p");
    if (isError) paragraph.className = "feed-error";
    paragraph.textContent = message;
    card.append(paragraph);
    feed.replaceChildren(card);
}

async function loadStory(id) {
    try {
        const response = await fetch(HN_ITEM + encodeURIComponent(id) + ".json");
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        return null;
    }
}

async function fetchHackerNews() {
    const feed = document.getElementById("hn-feed");
    if (!feed) return;

    try {
        const response = await fetch(HN_TOP);
        if (!response.ok) throw new Error("top stories unavailable");
        const storyIds = await response.json();
        if (!Array.isArray(storyIds)) throw new Error("unexpected payload");

        const stories = await Promise.all(storyIds.slice(0, 6).map(loadStory));
        const usable = stories.filter((story) => story && story.title);
        if (!usable.length) throw new Error("no stories");

        feed.replaceChildren(...usable.map(renderStory));
    } catch (error) {
        showFeedMessage(feed, "Failed to establish telemetry link with Hacker News wire.", true);
    }
}

fetchHackerNews();
