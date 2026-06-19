/* ============================================
   LinkVault — script.js
   This file is the "brain". It decides what happens when you
   click buttons, type in boxes, or load the page.

   JavaScript runs TOP TO BOTTOM, one line at a time, unless we
   tell it to jump somewhere (like into a function).
   ============================================ */


/* ---------- AI SUMMARY CONFIG ----------
   Paste your free Gemini API key between the quotes below. This key acts
   like a password that lets our app talk to Google's AI service.

   IMPORTANT: because this is a frontend-only project with no backend
   server, this key lives directly in this file and would be visible to
   anyone who views your page's source code or GitHub repo. That's a
   normal, accepted tradeoff for a free-tier learning project - just
   never put a PAID/billing-enabled key here. */

const GEMINI_API_KEY = 'AQ.Ab8RN6LCa4Bqm0X_SIJdMpMCoOXnlK4OrxLpeHEoMuN_MPGcGQ';

const GEMINI_API_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
/* Switched from gemini-2.0-flash to gemini-2.5-flash. The 2.0 version
   has a noticeably lower free-tier rate limit than the newer 2.5
   version, so this alone should make hitting 429 errors much less
   common during normal use. */
/* This is the exact web address our app will send a request to. The
   ${GEMINI_API_KEY} at the end attaches your key as part of the URL,
   which is how Google's server confirms the request is allowed. */


/* ---------- STEP 1: Grab references to our HTML elements ----------
   Every "document.getElementById('something')" line below means:
   "Go find the HTML element that has id='something', and let me
   control it from here using this variable name."

   This is exactly why we gave things ids in the HTML file earlier. */

const urlInput     = document.getElementById('urlInput');
const tagInput      = document.getElementById('tagInput');
const addBtn         = document.getElementById('addBtn');
const searchInput    = document.getElementById('searchInput');
const linksContainer = document.getElementById('linksContainer');
const emptyMessage   = document.getElementById('emptyMessage');
const linkCountText  = document.getElementById('linkCount');
const tagFiltersBox  = document.getElementById('tagFilters');
const themeToggle    = document.getElementById('themeToggle');
const sortSelect      = document.getElementById('sortSelect');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importFile = document.getElementById('importFile');
const totalLinksText = document.getElementById('totalLinks');
const favoriteLinksText = document.getElementById('favoriteLinks');
const totalTagsText = document.getElementById('totalTags');
const toast = document.getElementById('toast');
/* themeToggle is the new dark mode button, sortSelect is the new dropdown.
   Same pattern as every other variable here -- grab a reference once,
   reuse it everywhere instead of searching the page repeatedly. */

/* "const" means "this variable's value won't be reassigned later".
   We use const by default, and only use "let" when a value needs to change. */


/* ---------- STEP 2: Our "database" ----------
   We don't have a real backend or database in this project.
   Instead, we keep all our links in a simple JavaScript ARRAY
   (a list) of OBJECTS (little packets of related data).

   Example of what one "link" looks like as an object:
   { id: 123, url: "https://youtube.com", title: "youtube.com", tags: ["video"] }

   "let" is used here because this array WILL change -- we add and remove
   links from it constantly. */

/* ---------- ICON CONSTANTS ----------
   These are small reusable chunks of SVG code, stored as plain text
   strings. We use these instead of an icon FONT (like Tabler) because
   icon fonts have to be downloaded from the internet -- if you open this
   file directly without a live internet connection or a local server,
   font icons can silently fail and show up blank, which is exactly the
   bug you ran into. Inline SVG text has zero dependencies: it's baked
   directly into the page and always renders. */

const COPY_ICON_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';

const COPY_CHECK_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';

const EDIT_ICON_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>';

const DELETE_ICON_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path></svg>';

const SUMMARIZE_ICON_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"></path><path d="M19 14l0.7 2 2 0.7-2 0.7-0.7 2-0.7-2-2-0.7 2-0.7 0.7-2z"></path></svg>';
/* a small "sparkle" shape - the universal visual shorthand for
   "AI-powered" used by most modern apps (Notion AI, Gmail, etc.) */
