import React from "react";

type HeaderProps = {
  LeftSideHeader?: React.ReactNode;
  RightSideHeader?: React.ReactNode;
};

const Header: React.FC<HeaderProps> = ({ LeftSideHeader, RightSideHeader }) => {
  return (
    <header className="bg-[hsl(var(--background))] top-0 z-[2] sticky">
      <div className="w-full px-4 py-3 sm:px-6 flex justify-between items-center text-[hsl(var(--foreground))]">
        {LeftSideHeader}

        {RightSideHeader}
      </div>
    </header>
  );
};

export default Header;
