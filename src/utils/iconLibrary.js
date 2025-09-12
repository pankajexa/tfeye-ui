import React from "react";
import { FaHome, FaRegShareSquare, FaMinus } from "react-icons/fa";
import {
  MdDashboard,
  MdSettings,
  MdVisibility,
  MdVisibilityOff,
  MdOutlineCheckCircle,
  MdOutlineMoreVert,
  MdPausePresentation,
  MdCalendarMonth,
  MdNotificationsNone,
} from "react-icons/md";
import {
  FiEdit2,
  FiLogOut,
  FiMessageSquare,
  FiPlayCircle,
  FiUser,
  FiUsers,
  FiAward,
  FiBarChart2,
} from "react-icons/fi";
import {
  FaPlus,
  FaCheck,
  FaListUl,
  FaArrowRightFromBracket,
  FaArrowRight,
  FaRegImage,
} from "react-icons/fa6";
import {
  IoAlertCircleOutline,
  IoImageOutline,
  IoCheckmarkSharp,
  IoCheckmarkDoneSharp,
  IoChevronDown,
  IoChevronUp,
  IoPlayOutline,
  IoArrowBackOutline,
  IoSettingsOutline,
} from "react-icons/io5";
import {
  PiFilmStrip,
  PiEye,
  PiWaveformBold,
  PiHeadsetBold,
} from "react-icons/pi";
import {
  LuType,
  LuSendHorizonal,
  LuClock,
  LuRefreshCw,
  LuDownloadCloud,
  LuBellRing,
  LuDot,
  LuKeyRound,
  LuTable,
  LuExpand,
  LuLayers,
} from "react-icons/lu";
import { CgFileDocument } from "react-icons/cg";
import {
  IoMdInformationCircleOutline,
  IoMdClose,
  IoMdBook,
} from "react-icons/io";
import { Music, GripVertical } from "lucide-react";
import { CiSearch, CiCalendar, CiFilter, CiMail } from "react-icons/ci";
import { GrShare } from "react-icons/gr";
import {
  TbLayoutGrid,
  TbOctagonOff,
  TbClockCheck,
  TbMessage,
} from "react-icons/tb";
import {
  RiDeleteBinLine,
  RiVerifiedBadgeLine,
  RiHourglassLine,
  RiArrowGoBackLine,
  RiHeadphoneLine,
  RiMusic2Fill,
} from "react-icons/ri";
import {
  GoDesktopDownload,
  GoQuestion,
  GoZap,
  GoShareAndroid,
} from "react-icons/go";
import { HiOutlineDuplicate, HiOutlineChatAlt2 } from "react-icons/hi";
import { BiArchiveIn, BiArchiveOut, BiMessageX, BiDisc } from "react-icons/bi";
import { TfiAnnouncement } from "react-icons/tfi";
import { HiOutlineBolt } from "react-icons/hi2";
import { RxCaretSort, RxQuestionMarkCircled } from "react-icons/rx";
import { LiaPauseCircle, LiaReplySolid } from "react-icons/lia";
import { SlPhone } from "react-icons/sl";
import { BsCopy } from "react-icons/bs";
import { AiOutlineAudio } from "react-icons/ai";

const iconMap = {
  home: FaHome,
  dashboard: MdDashboard,
  systemSettings: MdSettings,

  // Used icons in applications

  edit: FiEdit2,
  delete: RiDeleteBinLine,
  plus: FaPlus,
  alert: IoAlertCircleOutline,
  eye: MdVisibility,
  eyeOff: MdVisibilityOff,
  image: IoImageOutline,
  text: LuType,
  filter: CiFilter,
  video: PiFilmStrip,
  document: CgFileDocument,
  check: MdOutlineCheckCircle,
  info: IoMdInformationCircleOutline,
  user: FiUser,
  close: IoMdClose,
  send: LuSendHorizonal,
  downArr: IoChevronDown,
  upArr: IoChevronUp,
  clock: LuClock,
  audio: Music,
  backArrow: RiArrowGoBackLine,
  tick: FaCheck,
  bell: LuBellRing,
  exit: FiLogOut,
  search: CiSearch,
  share: FaRegShareSquare,
  maximum: GrShare,
  dots: MdOutlineMoreVert,
  dot: LuDot,
  list: FaListUl,
  grid: TbLayoutGrid,
  desktop: GoDesktopDownload,
  refresh: LuRefreshCw,
  import: LuDownloadCloud,
  duplicate: HiOutlineDuplicate,
  archive: BiArchiveIn,
  unarchive: BiArchiveOut,
  badge: RiVerifiedBadgeLine,
  book: IoMdBook,
  message: BiMessageX,
  sent: IoCheckmarkSharp,
  delivered: IoCheckmarkDoneSharp,
  announce: TfiAnnouncement,
  calendar: CiCalendar,
  hourGlass: RiHourglassLine,
  question: GoQuestion,
  view: PiEye,
  circlePlay: FiPlayCircle,
  block: TbOctagonOff,
  logout: FaArrowRightFromBracket,
  play: IoPlayOutline,
  pause: MdPausePresentation,
  bolt: HiOutlineBolt,
  code: RxCaretSort,
  circlePause: LiaPauseCircle,
  call: SlPhone,
  messageIcon: FiMessageSquare,
  zap: GoZap,
  headPhones: RiHeadphoneLine,
  tone: PiWaveformBold,
  disc: BiDisc,
  users: FiUsers,
  tags: FiAward,
  key: LuKeyRound,
  arrowLeft: IoArrowBackOutline,
  mail: CiMail,
  table: LuTable,
  rightArrow: FaArrowRight,
  copy: BsCopy,
  minus: FaMinus,
  expand: LuExpand,
  respond: LiaReplySolid,
  calendarMonth: MdCalendarMonth,
  clockCheck: TbClockCheck,
  charts: FiBarChart2,
  layers: LuLayers,
  inbox: HiOutlineChatAlt2,
  messages: TbMessage,
  notification: MdNotificationsNone,
  settings: IoSettingsOutline,
  media: FaRegImage,
  headset: PiHeadsetBold,
  questionMarkCircled: RxQuestionMarkCircled,
  gripVertical: GripVertical,
  music: RiMusic2Fill,
  record: AiOutlineAudio,
  shareIt: GoShareAndroid,
};

const Icon = ({
  name,
  size = 16,
  color = "currentColor",
  className = "",
  type = "icon",
}) => {
  const IconComponent = iconMap[name];
  if (!IconComponent) {
    return null;
  }
  if (type === "icon" && typeof IconComponent === "function") {
    return <IconComponent size={size} color={color} className={className} />;
  } else {
    console.error(
      `Invalid type for ${name}: Expected ${
        type === "icon" ? "SVG Component" : "Image Path"
      }`
    );
    return null;
  }
};

export default Icon;
