import React, { useState } from "react";
import VPNPreferences from "../../components/settings/VPNPreferences";
import { useSelector } from "react-redux";
import { selectDarkMode } from "../../store/darkModeSlice";
// import Notifications from "../../components/settings/Notifications";
// import Privacy from "../../components/settings/Privacy";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("VPN Preferences");
  const tabs = ["VPN Preferences"];
  const darkMode = useSelector(selectDarkMode);

  return (
    <div className="w-full min-h-screen">
      {/* Tabs */}
      <div className={`flex w-fit items-center ${darkMode ? "bg-[#292929] text-white" : "bg-white text-black"
        } space-x-6 shadow-cards rounded-lg overflow-hidden`}>
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`px-4 rounded-lg text-center border transition-all ${activeTab === tab
              ? "text-secondary border-secondary"
              : `${darkMode ? "text-white" : "text-black"} border-transparent`
              } duration-200 font-open-sans font-semibold py-3 px-9`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content Section */}
      <div className="mt-5">
        {activeTab === "VPN Preferences" && <VPNPreferences />}
        {/* {activeTab === "Notifications" && <Notifications />} */}
        {/* {activeTab === "Privacy" && <Privacy />} */}
      </div>
    </div>
  );
};

export default Settings;
