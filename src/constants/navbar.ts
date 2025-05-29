import { faGithub, faSteam } from "@fortawesome/free-brands-svg-icons";
import {
  faCommentDots,
  faEnvelope,
  faFolder,
  // faFeatherPointed,
  // faHeart,
  faHouse,
  faIdCard,
  faRss,
  // faLaptopCode,
  // faRss,
  faTags,
} from "@fortawesome/free-solid-svg-icons";

import { NavbarProps, Route } from "../layouts/navbar";

export const FOOTER_SOCIAL_ITEMS: Route[] = [
  {
    icon: faRss,
    label: "RSS",
    url: "/rss.xml",
  },
  {
    icon: faGithub,
    label: "@LolipopJ",
    url: "https://github.com/LolipopJ",
  },
  {
    icon: faSteam,
    label: "@lolipopj_703",
    url: "https://steamcommunity.com/id/lolipopj_703",
  },
];

export const NAVBAR_ITEMS: NavbarProps["items"] = [
  {
    title: "",
    routes: [
      {
        icon: faHouse,
        label: "主页",
        url: "/",
      },
      // { icon: faLaptopCode, label: "作品集", url: "/works/" },
      {
        icon: faIdCard,
        label: "关于我",
        url: "/about-me/",
      },
      // { icon: faHeart, label: "朋友们", url: "/friends/" },
    ],
  },
  {
    title: "发现博客",
    routes: [
      {
        icon: faFolder,
        label: "分类",
        url: "/categories/",
        regexp: /^\/categories\//,
      },
      {
        icon: faTags,
        label: "标签",
        url: "/tags/",
        regexp: /^\/tags\//,
      },
      // { icon: faFeatherPointed, label: "作者", url: "/authors/", regexp: /^\/authors\// },
      // { icon: faRss, label: "RSS", url: "/rss/" },
    ],
  },
  {
    title: "找到博主",
    routes: [
      {
        icon: faCommentDots,
        label: "时间线",
        url: "https://timeline.towind.fun",
      },
      {
        icon: faEnvelope,
        label: "mail@towind.fun",
        url: "mailto:mail@towind.fun",
      },
      {
        icon: faGithub,
        label: "@LolipopJ",
        url: "https://github.com/LolipopJ",
      },
      {
        icon: faSteam,
        label: "@lolipopj_703",
        url: "https://steamcommunity.com/id/lolipopj_703",
      },
    ],
  },
];
