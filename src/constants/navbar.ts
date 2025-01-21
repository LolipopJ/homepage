import {
  faGithub,
  faSteam,
  faXTwitter,
} from "@fortawesome/free-brands-svg-icons";
import {
  faCommentDots,
  faEnvelope,
  // faFeatherPointed,
  faHeart,
  faHouse,
  faIdCard,
  faLaptopCode,
  faLayerGroup,
  // faRss,
  faTags,
} from "@fortawesome/free-solid-svg-icons";

import { NavbarProps } from "../layouts/navbar";

export const NAVBAR_ITEMS: NavbarProps["items"] = [
  {
    title: "",
    routes: [
      { icon: faHouse, label: "主页", url: "/" },
      { icon: faLaptopCode, label: "作品集", url: "/works" },
      { icon: faIdCard, label: "关于我", url: "/about" },
      { icon: faHeart, label: "朋友们", url: "/friends" },
    ],
  },
  {
    title: "发现博文",
    routes: [
      { icon: faLayerGroup, label: "分类", url: "/categories" },
      { icon: faTags, label: "标签", url: "/tags" },
      // { icon: faFeatherPointed, label: "作者", url: "/authors" },
      // { icon: faRss, label: "RSS", url: "" },
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
        icon: faGithub,
        label: "@LolipopJ",
        url: "https://github.com/LolipopJ",
      },
      {
        icon: faXTwitter,
        label: "@Lolipop_0703",
        url: "https://x.com/Lolipop_0703",
      },
      {
        icon: faSteam,
        label: "@lolipopj_703",
        url: "https://steamcommunity.com/id/lolipopj_703",
      },
      {
        icon: faEnvelope,
        label: "mail@towind.fun",
        url: "mailto:mail@towind.fun",
      },
    ],
  },
];
