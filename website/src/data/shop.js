// La Foi Designs — Shop catalog
// A small companion line: lamps, humidifiers, lighting accessories and care kits.
// These are SAMPLE products curated to live alongside La Foi ceilings.
// All Unsplash IDs verified working — pulled from existing usage on the site.

const U = (id, w = 1200, q = 80) => `https://images.unsplash.com/photo-${id}?w=${w}&q=${q}`

export const shopCategories = [
  'All',
  'Lamps',
  'Humidifiers',
  'Lighting Accessories',
  'Care Kits',
]

export const shopProducts = [
  // ---------- LAMPS (5) ------------------------------------------------------
  {
    slug: 'linear-pendant-brass',
    name: 'Linear Pendant — Brass',
    category: 'Lamps',
    price: 240,
    priceUnit: 'USD',
    shortDesc: 'A long, slim profile that reads like a horizon line above a dining table.',
    longDesc:
      'Solid brass extrusion with a frosted lower diffuser. Designed to sit just above eye level over a dining table or kitchen island, throwing soft downlight without glare. Pairs beautifully with matte stretch ceilings — the brass picks up the warm reflection of the membrane below.',
    images: [U('1540932239986-30128078f3c5', 1200, 85)],
    featured: true,
  },
  {
    slug: 'sculpted-table-lamp-onyx',
    name: 'Sculpted Table Lamp — Onyx',
    category: 'Lamps',
    price: 180,
    priceUnit: 'USD',
    shortDesc: 'A hand-finished onyx base supporting a parchment shade.',
    longDesc:
      'A small sculptural object that happens to give light. The onyx base is hand-finished to a soft sheen; the shade is parchment-style fabric. Warm 2700K bulb included. Sits well on a console, bedside, or as a reading lamp by a low chair.',
    images: [U('1573676386604-78f8ed228e2b', 1200, 85)],
    featured: true,
  },
  {
    slug: 'vertical-floor-beam-matte-black',
    name: 'Vertical Floor Beam — Matte Black',
    category: 'Lamps',
    price: 320,
    priceUnit: 'USD',
    shortDesc: 'A slim 1.8m floor lamp that leans toward an architectural reading.',
    longDesc:
      'A precision-machined matte black floor lamp with a single articulating head. Slim base footprint (220mm) makes it suitable for tight reading nooks or beside a sofa arm. 12W LED, dimmable. Designed for rooms with a minimalist palette.',
    images: [U('1718049720099-a035f05e539a', 1200, 85)],
    featured: false,
  },
  {
    slug: 'wall-sconce-warm-diffuser',
    name: 'Wall Sconce — Warm Diffuser',
    category: 'Lamps',
    price: 130,
    priceUnit: 'USD',
    shortDesc: 'A soft uplight sconce that washes the wall without hotspots.',
    longDesc:
      'A discreet wall sconce engineered to wash the wall above with even, indirect light. Useful in hallways, stairwells, and either side of a fireplace. Hardwired, IP44, available in matte black and brushed brass.',
    images: [U('1762631817831-c3e7ee1b1467', 1200, 85)],
    featured: false,
  },
  {
    slug: 'ceiling-drum-translucent-white',
    name: 'Ceiling Drum — Translucent White',
    category: 'Lamps',
    price: 210,
    priceUnit: 'USD',
    shortDesc: 'A flush ceiling fixture for spaces where the ceiling itself is the feature.',
    longDesc:
      'A low-profile drum fitting designed to sit flush against the ceiling. Translucent white acrylic body, brushed steel ring, integrated 24W LED. Pairs especially well below — or beside — translucent backlit stretch membranes where the goal is even, glare-free overhead light.',
    images: [U('1764961576606-ffb05ace4062', 1200, 85)],
    featured: true,
  },

  // ---------- HUMIDIFIERS (3) ------------------------------------------------
  {
    slug: 'compact-mist-humidifier',
    name: 'Compact Mist Humidifier',
    category: 'Humidifiers',
    price: 45,
    priceUnit: 'USD',
    shortDesc: 'A bedside humidifier sized for a single room.',
    longDesc:
      '1.8L tank, ultrasonic cool mist, near-silent operation (under 30 dB). Suited to bedrooms and small studies. An easy companion to stretch ceilings during dry months — humidity around 40-55% keeps interior surfaces stable.',
    images: [U('1605671507162-43e526ef6f97', 1200, 85)],
    featured: false,
  },
  {
    slug: 'premium-ceramic-humidifier',
    name: 'Premium Ceramic Humidifier',
    category: 'Humidifiers',
    price: 110,
    priceUnit: 'USD',
    shortDesc: 'A ceramic-bodied humidifier designed to sit out in a living room.',
    longDesc:
      'A 3.5L glazed ceramic humidifier with a hidden water tank and a soft amber night light. Designed to be left visible — it reads as an object, not an appliance. Auto-shutoff, 36-hour runtime on low.',
    images: [U('1635749886064-8debe661b70e', 1200, 85)],
    featured: false,
  },
  {
    slug: 'tower-humidifier-smart',
    name: 'Tower Humidifier — Smart',
    category: 'Humidifiers',
    price: 180,
    priceUnit: 'USD',
    shortDesc: 'A floor-standing tower humidifier with a humidity sensor and app control.',
    longDesc:
      '6L tank with built-in hygrometer that adjusts output to maintain a target humidity (configurable in the companion app). Useful for larger living spaces or open-plan rooms. Wi-Fi enabled, works with most home automation systems.',
    images: [U('1768471569643-717e823b5f9a', 1200, 85)],
    featured: true,
  },

  // ---------- LIGHTING ACCESSORIES (2) ---------------------------------------
  {
    slug: 'led-dimmer-module',
    name: 'LED Dimmer Module',
    category: 'Lighting Accessories',
    price: 35,
    priceUnit: 'USD',
    shortDesc: 'A trailing-edge dimmer module compatible with most modern LED fixtures.',
    longDesc:
      'Trailing-edge phase dimmer with a 1-100W LED load range. Replaces a standard light switch in a single back box. Smooth low-end dimming without flicker. Available in single and double gang plates.',
    images: [U('1611591594311-6eb9b7c7e340', 1200, 85)],
    featured: false,
  },
  {
    slug: 'magnetic-track-adapter',
    name: 'Magnetic Track Adapter',
    category: 'Lighting Accessories',
    price: 55,
    priceUnit: 'USD',
    shortDesc: 'A retrofit adapter that converts a standard track to our magnetic system.',
    longDesc:
      '48V magnetic track adapter — clips into existing 240V track and exposes a low-voltage rail for our magnetic spot, linear and pendant heads. Allows reconfiguring of a lighting layout without rewiring.',
    images: [U('1742196642261-b1b232abf483', 1200, 85)],
    featured: false,
  },

  // ---------- CARE KITS (2) --------------------------------------------------
  {
    slug: 'stretch-membrane-cleaning-kit',
    name: 'Stretch Membrane Cleaning Kit',
    category: 'Care Kits',
    price: 30,
    priceUnit: 'USD',
    shortDesc: 'Everything you need to keep a stretch ceiling looking like the day it was installed.',
    longDesc:
      'pH-neutral cleaning concentrate (250ml), two ultra-soft microfibre cloths, lint-free polishing pad, and a printed care guide. Safe for matte, satin, gloss and translucent membranes. One kit covers approx. 40m² of ceiling for several years.',
    images: [U('1648735257013-2fb9604b15c6', 1200, 85)],
    featured: false,
  },
  {
    slug: 'led-polish-microfibre-set',
    name: 'LED Polish & Microfibre Set',
    category: 'Care Kits',
    price: 20,
    priceUnit: 'USD',
    shortDesc: 'A small kit for keeping pendants, sconces and fittings dust-free.',
    longDesc:
      'Anti-static LED polish (100ml), three fine microfibre cloths, and a soft long-handle duster suited to high pendants and ceiling fittings. Designed to lift dust without scratching diffusers, brass or anodised aluminium.',
    images: [U('1714058948946-8fc9c3fa6a67', 1200, 85)],
    featured: false,
  },
]

export const featuredShopProducts = shopProducts.filter((p) => p.featured)