const STAR_FILLED = '⭐';
const STAR_EMPTY = '☆';
let links = [];

/* ---------- STEP 2b: Dark mode ----------
   The trick to dark mode is simple: we put a "data-theme" label on the
   <html> tag, and ALL our CSS colors (defined as variables in style.css)
   automatically switch when that label says "dark" instead of nothing.
   This function's only job is to flip that label on and off, and
   remember the choice so it persists after a refresh. */

function applyTheme(theme) {
  const moonIcon = document.getElementById('moonIcon');
  const sunIcon = document.getElementById('sunIcon');
  /* grabbing both icons fresh each time this runs - this function is only
     called on toggle and on page load, so there's no performance concern */

  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    /* document.documentElement means "the <html> tag itself".
       setAttribute adds data-theme="dark" onto it. */
    moonIcon.style.display = 'none';
    sunIcon.style.display = 'block';
    /* hide the moon, show the sun - both SVGs already exist in the HTML,
       we're just toggling which one is visible instead of swapping
       font icon classes like before */
  } else {
    document.documentElement.removeAttribute('data-theme');
    /* removing the attribute makes CSS fall back to the default :root
       colors defined at the top of style.css, i.e. light mode. */
    moonIcon.style.display = 'block';
    sunIcon.style.display = 'none';
  }
  localStorage.setItem('linkvault-theme', theme);
  /* save the choice so next time the page loads, we remember it instead
     of always resetting to light mode. */
}

function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  applyTheme(isDark ? 'light' : 'dark');
  /* this reads the CURRENT state and flips it to the opposite */
}

function loadTheme() {
  const savedTheme = localStorage.getItem('linkvault-theme');
  if (savedTheme === 'dark') {
    applyTheme('dark');
  }
  /* if nothing was saved before (first visit), we simply do nothing,
     which leaves the page in light mode by default. */
}

/* Right now this array is empty. Below, we check if the browser has
   saved links from BEFORE (from a previous visit) using something
   called localStorage -- think of it as a tiny notebook the browser
   keeps for our website, that survives even after closing the tab. */

function loadFromStorage() {
  const saved = localStorage.getItem('linkvault-links');
  /* localStorage only stores TEXT, not real arrays/objects.
     So when we saved earlier, we converted our array into a text string
     using JSON.stringify(). Now we reverse that with JSON.parse(). */

  if (saved) {
    links = JSON.parse(saved);
    links.forEach(link => {
    if (link.favorite === undefined) {
      link.favorite = false;
    }
  });
}
  /* If "saved" is null (nothing was stored before, e.g. first time visiting),
     we just leave "links" as the empty array from Step 2. */
}

function saveToStorage() {
  localStorage.setItem('linkvault-links', JSON.stringify(links));
  /* Every time we add or delete a link, we call this function to make sure
     the browser's notebook is updated. Otherwise our changes would disappear
     the moment we refresh the page. */
}
                
function exportLinks() {

  const dataStr = JSON.stringify(links, null, 2);

  const blob = new Blob(
    [dataStr],
    { type: 'application/json' }
  );

  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');

  a.href = url;
  a.download = 'linkvault-backup.json';

  a.click();

  URL.revokeObjectURL(url);
}

function importLinks(event) {

  const file = event.target.files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = function(e) {

    try {

      const importedLinks =
        JSON.parse(e.target.result);

      links = importedLinks.map(link => ({
            ...link,
            favorite: link.favorite || false
            }));
      saveToStorage();

      renderLinks();

      showToast('📂 Import Successful');

    } catch {

      showToast('❌ Invalid JSON File');

    }

  };

  reader.readAsText(file);
}

function showToast(message) {

  toast.textContent = message;

  toast.classList.add('show');

  setTimeout(() => {

    toast.classList.remove('show');

  }, 2500);

}


/* ---------- STEP 3: Add a new link ---------- 
   This function runs when the user clicks the "+ Save Link" button. */

