import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  BarChart3,
  FileText,
  CheckCircle,
  XCircle,
  Megaphone,
  MessageCircle,
  Target,
  BookOpen,
  Settings,
  LogOut,
  Upload,
} from "lucide-react";
import { useChallanContext } from "../../context/ChallanContext";
import { Button } from "../ui/button";
import { useAuth } from "../../context/AuthContext";
import { Modal } from "../ui/modal";
import logo from "../../../assets/images/SB_Main_logo.svg";

interface NavbarProps {
  pathname: string;
}

const Navbar: React.FC<NavbarProps> = ({ pathname }) => {
  const { currentOfficer, logout } = useAuth();
  const [showConfirm, setShowConfirm] = useState(false);

  const navigationItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: BarChart3,
      isActive: pathname === "/dashboard",
    },

    {
      title: "Review Pending",
      url: "/pending-review",
      icon: FileText,
      count: 0,
      isActive: pathname.startsWith("/pending-review"),
    },
    // {
    //   title: "Challans Generated",
    //   url: "/upload",
    //   icon: CheckCircle,
    //   count:  0,
    //   isActive: pathname === "/upload",
    // },
    {
      title: "Challans Generated",
      url: "/challans-generated",
      icon: CheckCircle,
      count: 0,
      isActive: pathname.startsWith("/challans-generated"),
    },

    {
      title: "Challans Rejected",
      url: "/challans-rejected",
      icon: XCircle,
      count: 0,
      isActive: pathname.startsWith("/challans-rejected"),
    },
    {
      title: "Bulk Upload",
      url: "/bulk-upload",
      icon: Upload,
      isActive: pathname === "/bulk-upload",
    },
  ];

  const supportItems = [
    {
      title: "Support",
      icon: Target,
      url: "/support",
    },
    {
      title: "Documentation",
      icon: BookOpen,
      url: "/docs",
    },
    {
      title: "Settings",
      icon: Settings,
      url: "/settings",
    },
  ];

  return (
    <div className="left-0 top-0 h-screen w-[250px] shrink-0 bg-gray-900 border-r border-[#16213e] flex flex-col">
      {/* Logo Section */}
      <div className="flex items-center gap-3 px-6 py-6">
        <div>
          <img src={logo} alt="logo" className="h-[32px]" />
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 px-4">
        <nav className="space-y-2">
          {navigationItems?.map((item, index) => {
            const Icon = item?.icon;
            const isActive = item?.isActive;

            return (
              <NavLink
                key={index}
                to={item.url}
                className={`group flex font-normal text-base items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-gray-50 text-gray-800 relative border-l-4 border-purple-500"
                    : "text-gray-300 hover:bg-gray-700 hover:text-gray-200 border-l-4 border-gray-900 hover:border-gray-700"
                }`}
              >
                <Icon className={`w-[18px] h-[18px]`} />
                <span className={`font-normal`}>{item?.title}</span>
                {/* {item?.count && item?.count > 0 && (
                  <span className="ml-auto inline-flex text-sm items-center justify-center rounded-full bg-blue-500 px-2 py-0.5 text-xs font-bold text-white">
                    {item?.count}
                  </span>
                )} */}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Separator */}
      <div className="px-4">
        <div className="h-px bg-gray-600"></div>
      </div>

      {/* Support & Settings */}
      {/* <div className="px-4 py-4">
        <nav className="space-y-1">
          {supportItems.map((item, index) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={index}
                to={item.url}
                className="group flex items-center gap-3 px-3 py-2 rounded-lg text-white hover:bg-gray-800/50 transition-all duration-200"
              >
                <Icon className="w-5 h-5 text-white" />
                <span className="font-medium">{item.title}</span>
              </NavLink>
            );
          })}
        </nav>
      </div> */}

      {/* Separator */}

      {/* User Profile */}
      <div className="p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 font-semibold text-gray-800 text-xl uppercase rounded-full flex items-center justify-center">
            U
          </div>
          <div className="flex-1 min-w-0 ">
            <p className="text-white font-semibold text-sm truncate">
              {currentOfficer?.id || ""}
            </p>
            {/* <p className="text-gray-400 text-xs truncate">
              {" "}
              {currentOfficer?.name || ""}
            </p> */}
          </div>
          <Button
            size={"xl"}
            variant="ghost"
            title="Logout"
            onClick={() => setShowConfirm(true)}
          >
            <LogOut />
          </Button>
        </div>
      </div>

      <Modal
        open={showConfirm}
        onOpenChange={(o) => {
          if (!o) setShowConfirm(false);
        }}
        title="Log out?"
        size="sm"
        description="You will be signed out of this session."
        footer={
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowConfirm(false);
                logout();
              }}
            >
              Log out
            </Button>
          </div>
        }
      />
    </div>
  );
};

export default Navbar;
