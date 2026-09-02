/**
 * Default content for a newly created app.
 *
 * Ported verbatim from the ChaiBuilder CLI (`src/constants.ts` in
 * github.com/chaibuilder/cli) so that a site created by the `/setup` wizard is
 * indistinguishable from one created by `npx chaibuilder-app create`. Keep the
 * two in sync when either changes.
 */

export const DEFAULT_APP_THEME = {
  fontFamily: { heading: "Arial", body: "Arial" },
  borderRadius: "6px",
  colors: {
    background: ["#FFFFFF", "#09090B"],
    foreground: ["#09090B", "#FFFFFF"],
    primary: ["#2563EB", "#3B82F6"],
    "primary-foreground": ["#FFFFFF", "#FFFFFF"],
    secondary: ["#F4F4F5", "#27272A"],
    "secondary-foreground": ["#09090B", "#FFFFFF"],
    muted: ["#F4F4F5", "#27272A"],
    "muted-foreground": ["#71717A", "#A1A1AA"],
    accent: ["#F4F4F5", "#27272A"],
    "accent-foreground": ["#09090B", "#FFFFFF"],
    destructive: ["#EF4444", "#7F1D1D"],
    "destructive-foreground": ["#FFFFFF", "#FFFFFF"],
    border: ["#E4E4E7", "#27272A"],
    input: ["#E4E4E7", "#27272A"],
    ring: ["#2563EB", "#3B82F6"],
    card: ["#FFFFFF", "#09090B"],
    "card-foreground": ["#09090B", "#FFFFFF"],
    popover: ["#FFFFFF", "#09090B"],
    "popover-foreground": ["#09090B", "#FFFFFF"],
  },
} as const;

export const DEFAULT_HOME_SEO = {
  title: "Home",
  jsonLD: "",
  keyword: "",
  noIndex: false,
  ogTitle: "Home",
  noFollow: false,
  metaOther: "",
  description: "",
  canonicalUrl: "",
  ogDescription: "",
} as const;

export function getDefaultHomeSeo(appName: string) {
  return {
    ...DEFAULT_HOME_SEO,
    title: appName,
    ogTitle: appName,
  };
}