function addLink() {
  let urlValue = urlInput.value.trim();

if (
  !urlValue.startsWith('http://') &&
  !urlValue.startsWith('https://')
) {
  urlValue = 'https://' + urlValue;
}
  /* .value reads whatever text is currently typed in the box.
     .trim() removes accidental spaces at the start/end (e.g. " hello " becomes "hello"). */

  const tagValue = tagInput.value.trim();

  if (urlValue === '') {
    alert('Please paste a link first.');
    return;
    /* "return" immediately STOPS this function from running any further.
       This is how we block empty submissions. */
  }

  /* Turn "python, tutorial" into ["python", "tutorial"] */
  const tagsArray = tagValue
    .split(',')          
    /* .split(',') breaks a string into an array wherever it sees a comma */
    .map(tag => tag.trim().toLowerCase())
    /* .map() runs a small function on EVERY item in the array.
       Here, for each tag, we trim spaces and make it lowercase
       so "Python" and "python" are treated as the same tag. */
    .filter(tag => tag !== '');
    /* .filter() keeps only the items that pass a test.
       Here we remove any empty strings (e.g. if user typed "python,,tutorial"). */

  /* Build the new link object */
  const newLink = {
    id: Date.now(),
    /* Date.now() gives the current time in milliseconds, like 1718700000000.
       It's an easy way to generate a "good enough" unique ID for each link. */
    url: urlValue,
    title: getDisplayTitle(urlValue),
    tags: tagsArray,
    savedAt: new Date().toLocaleDateString(),
    favorite: false
    /* toLocaleDateString() turns the date into a readable format like "6/18/2026" */
  };

  links.unshift(newLink);
  /* .unshift() adds the new item to the START of the array,
     so your newest saved link always shows up at the TOP of the list. */

  saveToStorage();
  /* update the browser's notebook so this isn't lost on refresh */
  
  /* toast notification */
  urlInput.value = '';
  tagInput.value = '';
  console.log("Link saved");
  /* clear the input boxes so the user can add another link right away */
  renderLinks();
  /* re-draw the whole list on screen so the new card appears */
}

/* Small helper: turns a full URL into a shorter, readable title.
   e.g. "https://www.youtube.com/watch?v=123" becomes "youtube.com" */
function getDisplayTitle(url) {
  try {
    const hostname = new URL(url).hostname;
    /* The built-in URL() tool parses a link and pulls out just the domain part.
       This will throw an error if the text isn't a valid URL -- that's why
       we wrap it in try/catch below. */
    return hostname.replace('www.', '');
  } catch (error) {
    /* If the user typed something that isn't a real URL (e.g. just "notes"),
       we don't want the whole app to crash. We just use their raw text instead. */
    return url;
  }
}
function getFaviconUrl(url) {
  try {
    const hostname = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
  } catch {
    return '';
  }
}


/* ---------- STEP 4: Delete a link ---------- */
function deleteLink(id) {

  const confirmed = confirm(
    'Are you sure you want to delete this link?'
  );

  if (!confirmed) return;

  links = links.filter(link => link.id !== id);

  saveToStorage();
  
  renderLinks();
  showToast('🗑 Link Deleted');
}

function toggleFavorite(id) {
  const link = links.find(link => link.id === id);

  if (!link) return;

  link.favorite = !link.favorite;

  saveToStorage();

  showToast(
  link.favorite
    ? '⭐ Added to Favorites'
    : '☆ Removed from Favorites'
);

renderLinks();
}


/* ---------- STEP 4b: Copy a link's URL ---------- */

