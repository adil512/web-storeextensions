import type { CategoryName } from "@/lib/category-slugs";
import { SITE_NAME } from "@/lib/brand";
import { CATEGORIES } from "@/lib/constants/listing";

type CategorySeo = {
  metaTitle: string;
  metaDescription: string;
  intro: string;
};

const BY_CATEGORY = {
  Accessibility: {
    metaTitle: "Accessibility Extensions – Discover & Submit Browser Extensions",
    metaDescription:
      "Explore accessibility browser extensions for Chrome, Firefox, and Edge. Discover tools that improve usability, browse listings, and submit your extension.",
    intro:
      "Discover accessibility browser extensions designed to improve usability and inclusivity across the web. Explore tools for screen reading, navigation, and visual enhancements for Chrome, Firefox, and Edge.",
  },
  "Art & Design": {
    metaTitle: "Art & Design Extensions – Creative Browser Tools & Listings",
    metaDescription:
      `Discover art and design browser extensions for Chrome, Firefox, and Edge. Explore creative tools, design resources, and list your extension on ${SITE_NAME}.`,
    intro:
      "Explore art and design browser extensions that help creators work smarter. From color pickers to UI inspiration and design tools, discover creative extensions for Chrome, Firefox, and Edge.",
  },
  Communication: {
    metaTitle: "Communication Extensions – Chat, Email & Messaging Tools",
    metaDescription:
      "Explore communication browser extensions for Chrome, Firefox, and Edge. Discover messaging, email, and collaboration tools, or submit your own extension.",
    intro:
      "Browse communication browser extensions that enhance messaging, email, and collaboration. Discover tools that streamline conversations and improve productivity across Chrome, Firefox, and Edge.",
  },
  "Developer Tools": {
    metaTitle: "Developer Tools Extensions – Web Dev & Coding Tools",
    metaDescription:
      "Discover developer tools extensions for Chrome, Firefox, and Edge. Browse coding, debugging, and web development tools or submit your extension.",
    intro:
      "Find powerful developer tools extensions for coding, debugging, and web development. Explore resources that help developers build, test, and optimize websites directly from their browser.",
  },
  Education: {
    metaTitle: "Education Extensions – Learning & Study Tools",
    metaDescription:
      `Explore education browser extensions for Chrome, Firefox, and Edge. Discover study tools, learning resources, and list your extension on ${SITE_NAME}.`,
    intro:
      "Discover education browser extensions that support learning, research, and productivity. From study tools to online resources, explore extensions designed for students and educators.",
  },
  Entertainment: {
    metaTitle: "Entertainment Extensions – Streaming & Fun Tools",
    metaDescription:
      "Discover entertainment browser extensions for Chrome, Firefox, and Edge. Explore streaming tools, media enhancements, and submit your extension.",
    intro:
      "Explore entertainment browser extensions for streaming, media, and fun experiences. Enhance your browsing with tools designed for videos, music, and interactive content.",
  },
  "Functionality & UI": {
    metaTitle: "UI & Functionality Extensions – Enhance Your Browser Experience",
    metaDescription:
      "Explore UI and functionality browser extensions for Chrome, Firefox, and Edge. Improve usability, customize your browser, and submit your tools.",
    intro:
      "Improve your browsing experience with functionality and UI extensions. Customize your browser, enhance usability, and discover tools that make navigation smoother and more efficient.",
  },
  Games: {
    metaTitle: "Games Extensions – Play & Discover Browser Games",
    metaDescription:
      "Discover browser game extensions for Chrome, Firefox, and Edge. Explore fun and interactive tools or submit your gaming extension.",
    intro:
      "Discover browser game extensions that bring fun and interactive experiences directly to your browser. Explore a variety of games and entertainment tools for Chrome, Firefox, and Edge.",
  },
  Household: {
    metaTitle: "Household Extensions – Everyday Utility Tools",
    metaDescription:
      `Explore household browser extensions for Chrome, Firefox, and Edge. Discover everyday tools and utilities or list your extension on ${SITE_NAME}.`,
    intro:
      "Browse household browser extensions designed for everyday convenience. From simple utilities to practical tools, discover extensions that make daily tasks easier.",
  },
  "Just for Fun": {
    metaTitle: "Fun Extensions – Cool & Fun Browser Tools",
    metaDescription:
      "Discover fun browser extensions for Chrome, Firefox, and Edge. Explore entertaining tools and submit your own fun extension.",
    intro:
      "Explore fun and quirky browser extensions that add personality to your browsing. Discover creative, entertaining, and unique tools built just for enjoyment.",
  },
  Lifestyle: {
    metaTitle: "Lifestyle Extensions – Daily Life & Productivity Tools",
    metaDescription:
      "Explore lifestyle browser extensions for Chrome, Firefox, and Edge. Discover tools for daily life, habits, and submit your extension.",
    intro:
      "Find lifestyle browser extensions that support your daily habits and routines. Explore tools for health, productivity, organization, and personal improvement.",
  },
  "News & Weather": {
    metaTitle: "News & Weather Extensions – Stay Updated Anytime",
    metaDescription:
      `Discover news and weather browser extensions for Chrome, Firefox, and Edge. Stay informed and list your extension on ${SITE_NAME}.`,
    intro:
      "Stay informed with news and weather browser extensions. Get real-time updates, breaking news, and accurate forecasts directly in your browser.",
  },
  "Privacy & Security": {
    metaTitle: "Privacy & Security Extensions – Protect Your Browser",
    metaDescription:
      "Explore privacy and security browser extensions for Chrome, Firefox, and Edge. Discover tools to protect your data and submit your extension.",
    intro:
      "Protect your data with privacy and security browser extensions. Discover tools that block trackers, secure your browsing, and enhance online safety.",
  },
  Shopping: {
    metaTitle: "Shopping Extensions – Deals, Coupons & Tools",
    metaDescription:
      `Discover shopping browser extensions for Chrome, Firefox, and Edge. Find deals, coupons, and list your extension on ${SITE_NAME}.`,
    intro:
      "Discover shopping browser extensions that help you save money and find the best deals. Explore tools for coupons, price tracking, and smarter online shopping.",
  },
  "Social Networking": {
    metaTitle: "Social Networking Extensions – Connect & Share Tools",
    metaDescription:
      "Explore social networking browser extensions for Chrome, Firefox, and Edge. Discover tools for social platforms and submit your extension.",
    intro:
      "Enhance your social experience with social networking browser extensions. Discover tools for sharing, managing accounts, and improving social media productivity.",
  },
  Tools: {
    metaTitle: "Tools Extensions – Essential Browser Utilities",
    metaDescription:
      `Discover useful browser extensions for Chrome, Firefox, and Edge. Explore essential tools and list your extension on ${SITE_NAME}.`,
    intro:
      "Explore essential tools browser extensions that boost productivity and efficiency. Discover utilities that simplify tasks and improve your browsing workflow.",
  },
  Travel: {
    metaTitle: "Travel Extensions – Plan & Explore Trips Easily",
    metaDescription:
      `Explore travel browser extensions for Chrome, Firefox, and Edge. Discover trip planning tools and list your extension on ${SITE_NAME}.`,
    intro:
      "Plan and explore with travel browser extensions designed for convenience. Discover tools for booking, trip organization, and finding the best travel deals.",
  },
  "Well-being": {
    metaTitle: "Well-being Extensions – Health & Mindfulness Tools",
    metaDescription:
      "Discover well-being browser extensions for Chrome, Firefox, and Edge. Explore mental health, focus, and productivity tools or submit your extension.",
    intro:
      "Focus on your health with well-being browser extensions. Discover tools for mindfulness, mental health, focus, and maintaining a balanced digital lifestyle.",
  },
  "Workflow & Planning": {
    metaTitle: "Workflow & Planning Extensions – Productivity & Task Tools",
    metaDescription:
      "Explore workflow and planning browser extensions for Chrome, Firefox, and Edge. Discover task management tools and submit your extension.",
    intro:
      "Boost productivity with workflow and planning browser extensions. Explore tools for task management, organization, and efficient daily planning.",
  },
} as const satisfies Record<CategoryName, CategorySeo>;

export function getCategorySeo(categoryName: CategoryName): CategorySeo {
  return BY_CATEGORY[categoryName];
}
