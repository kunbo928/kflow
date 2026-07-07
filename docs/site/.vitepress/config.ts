import { defineConfig } from "vitepress";

export default defineConfig({
  title: "kflow",
  description:
    "Cross-platform AI coding workflow skill pack — orchestrate the software lifecycle with humans in the loop.",
  lang: "en-US",
  lastUpdated: true,
  cleanUrls: true,

  themeConfig: {
    nav: [
      { text: "Home", link: "/" },
      { text: "Getting Started", link: "/guide/getting-started" },
      { text: "CLI", link: "/cli/init" },
      { text: "Workflows", link: "/workflows/k-flow" },
      { text: "Platforms", link: "/platforms/codex" },
      { text: "Concepts", link: "/concepts/" },
      { text: "Upgrade", link: "/upgrade/" },
    ],

    sidebar: {
      "/guide/": [
        {
          text: "Getting Started",
          items: [{ text: "Getting Started", link: "/guide/getting-started" }],
        },
      ],

      "/cli/": [
        {
          text: "CLI Reference",
          items: [
            { text: "init", link: "/cli/init" },
            { text: "sync", link: "/cli/sync" },
            { text: "upgrade", link: "/cli/upgrade" },
            { text: "doctor", link: "/cli/doctor" },
            { text: "install", link: "/cli/install" },
            { text: "search", link: "/cli/search" },
            { text: "validate", link: "/cli/validate" },
          ],
        },
      ],

      "/workflows/": [
        {
          text: "Workflows",
          items: [{ text: "k-flow", link: "/workflows/k-flow" }],
        },
      ],

      "/platforms/": [
        {
          text: "Platform Guides",
          items: [
            { text: "Codex", link: "/platforms/codex" },
            { text: "Cursor", link: "/platforms/cursor" },
            { text: "Claude Code", link: "/platforms/claude" },
            { text: "OpenCode", link: "/platforms/opencode" },
          ],
        },
      ],

      "/concepts/": [
        {
          text: "Concepts",
          items: [{ text: "Concepts", link: "/concepts/" }],
        },
      ],

      "/upgrade/": [
        {
          text: "Upgrade & Sync",
          items: [
            { text: "Upgrade & Sync", link: "/upgrade/" },
            { text: "Dependency Policy", link: "/upgrade/dependencies" },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: "github", link: "https://github.com/kunboz/kflow" },
    ],
  },
});