function copyLink(id, buttonElement) {
  const linkToCopy = links.find(link => link.id === id);
  /* .find() searches the array and returns the FIRST item where the
     condition is true -- here, the one link whose id matches. */

  if (!linkToCopy) return;
  /* safety check: if somehow no matching link was found, stop here
     instead of crashing on the next line. */

  navigator.clipboard.writeText(linkToCopy.url);
  /* navigator.clipboard is a built-in browser feature (no library needed)
     that lets JavaScript write text directly to the user's clipboard,
     exactly like a manual Ctrl+C would. */

  buttonElement.classList.add('copied');
  buttonElement.innerHTML = COPY_CHECK_SVG;
  /* Briefly swap the button's icon and color (via the .copied CSS class)
     so the user gets visual confirmation that something happened.
     COPY_CHECK_SVG and COPY_ICON_SVG are plain text constants defined
     near the top of this file - using inline SVG instead of an icon font
     means this works even with no internet connection, since nothing
     needs to be downloaded. */

  setTimeout(() => {
    buttonElement.classList.remove('copied');
    buttonElement.innerHTML = COPY_ICON_SVG;
    /* setTimeout runs this code ONCE, after the given delay (in
       milliseconds). After 1.2 seconds, we revert the button back to
       its normal copy icon. */
  }, 1200);
}


/* ---------- STEP 4c: Edit an existing link ---------- */

let editingId = null;
/* This tracks WHICH card is currently in edit mode. null means
   "no card is being edited right now". Only one card can be edited
   at a time in this simple version. */

function startEdit(id) {
  editingId = id;
  renderLinks();
  /* Re-render the whole list. The render function (further down) checks
     "is this card's id equal to editingId?" for every card, and shows
     the edit form instead of the normal view for just that one card. */
}

function cancelEdit() {
  editingId = null;
  renderLinks();
}

function saveEdit(id) {
  const card = document.querySelector(`[data-card-id="${id}"]`);
  /* document.querySelector finds the first element matching a CSS-style
     selector. We gave each card a data-card-id attribute (see renderLinks
     below) specifically so we could find it again here. */

  const newUrl = card.querySelector('.edit-url-input').value.trim();
  const newTags = card.querySelector('.edit-tag-input').value
    .split(',')
    .map(tag => tag.trim().toLowerCase())
    .filter(tag => tag !== '');
  /* same comma-splitting logic we used in addLink(), reused here */

  if (newUrl === '') {
    alert('The link cannot be empty.');
    return;
  }

  const linkToUpdate = links.find(link => link.id === id);
  linkToUpdate.url = newUrl;
  linkToUpdate.title = getDisplayTitle(newUrl);
  linkToUpdate.tags = newTags;
  /* Because "linkToUpdate" points to the SAME object that's sitting inside
     our "links" array (not a copy), changing its properties directly
     here also updates the real entry in the array. This is a key
     JavaScript concept: objects are passed by reference, not by value. */

  editingId = null;
  saveToStorage();
  renderLinks();
}


/* ---------- STEP 4e: AI Summary ----------
   This is the first function in our whole project that talks to the
   INTERNET while the app is running (everything else just used
   localStorage, which is purely local to your browser).

   Talking to the internet takes TIME - maybe half a second, maybe three
   seconds, depending on your connection and how busy Google's server is.
   JavaScript normally runs instantly, line by line, and WON'T wait
   around for slow things by default. So we need a special way of
   writing code that says "start this slow task, and whenever it
   finishes (we don't know exactly when), continue from here."

   That's what the keywords "async" and "await" do:
   - "async function" marks this WHOLE function as one that's allowed
     to pause and wait for slow operations inside it.
   - "await" placed before something slow means "pause HERE until this
     finishes, then continue to the next line with the result." */

