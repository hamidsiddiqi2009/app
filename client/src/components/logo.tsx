
import React from "react";
import logo from "./logo.jpg";

interface LogoProps {
  size?: "small" | "medium" | "large";
}

const Logo: React.FC<LogoProps> = ({ size = "medium" }) => {
  // Size mappings
  const sizes = {
    small: {
      container: "p-2",
      image: "w-8 h-10",
      text: "text-sm",
    },
    medium: {
      container: "p-3",
      image: "w-10 h-10",
      text: "text-xl",
    },
    large: {
      container: "p-4",
      image: "w-12 h-12",
      text: "text-2xl",
    },
  };

  return (
    <div className="flex items-center space-x-2">
      <img 
        src={logo} 
        alt="TiBank Logo" 
        className={`${sizes[size].image} object-contain`}
      />
      <span className={`text-white font-medium ${sizes[size].text}`}>TiBank</span>
    </div>
  );
};

export default Logo;
