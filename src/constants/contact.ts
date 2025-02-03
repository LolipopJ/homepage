import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faGithub,
  faSteam,
  faXTwitter,
} from "@fortawesome/free-brands-svg-icons";

export interface ContactItem {
  icon: IconDefinition;
  url: string;
}

export const CONTACT_ITEMS: ContactItem[] = [
  {
    icon: faGithub,
    url: "https://github.com/LolipopJ",
  },
  {
    icon: faXTwitter,
    url: "https://x.com/Lolipop_0703",
  },
  {
    icon: faSteam,
    url: "https://steamcommunity.com/id/lolipopj_703",
  },
];