async function summarizeLink(id, buttonElement) {
  const link = links.find(link => link.id === id);
  if (!link) return;

  if (GEMINI_API_KEY === 'PASTE_YOUR_API_KEY_HERE') {
    alert('Add your free Gemini API key in script.js first (look for GEMINI_API_KEY near the top of the file).');
    return;
    /* a friendly guard so the app doesn't just silently fail forever
       if you forget to paste your key in */
  }

  const originalButtonHtml = buttonElement.innerHTML;
  buttonElement.innerHTML = '<span class="spinner"></span>';
  buttonElement.disabled = true;
  /* While we wait for the AI's response, we swap the button to a small
     spinning loader and disable it, so the user gets visual feedback
     that something is happening and can't click it twice by accident. */

  const promptText =
    `Write a single, short, helpful 2-sentence summary of what someone ` +
    `would likely find at this webpage, based on its title and URL. ` +
    `Be concise and specific. Do not say "this webpage" or "this link" - ` +
    `just describe the likely content directly.\n\n` +
    `Title: ${link.title}\nURL: ${link.url}` +
    (link.tags.length ? `\nTags: ${link.tags.join(', ')}` : '');
  /* This is the actual instruction text we send to the AI. We give it
     the title, URL, and tags as context clues, since (as discussed
     earlier) the AI cannot actually visit and read the real page - it's
     making an educated, useful guess based on these details instead. */

  try {
    const response = await fetch(GEMINI_API_URL, {
      /* fetch() is JavaScript's built-in tool for sending a request to
         any web address. We "await" it because sending a request and
         getting a response back takes real time over the network. */
      method: 'POST',
      /* POST means "I'm sending data TO the server", as opposed to GET
         which just asks the server to send US something. We're sending
         our prompt text, so POST is correct here. */
      headers: { 'Content-Type': 'application/json' },
      /* this tells Google's server "the data I'm sending you is in
         JSON format", so it knows how to read it correctly */
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }]
        /* This exact shape - contents > parts > text - is simply the
           specific structure Gemini's API expects to receive. Every
           AI provider has its own slightly different expected shape;
           this is the one Google's documentation specifies. */
      })
    });

    if (response.status === 429) {
      throw new Error('RATE_LIMIT');
      /* 429 specifically means "you've sent too many requests too
         quickly" - this is Google's free tier protecting itself, not
         a bug in our code. We throw a specific labeled error here so
         the catch block below can show an accurate message instead of
         a generic one. */
    }

    if (!response.ok) {
      /* response.ok is automatically true for successful responses
         (status 200-299) and false for any error status (400s, 500s).
         This check catches OTHER problems - like an invalid API key
         (401/403) or Google's server having issues (500) - that
         aren't specifically a rate limit. */
      throw new Error('API_ERROR');
    }

    const data = await response.json();
    /* response.json() converts the raw response back into a JavaScript
       object we can actually read. We "await" this too, since reading
       and parsing the response also takes a small amount of time. */

    const summaryText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    /* This long chain with ?. ("optional chaining") safely digs into
       the response object step by step. If ANY step along the way is
       missing (e.g. the AI refused, or an error came back instead of
       a real answer), this whole expression just becomes "undefined"
       instead of crashing the entire app. */

    if (!summaryText) {
      throw new Error('No summary returned');
      /* "throw" deliberately triggers an error on purpose. This jumps
         straight down to the catch block below, where we show the user
         a friendly message instead of a blank/broken result. */
    }

    link.summary = summaryText;
    saveToStorage();
    renderLinks();
    /* save the summary onto this link's data permanently, so it's still
       there next time you load the page - not just for this one session */

  } catch (error) {
    console.error('AI summary failed:', error);

    if (error.message === 'RATE_LIMIT') {
      alert('Google\'s free tier has a limit on AI requests. This usually clears in under a minute, but if you\'ve tested this feature many times today, you may have hit today\'s daily limit instead - that resets at midnight Pacific Time. Either way, this isn\'t a bug in your code.');
      /* this is the specific, accurate message for a 429 - telling the
         user exactly what happened and exactly what to do about it,
         instead of a vague "something went wrong" */
    } else if (error.message === 'API_ERROR') {
      alert('The AI service rejected this request. Double check that you pasted your full API key correctly in script.js, with no extra spaces.');
    } else {
      alert('Could not generate a summary right now. Please check your internet connection and try again.');
      /* the original generic message, now used only as a last-resort
         fallback for truly unexpected problems */
    }

    buttonElement.innerHTML = originalButtonHtml;
    buttonElement.disabled = false;
    /* if ANYTHING went wrong anywhere in the "try" block above - bad
       internet, invalid key, Google's server being down - we land HERE
       instead of crashing, and put the button back to its normal state
       so the user can try again. */
  }
}

