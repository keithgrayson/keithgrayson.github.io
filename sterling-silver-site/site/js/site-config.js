/* =========================================================
   SITE CONFIG
   Everything that repeats on every page (masthead, nav,
   promo banner, footer) lives here. To reuse this template
   for a different pattern/site, this is usually the only
   file that needs new copy — css/style.css and js/main.js
   can stay untouched.
   ========================================================= */

var SITE = {

  siteName: "Sterling Silver Flatware Patterns",
  tagline: "Sterling Silver Flatware",

  // top-right masthead link out to the affiliate storefront
  affiliate: {
    text: "Find Sterling Silver Flatware Patterns",
    url: "http://www.antiquecupboard.com/"
  },

  // promo banner shown near the top of every page
  promo: {
    heading: "www.antiquecupboard.com",
    body: "Antique Cupboard carries an extensive inventory of sterling silver flatware patterns, replacement pieces, and hollowware.",
    ctaText: "Click Here to find Sterling Silver",
    url: "http://www.antiquecupboard.com"
  },

  // primary navigation — set page "id" to match each page's <body data-page="...">
  nav: [
    { label: "Home",   href: "index.html",  id: "home" },
    { label: "News",   href: "news.html",   id: "news" },
    { label: "Videos", href: "videos.html", id: "videos" },
    {
      label: "Services",
      href: "#",
      id: "services",
      children: [
        { label: "About", href: "about.html", id: "about" }
      ]
    }
  ],

  footer: {
    note: "Content aggregated for informational purposes. Videos courtesy of their respective YouTube channels; news excerpts link out to their original publishers.",
    copyrightHolder: "Sterling Silver Flatware Patterns"
  }

};
