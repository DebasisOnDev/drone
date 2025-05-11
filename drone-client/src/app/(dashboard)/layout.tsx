import React from "react";
import Link from "next/link";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col w-full min-h-screen bg-gray-100">
      <nav className="bg-white  shadow-md sticky top-0 z-[501]">
        <div className="  px-4">
          <div className="flex items-center justify-center h-16">
            <div className="flex space-x-6 md:space-x-10">
              <Link
                href="/fleets" // Assuming 'fleets' is at the root of the dashboard section
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out"
              >
                Fleet
              </Link>
              <Link
                href="/mission?droneId=1" // Assuming 'mission' is at the root
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out"
              >
                Missions
              </Link>
              <Link
                href="/reports" // Assuming 'report' is at the root
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out"
              >
                Report
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main className="">{children}</main>
    </div>
  );
};

export default Layout;