let activeTagFilter = null;
/* null means "no tag filter is selected, show everything" */

function animateCounter(element, target) {

  let current = 0;

  const increment =
    Math.max(1, Math.ceil(target / 30));

  const timer = setInterval(() => {

    current += increment;

    if (current >= target) {
      element.textContent = target;
      clearInterval(timer);
    } else {
      element.textContent = current;
    }

  }, 20);

}

/* ---------- STEP 5: Draw (render) the links on screen ----------
   This is the most important function. Anytime the data changes
   (add, delete, search, filter), we call this to rebuild what's
   visually on the page so it matches our "links" array exactly. */

function renderLinks() {
  const searchTerm = searchInput.value.trim().toLowerCase();

  /* Step 5a: figure out which links to actually show, based on
     search text AND the selected tag filter (if any). */
  let visibleLinks = links.filter(link => {
    const matchesSearch =
      link.title.toLowerCase().includes(searchTerm) ||
      link.url.toLowerCase().includes(searchTerm) ||
      link.tags.some(tag => tag.includes(searchTerm));
      /* .some() checks "is there AT LEAST ONE tag that matches?" and gives true/false */

    const matchesTagFilter =
      activeTagFilter === null || link.tags.includes(activeTagFilter);

    return matchesSearch && matchesTagFilter;
    /* a link only shows up if BOTH conditions are true */
  });

  /* Step 5a-2: SORT the visible links based on the dropdown's current value.
     .sort() takes a "comparison function" that runs on pairs of items.
     Returning a negative number means "a should come before b",
     a positive number means "b should come before a". */
  const sortMode = sortSelect.value;

  if (sortMode === 'newest') {
  visibleLinks = visibleLinks.sort((a, b) => {
    if (a.favorite !== b.favorite) {
      return b.favorite - a.favorite;
    }
    return b.id - a.id;
  });

} else if (sortMode === 'oldest') {
  visibleLinks = visibleLinks.sort((a, b) => {
    if (a.favorite !== b.favorite) {
      return b.favorite - a.favorite;
    }
    return a.id - b.id;
  });

} else if (sortMode === 'az') {
  visibleLinks = visibleLinks.sort((a, b) => {
    if (a.favorite !== b.favorite) {
      return b.favorite - a.favorite;
    }
    return a.title.localeCompare(b.title);
  });
}

  /* Step 5b: clear out whatever was on screen before, so we don't
     end up with duplicate cards stacking up. */
  linksContainer.innerHTML = '';

  /* Step 5c: show/hide the "no links yet" message */
  if (visibleLinks.length === 0) {
    emptyMessage.classList.remove('hidden');
    emptyMessage.textContent = links.length === 0
      ? 'No links saved yet. Paste a link above to get started.'
      : 'No links match your search.';
  } else {
    emptyMessage.classList.add('hidden');
  }

  /* Step 5d: build one "card" of HTML for every visible link */
  visibleLinks.forEach(link => {
    const card = document.createElement('div');
    /* This creates a brand new, empty <div> element in memory
       (not on screen yet -- we have to attach it below). */
    card.className = 'link-card';
    card.setAttribute('data-card-id', link.id);
    /* this attribute lets saveEdit() find this exact card again later */

    if (editingId === link.id) {
      card.classList.add('editing');
      /* adding the "editing" class triggers the CSS rules that hide the
         normal view and show the edit form instead, for THIS card only */
    }

    /* Build the tags as little pill spans, e.g. <span class="link-tag">python</span> */
    const tagsHtml = link.tags
    .map(tag => `<span class="link-tag">${tag}</span>`)
    .join('');

    const starIcon = link.favorite
       ? STAR_FILLED
       : STAR_EMPTY;
    
       const faviconUrl = getFaviconUrl(link.url);
      /* .join('') glues an array of strings together into one single string */

    /* This is a "template literal" - the backticks (`) let us write
       multi-line text and insert variables using ${variableName}.
       Notice this card now has TWO sections: .link-card-view (the normal
       display) and .edit-form (only visible while editing). CSS decides
       which one shows based on whether the card has the "editing" class. */
    card.innerHTML = `
      <div class="link-card-view">
        <div class="link-card-header">
        <a href="${link.url}" target="_blank" class="link-card-title">
            <img src="${faviconUrl}" class="site-favicon" alt="" onerror="this.style.display='none'">
            ${link.title}
        </a>
          <div class="card-actions">

            <button class="icon-btn favorite-btn"
                    title="Favorite"
                    data-action="favorite"
                    data-id="${link.id}">
                 ${starIcon}
                </button>
            <button class="icon-btn copy-btn" title="Copy link" data-action="copy" data-id="${link.id}">
              ${COPY_ICON_SVG}
            </button>
            <button class="icon-btn summarize-btn" title="AI Summary" data-action="summarize" data-id="${link.id}">
              ${SUMMARIZE_ICON_SVG}
            </button>
            <button class="icon-btn edit-btn" title="Edit" data-action="edit" data-id="${link.id}">
              ${EDIT_ICON_SVG}
            </button>
            <button class="icon-btn delete-btn" title="Delete" data-action="delete" data-id="${link.id}">
              ${DELETE_ICON_SVG}
            </button>
          </div>
        </div>
        <div class="link-card-url">${link.url}</div>
        <div class="link-card-tags">${tagsHtml}</div>
        ${link.summary ? `<div class="link-card-summary">${link.summary}</div>` : ''}
        <div class="link-card-date">Saved ${link.savedAt}</div>
      </div>

      <div class="edit-form">
        <input type="text" class="edit-input edit-url-input" value="${link.url}">
        <input type="text" class="edit-input edit-tag-input" value="${link.tags.join(', ')}">
        <div class="edit-actions">
          <button class="edit-save-btn" data-action="save-edit" data-id="${link.id}">Save</button>
          <button class="edit-cancel-btn" data-action="cancel-edit" data-id="${link.id}">Cancel</button>
        </div>
      </div>
    `;
    /* All buttons now use data-action + data-id instead of separate
       onclick handlers. We read both of these in ONE shared click
       listener further down (event delegation), which keeps things
       simple even though we now have 5 different button types. */

    linksContainer.appendChild(card);
    /* This actually places the card we just built onto the visible page,
       inside our #linksContainer box. */
  });

  /* Step 5e: update the "X links saved" counter at the top */
  linkCountText.textContent = `${links.length} link${links.length === 1 ? '' : 's'} saved`;
  // Dashboard Stats

animateCounter(
  totalLinksText,
  links.length
);

const favoriteCount =
  links.filter(link => link.favorite).length;

animateCounter(
  favoriteLinksText,
  favoriteCount
);

const uniqueTags = new Set();

links.forEach(link => {
  link.tags.forEach(tag => {
    uniqueTags.add(tag);
  });
});

animateCounter(
  totalTagsText,
  uniqueTags.size
);
  /* This little ternary (condition ? this : that) just makes sure we say
     "1 link saved" (singular) instead of "1 links saved" (which sounds wrong). */

  renderTagFilters();
}


