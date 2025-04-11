import React, { useState, useEffect } from "react";

const randomEmails = [
  "j****.d**@gmail.com",
  "j****.s****@yahoo.com",
  "a****.w*****@outlook.com",
  "s****.l**@hotmail.com",
  "m******.b****@aol.com",
  "e****.j****@icloud.com",
  "d****.m*****@protonmail.com",
  "l****.a****@inbox.com",
  "c****.e****@mail.com",
  "a****.w****@zoho.com",
];

// Function to generate random USD amount between 50 and 1000
const generateRandomAmount = () => {
  const amount = (Math.random() * (1000 - 50) + 50).toFixed(2);
  return `$${amount}`;
};

export const RandomUserDisplay = () => {
  const [currentUser, setCurrentUser] = useState({
    email: randomEmails[0],
    amount: generateRandomAmount(),
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * randomEmails.length);
      setCurrentUser({
        email: randomEmails[randomIndex],
        amount: generateRandomAmount(),
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#1E1E1E] p-2 text-sm animate-fade-in">
      <div className="flex justify-between items-center px-4">
        <div className="text-[#F2C94C]">{currentUser.email}</div>
        <div className="text-gray-400">{currentUser.amount}Usd</div>
      </div>
    </div>
  );
};
