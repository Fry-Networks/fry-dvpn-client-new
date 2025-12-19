import BandwidthUsage from "../../components/BandwidthUsage";
import { selectDarkMode } from "../../store/darkModeSlice";
import { useSelector } from "react-redux";

const Analytics = () => {
    const darkMode = useSelector(selectDarkMode);

    return (
        <div className="w-full">
            <h1 className={`font-open-sans text-[28px] font-semibold ${darkMode ? 'text-white' : 'text-black'}`}>Analytics</h1>

            <div className="py-3 space-y-4">
                {/*
                <div className={`max-w-[1154px] w-full ${darkMode ? "bg-[#292929] text-white" : "bg-white text-black"} shadow-cards p-7 rounded-3xl flex flex-col gap-5`}>
                    <h3 className="font-futosans-bold text-xl">Key Metrics Overview</h3>
                    <div className="w-full pb-6">
                        ...table code...
                    </div>
                </div>
                */}

                <div className={`max-w-[1154px] w-full ${darkMode ? "bg-[#292929] text-white" : "bg-white text-black"} shadow-cards p-7 rounded-3xl flex flex-col gap-5`}>
                    <BandwidthUsage />
                </div>
            </div>
        </div>

    );
};

export default Analytics;