/* ---------- STEP 6: Build the tag filter buttons ----------
   These buttons depend entirely on what tags the user has actually used,
   so we can't hardcode them in HTML -- we generate them here instead. */

function renderTagFilters() {
  const allTags = new Set();
  /* A Set is like an array but automatically removes duplicates.
     If 3 links all have the tag "python", it only keeps ONE "python" in the Set. */

  links.forEach(link => {
    link.tags.forEach(tag => allTags.add(tag));
  });

  tagFiltersBox.innerHTML = '';

  if (allTags.size === 0) return;
  /* if there are no tags at all yet, don't bother showing any filter buttons */

  /* Always show an "all" button first, to clear any active filter */
  const allBtn = document.createElement('span');
  allBtn.className = activeTagFilter === null ? 'tag-pill active' : 'tag-pill';
  allBtn.textContent = 'all';
  allBtn.addEventListener('click', () => {
    activeTagFilter = null;
    renderLinks();
  });
  tagFiltersBox.appendChild(allBtn);

  allTags.forEach(tag => {
    const pill = document.createElement('span');
    pill.className = activeTagFilter === tag ? 'tag-pill active' : 'tag-pill';
    pill.textContent = tag;

    pill.addEventListener('click', () => {
      /* addEventListener means "watch for this action, and when it happens,
         run this function". Here we watch for a 'click'. */
      activeTagFilter = tag;
      renderLinks();
      /* clicking a tag re-filters the whole list to show only matching links */
    });

    tagFiltersBox.appendChild(pill);
  });
}


