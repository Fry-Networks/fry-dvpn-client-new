import React from "react";
import { america } from "../../assets";
import PrimaryButton from "../../components/PrimaryButton";
import { useNavigate } from "react-router-dom";
import { selectDarkMode } from "../../store/darkModeSlice";
import { useSelector } from "react-redux";

const AllServices = () => {
    const navigate = useNavigate();
    const darkMode = useSelector(selectDarkMode);

    const nodesData = [
        {
            location: "USA - New York",
            image: america,
            details: [
                { heading: "Node IP Address:", value: "192.168.1.1." },
                { heading: "Connection Type:", value: "WireGuard." },
                { heading: "Supported Protocols:", value: "OpenVPN, IKEv2." },
                { heading: "Server Status:", value: "Online" },
                { heading: "Available Bandwidth:", value: "500 GB." },
                { heading: "Latency (Last 24 Hours):", value: "110 ms (average)." },
            ],
        },
        {
            location: "USA - California",
            image: america,
            details: [
                { heading: "Node IP Address:", value: "192.168.2.1." },
                { heading: "Connection Type:", value: "WireGuard." },
                { heading: "Supported Protocols:", value: "OpenVPN, IKEv2." },
                { heading: "Server Status:", value: "Online" },
                { heading: "Available Bandwidth:", value: "1 TB." },
                { heading: "Latency (Last 24 Hours):", value: "120 ms (average)." },
            ],
        },
        {
            location: "USA - California",
            image: america,
            details: [
                { heading: "Node IP Address:", value: "192.168.2.1." },
                { heading: "Connection Type:", value: "WireGuard." },
                { heading: "Supported Protocols:", value: "OpenVPN, IKEv2." },
                { heading: "Server Status:", value: "Online" },
                { heading: "Available Bandwidth:", value: "1 TB." },
                { heading: "Latency (Last 24 Hours):", value: "120 ms (average)." },
            ],
        },
        {
            location: "USA - New York",
            image: america,
            details: [
                { heading: "Node IP Address:", value: "192.168.1.1." },
                { heading: "Connection Type:", value: "WireGuard." },
                { heading: "Supported Protocols:", value: "OpenVPN, IKEv2." },
                { heading: "Server Status:", value: "Online" },
                { heading: "Available Bandwidth:", value: "500 GB." },
                { heading: "Latency (Last 24 Hours):", value: "110 ms (average)." },
            ],
        },
        {
            location: "USA - California",
            image: america,
            details: [
                { heading: "Node IP Address:", value: "192.168.2.1." },
                { heading: "Connection Type:", value: "WireGuard." },
                { heading: "Supported Protocols:", value: "OpenVPN, IKEv2." },
                { heading: "Server Status:", value: "Online" },
                { heading: "Available Bandwidth:", value: "1 TB." },
                { heading: "Latency (Last 24 Hours):", value: "120 ms (average)." },
            ],
        },
        {
            location: "USA - California",
            image: america,
            details: [
                { heading: "Node IP Address:", value: "192.168.2.1." },
                { heading: "Connection Type:", value: "WireGuard." },
                { heading: "Supported Protocols:", value: "OpenVPN, IKEv2." },
                { heading: "Server Status:", value: "Online" },
                { heading: "Available Bandwidth:", value: "1 TB." },
                { heading: "Latency (Last 24 Hours):", value: "120 ms (average)." },
            ],
        },
    ];

    return (
        <div className={`w-full ${darkMode ? " text-white" : "text-black"}`}>
            <h1 className="font-open-sans text-[28px] font-semibold">Available Nodes</h1>
            <div className="flex items-center">
                <div className="grid 2xl:grid-cols-3 grid-cols-2 gap-6 py-10">
                    {nodesData.map((node, index) => (
                        <div key={index} className={`max-w-[396px] w-full py-5 px-2 rounded-3xl ${darkMode ? "bg-[#292929] text-white" : "bg-white text-black"} shadow-cards`}>
                            <div className="w-full flex justify-center items-center gap-3 pb-3">
                                <img src={node.image} alt="Node" className="w-[54px]" />
                                <h2 className="font-open-sans text-sm text-gray-500">Node {index + 1}</h2>
                            </div>

                            <div className="w-full flex flex-col justify-center items-center gap-2.5">
                                {node.details.map((detail, detailIndex) => (
                                    <div
                                        key={detailIndex}
                                        className="w-full flex items-center justify-between gap-4 pl-5 border-b border-b-secondary border-opacity-20 py-1"
                                    >
                                        <p className="font-open-sans text-sm">{detail.heading}</p>
                                        <h4 className="w-[140px]  font-open-sans text-sm font-semibold">{detail.value}</h4>
                                    </div>
                                ))}
                                <div className="w-full px-3">
                                    <PrimaryButton text={"Connect"} onClick={() => navigate("/dashboard")} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AllServices;
