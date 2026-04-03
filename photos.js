/**
 * ============================================================
 *  HAYDN 3A — PHOTO CONFIGURATION
 *  Edit this file to add, remove, or reorder your photos.
 * ============================================================
 *
 *  HOW TO ADD A PHOTO:
 *  1. Drop your image into the /images/ folder
 *  2. Add a new entry to the correct category below
 *  3. Save and refresh — done!
 *
 *  FIELDS:
 *    src       — path to your image (relative to index.html)
 *    title     — name shown in the lightbox
 *    location  — optional location tag
 *    date      — optional date string
 *    gear      — optional camera / lens info
 *    featured  — true = shown in hero carousel
 */

const PHOTOS = {

  aviation: [
    {
      src: "https://i.postimg.cc/wv9pqZDT/IMG_8052.jpg",
      title: "Final Approach",
      location: "RAF Lakenheath, UK",
      date: "2026",
      gear: "Canon EOS 2000d · 250mm",
      featured: true
    },
    {
      src: "https://i.postimg.cc/dQ4q1sHF/IMG_6738.jpg",
      title: "Formation Break",
      location: "Cobra Warrior, RAF Waddington, UK",
      date: "2026",
      gear: "Canon EOS 2000d · 250mm",
      featured: false
    },
    {
      src: "https://i.postimg.cc/qRpTJS2p/IMG_8002.jpg",
      title: "F-35 Go-Around",
      location: "RAF Lakenheath, UK",
      date: "2026",
      featured: false
    },
        {
      src: "https://i.postimg.cc/bYDhzxtx/IMG_6144_2.png",
      title: "Two F-35's On Final",
      location: "RAF Lakenheath, UK",
      date: "2026",
      featured: false
    },  
      {
      src: "https://i.postimg.cc/MX2tx2j4/IMG_5694.png",
      title: "F-35 On Final",
      location: "RAF Lakenheath, UK",
      date: "2026",
      featured: true
    }, 
       {
      src: "https://i.postimg.cc/c6yTZy82/IMG_5705.png",
      title: "Two F-22's Preparing To Leave",
      location: "RAF Lakenheath, UK",
      date: "2026",
      featured: false
    }, 
       {
      src: "https://i.postimg.cc/1tMZfBKJ/IMG_8519.jpg",
      title: "Six Resting Hogs",
      location: "RAF Lakenheath, UK",
      date: "2026",
      featured: true
    }
  ],

  architecture: [
    {
      src: "https://i.postimg.cc/fbxbvkX9/2025_11_27_13_27_24_(1).jpg",
      title: "Golden Eagle",
      location: "Peterborough Cathedral, UK",
      date: "2026",
      featured: true
    },
    {
      src: "https://i.postimg.cc/BvxvCtDP/2025_11_27_13_27_46.jpg",
      title: "Queen Katherine's Grave",
      location: "Peterborough Cathedral, UK",
      date: "2026",
      featured: false
    },
    {
      src: "https://i.postimg.cc/CKjK4dDZ/2025_11_27_13_27_41_(1).jpg",
      title: "Jesus",
      location: "Peterborough Cathedral, UK",
      date: "2026",
      featured: false
    }
  ],

  astrophotography: [
    {
      src: "https://i.postimg.cc/9FhHG1bn/2026_01_24_14_19_26.jpg",
      title: "The Great Orion Nebula",
      featured: true
    },
    {
      src: "https://i.postimg.cc/Vv9TGQgh/2026_01_01_18_47_34.jpg",
      title: "Our Moon",
      featured: false
    },
    {
      src: "https://i.postimg.cc/0j1F02YW/2026_01_24_14_19_26_1.jpg",
      featured: false
    }
  ]

};

// ── SITE META ───────────────────────────────────────────────
const SITE = {
  name: "HAYDN 3A",
  tagline: "Aviation · Architecture · Astrophotography",
  bio: "Capturing the extraordinary — from runways to rooftops to the edge of the universe.",
  social: {
    instagram: "#",   // e.g. "https://instagram.com/yourhandle"
    twitter:   "https://x.com/EnglishPhoto",
    email:     "mailto:Haydn3A@outlook.com"    // e.g. "mailto:you@example.com"
  }
};