/* ---------- STEP 7: Wire up all the buttons and inputs ----------
   Until now we've only DEFINED what functions do. Nothing actually
   runs them yet. This section connects user actions to those functions. */

addBtn.addEventListener('click', addLink);
/* When the button is clicked, run our addLink function */

urlInput.addEventListener('keypress', event => {
  if (event.key === 'Enter') addLink();
  /* This lets the user press Enter instead of clicking the button --
     small touch, but makes the app feel much nicer to use. */
});

searchInput.addEventListener('input', renderLinks);
/* 'input' fires every single time the text changes (every keystroke),
   so the list filters live as you type, with no "search" button needed. */

linksContainer.addEventListener('click', event => {
  /* Instead of adding a separate click listener to EVERY button on EVERY
     card (which would be wasteful since cards get created/destroyed
     constantly), we listen ONCE on the parent container and check what
     was actually clicked. This pattern is called "event delegation".

     We now have FIVE possible actions instead of just delete, so instead
     of five different "if" checks on classList, we read a single
     data-action attribute and use a switch statement to route to the
     correct function. */

  const button = event.target.closest('[data-action]');
  /* event.target is the EXACT element clicked -- but if the user clicks
     the little icon INSIDE the button rather than the button itself,
     event.target would be the icon, not the button. .closest() walks
     UP the HTML tree and finds the nearest ancestor (or itself) that
     has a data-action attribute, so this works reliably either way. */

  if (!button) return;
  /* if the click happened somewhere with no data-action nearby
     (e.g. clicking empty space in the card), do nothing */

  const action = button.getAttribute('data-action');
  const id = Number(button.getAttribute('data-id'));
  /* getAttribute reads the data-id we stored earlier as text;
     Number() converts it back into an actual number for comparisons */

  switch (action) {
    /* a switch statement is a cleaner way to write many
       "if this, do that, else if this other thing, do something else"
       checks when they all compare the SAME variable (action). */
    case 'favorite':
      toggleFavorite(id);
      break;
    case 'copy':
      copyLink(id, button);
      break;
    case 'summarize':
      summarizeLink(id, button);
      break;
    case 'edit':
      startEdit(id);
      break;
    case 'save-edit':
      saveEdit(id);
      break;
    case 'cancel-edit':
      cancelEdit();
      break;
    case 'delete':
      deleteLink(id);
      break;
  }
});

themeToggle.addEventListener('click', toggleTheme);
/* clicking the moon/sun button runs our toggleTheme function from Step 2b */

sortSelect.addEventListener('change', renderLinks);
/* 'change' fires when the user picks a different option from the
   dropdown. We just re-render the whole list, and our updated
   renderLinks function reads sortSelect.value to decide the order. */
exportBtn.addEventListener('click', exportLinks);
importBtn.addEventListener('click', () => {
  importFile.click();
});
importFile.addEventListener(
  'change',
  importLinks
);

/* ---------- STEP 8: Run everything on page load ---------- */

loadTheme();
loadFromStorage();
renderLinks();
/* loadTheme runs FIRST so the page doesn't "flash" light mode for a
   split second before switching to dark, if dark was the saved choice. */