export const DEFAULT_BLOCKS = [
  {
    "styles": "#styles:,flex min-h-screen w-full flex-col items-center justify-center bg-background font-sans px-6 py-20",
    "tag": "div",
    "backgroundImage": "",
    "_id": "l5FI82",
    "_type": "Box",
    "_name": "Box",
    "_bid": "OwxCtC"
  },
  {
    "styles": "#styles:,flex w-full max-w-3xl flex-col items-center text-center",
    "tag": "div",
    "backgroundImage": "",
    "_id": "zhiMRX",
    "_parent": "l5FI82",
    "_type": "Box",
    "_name": "Box"
  },
  {
    "styles": "#styles:,w-max mb-6",
    "tag": "picture",
    "backgroundImage": "",
    "_id": "k5d_Ve",
    "_parent": "zhiMRX",
    "_type": "Box",
    "_name": "Picture"
  },
  {
    "styles": "#styles:,h-10 w-auto object-contain",
    "image": "https://www.chaibuilder.com/api/media/file/lockup-horizontal-light-ZUc9GXsCiv.png",
    "width": "300",
    "height": "80",
    "mobileImage": "",
    "mobileWidth": "",
    "mobileHeight": "",
    "alt": "Builder Logo",
    "lazyLoading": "true",
    "_id": "SFozOF",
    "_parent": "k5d_Ve",
    "_type": "Image"
  },
  {
    "tag": "h1",
    "styles": "#styles:,mb-6 text-4xl font-light tracking-tight text-foreground sm:text-5xl lg:text-6xl",
    "content": "Heading goes here",
    "_id": "oRplIE",
    "_parent": "zhiMRX",
    "_type": "Heading",
  },
  {
    "styles": "#styles:,text-black",
    "content": "You're ",
    "_id": "whM8Da",
    "_parent": "oRplIE",
    "_type": "Text"
  },
  {
    "styles": "#styles:,font-medium",
    "content": "all set.",
    "_id": "2nL2QO",
    "_parent": "oRplIE",
    "_type": "Span",
    "tag": "span"
  },
  {
    "styles": "#styles:,mb-10 text-lg font-light leading-relaxed text-muted-foreground",
    "tag": "div",
    "backgroundImage": "",
    "_id": "0F3lxY",
    "_type": "Box",
    "_name": "Box",
    "styles_attrs": {
      "data-animation": "slide-up|ease-out|500|300|once"
    },
    "_bid": "PKG5RN",
    "_parent": "zhiMRX"
  },
  {
    "styles": "#styles:,",
    "content": "Transform your creative vision into reality. Build sophisticated digital interfaces with an intuitive workflow designed for modern excellence.",
    "_id": "sI7F_W",
    "_parent": "0F3lxY",
    "_type": "Span",
    "tag": "span",
    "_bid": "5l92Hf"
  },
  {
    "styles": "#styles:,",
    "tag": "div",
    "backgroundImage": "",
    "_id": "9BBSli",
    "_parent": "zhiMRX",
    "_type": "Box",
    "_name": "Box",
    "styles_attrs": {
      "data-animation": "slide-up|ease-out|500|400|once"
    }
  },
  {
    "styles": "#styles:,dt#btn dt#btn-primary text-base shadow-lg transition-transform rounded-xl hover:bg-primary/80 cursor-pointer px-6 h-10",
    "content": "Link text goes here",
    "link": {
      "href": "/admin/login"
    },
    "prefetchLink": false,
    "_id": "6UhrNg",
    "_parent": "9BBSli",
    "_type": "Link"
  },
  {
    "styles": "#styles:,text-black",
    "content": "GO TO BUILDER ",
    "_id": "_jS0gE",
    "_parent": "6UhrNg",
    "_type": "Text"
  },
  {
    "styles": "#styles:,",
    "icon": "<svg xmlns=\"http://www.w3.org/2000/svg\" class=\"lucide lucide-arrow-right\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M5 12h14m-7-7l7 7l-7 7\"/></svg>",
    "width": 16,
    "height": 16,
    "_id": "83TTNl",
    "_parent": "6UhrNg",
    "_type": "Icon"
  },
  {
    "styles": "#styles:,w-full max-w-5xl mt-8",
    "tag": "div",
    "backgroundImage": "",
    "_id": "UZxT74",
    "_parent": "l5FI82",
    "_type": "Box",
    "_name": "Box",
    "styles_attrs": {
      "data-animation": "fade-in|ease-out|600|500|once"
    }
  },
  {
    "tag": "h2",
    "styles": "#styles:,mb-12 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground",
    "content": "Helpful Resources",
    "_id": "PixjCR",
    "_parent": "UZxT74",
    "_type": "Heading"
  },
  {
    "styles": "#styles:,grid grid-cols-1 gap-6 md:grid-cols-3",
    "tag": "div",
    "backgroundImage": "",
    "_id": "Mo40Xe",
    "_type": "Box",
    "_name": "Box",
    "_bid": "iP9UO7",
    "_parent": "UZxT74"
  },
  {
    "styles": "#styles:,group relative block rounded-xl border bg-card text-card-foreground shadow transition-colors hover:bg-accent/50 p-4",
    "content": "Link text goes here",
    "link": {
      "type": "url",
      "href": "https://www.chaibuilder.com/docs/media/storage-configuration",
      "target": "_blank"
    },
    "prefetchLink": false,
    "_id": "qtezIn",
    "_parent": "Mo40Xe",
    "_type": "Link",
    "styles_attrs": {
      "rel": "noopener noreferrer"
    },
    "_bid": "2hdOJx"
  },
  {
    "styles": "#styles:,absolute right-6 top-6 text-muted-foreground transition-transform group-hover:-translate-y-1 group-hover:translate-x-1",
    "icon": "<svg xmlns=\"http://www.w3.org/2000/svg\" class=\"lucide lucide-arrow-up-right\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M7 7h10v10M7 17L17 7\"/></svg>",
    "width": "20",
    "height": "20",
    "_id": "CdCzAM",
    "_parent": "qtezIn",
    "_type": "Icon"
  },
  {
    "styles": "#styles:,mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary",
    "tag": "div",
    "backgroundImage": "",
    "_id": "uQAxpQ",
    "_parent": "qtezIn",
    "_type": "Box",
    "_name": "Box",
    "_bid": "wqYiYg"
  },
  {
    "styles": "#styles:,",
    "icon": "<svg xmlns=\"http://www.w3.org/2000/svg\" class=\"lucide lucide-image\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"><rect width=\"18\" height=\"18\" x=\"3\" y=\"3\" rx=\"2\" ry=\"2\"/><circle cx=\"9\" cy=\"9\" r=\"2\"/><path d=\"m21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21\"/></g></svg>",
    "width": "20",
    "height": "20",
    "_id": "wSimiY",
    "_parent": "uQAxpQ",
    "_type": "Icon",
    "_bid": "_jUBGp"
  },
  {
    "tag": "h3",
    "styles": "#styles:,mb-2 font-semibold leading-none tracking-tight",
    "content": "Handling Assets ",
    "_id": "Fh9hO5",
    "_parent": "qtezIn",
    "_type": "Heading",
    "_bid": "sI2_zE"
  },
  {
    "styles": "#styles:,rte text-sm text-muted-foreground",
    "content": "<p>Manage images and media files</p>",
    "_id": "xVWu3m",
    "_parent": "qtezIn",
    "_type": "Paragraph",
    "_bid": "dQWFLv"
  },
  {
    "styles": "#styles:,group relative block rounded-xl border bg-card text-card-foreground shadow transition-colors hover:bg-accent/50 p-4",
    "content": "Link text goes here",
    "link": {
      "type": "url",
      "href": "https://www.chaibuilder.com/docs/ai/setup",
      "target": "_blank"
    },
    "prefetchLink": false,
    "_id": "9FFi6G",
    "_parent": "Mo40Xe",
    "_type": "Link",
    "styles_attrs": {
      "rel": "noopener noreferrer"
    },
    "_bid": "4k_1sP"
  },
  {
    "styles": "#styles:,absolute right-6 top-6 text-muted-foreground transition-transform group-hover:-translate-y-1 group-hover:translate-x-1",
    "icon": "<svg xmlns=\"http://www.w3.org/2000/svg\" class=\"lucide lucide-arrow-up-right\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M7 7h10v10M7 17L17 7\"/></svg>",
    "width": "20",
    "height": "20",
    "_id": "xfg9NQ",
    "_parent": "9FFi6G",
    "_type": "Icon"
  },
  {
    "styles": "#styles:,mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary",
    "tag": "div",
    "backgroundImage": "",
    "_id": "-l9x_R",
    "_parent": "9FFi6G",
    "_type": "Box",
    "_name": "Box",
    "_bid": "sg4HVX"
  },
  {
    "styles": "#styles:,",
    "icon": "<svg xmlns=\"http://www.w3.org/2000/svg\" class=\"lucide lucide-bot\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"><path d=\"M12 8V4H8\"/><rect width=\"16\" height=\"12\" x=\"4\" y=\"8\" rx=\"2\"/><path d=\"M2 14h2m16 0h2m-7-1v2m-6-2v2\"/></g></svg>",
    "width": "20",
    "height": "20",
    "_id": "68T1eL",
    "_parent": "-l9x_R",
    "_type": "Icon",
    "_bid": "4_3khd"
  },
  {
    "tag": "h3",
    "styles": "#styles:,mb-2 font-semibold leading-none tracking-tight",
    "content": "Adding AI ",
    "_id": "lLn1ii",
    "_parent": "9FFi6G",
    "_type": "Heading",
    "_bid": "pxr0eR"
  },
  {
    "styles": "#styles:,rte text-sm text-muted-foreground",
    "content": "<p>Integrate AI capabilities easily</p>",
    "_id": "Ld_D8A",
    "_parent": "9FFi6G",
    "_type": "Paragraph",
    "_bid": "YztphK"
  },
  {
    "styles": "#styles:,group relative block rounded-xl border bg-card text-card-foreground shadow transition-colors hover:bg-accent/50 p-4",
    "content": "Link text goes here",
    "link": {
      "href": "https://www.chaibuilder.com/docs",
      "target": "_blank"
    },
    "prefetchLink": false,
    "_id": "uI_ECf",
    "_parent": "Mo40Xe",
    "_type": "Link",
    "styles_attrs": {
      "rel": "noopener noreferrer"
    },
    "_bid": "-JdIBN"
  },
  {
    "styles": "#styles:,absolute right-6 top-6 text-muted-foreground transition-transform group-hover:-translate-y-1 group-hover:translate-x-1",
    "icon": "<svg xmlns=\"http://www.w3.org/2000/svg\" class=\"lucide lucide-arrow-up-right\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M7 7h10v10M7 17L17 7\"/></svg>",
    "width": "20",
    "height": "20",
    "_id": "GzM5aC",
    "_parent": "uI_ECf",
    "_type": "Icon"
  },
  {
    "styles": "#styles:,mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary",
    "tag": "div",
    "backgroundImage": "",
    "_id": "Kbxgw-",
    "_parent": "uI_ECf",
    "_type": "Box",
    "_name": "Box",
    "_bid": "TPvLCl"
  },
  {
    "styles": "#styles:,",
    "icon": "<svg xmlns=\"http://www.w3.org/2000/svg\" class=\"lucide lucide-file-text\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"><path d=\"M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z\"/><path d=\"M14 2v5a1 1 0 0 0 1 1h5M10 9H8m8 4H8m8 4H8\"/></g></svg>",
    "width": "20",
    "height": "20",
    "_id": "8Zt6Ah",
    "_parent": "Kbxgw-",
    "_type": "Icon",
    "_bid": "iuib0K"
  },
  {
    "tag": "h3",
    "styles": "#styles:,mb-2 font-semibold leading-none tracking-tight",
    "content": "Full Documentation ",
    "_id": "YOYUn0",
    "_parent": "uI_ECf",
    "_type": "Heading",
    "_bid": "e1dvE2"
  },
  {
    "styles": "#styles:,rte text-sm text-muted-foreground",
    "content": "<p>Explore all features and guides</p>",
    "_id": "kCL0QX",
    "_parent": "uI_ECf",
    "_type": "Paragraph",
    "_bid": "ex_f3a"
  }
] as const;
