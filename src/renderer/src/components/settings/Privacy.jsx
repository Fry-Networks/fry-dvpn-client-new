import React, { useState } from "react";
import { Switch, Table } from "antd";
import { useSelector } from "react-redux";
import { selectDarkMode } from "../../store/darkModeSlice";

const Privacy = () => {
    const darkMode = useSelector(selectDarkMode);
    const [preferences, setPreferences] = useState({
        autoConnect: false,
        darkMode: false,
    });

    const data = [
        {
            key: 1,
            subtitle: "Kill Switch",
            desc: "(Block internet if VPN disconnects)",
            action: preferences.autoConnect,
        },
        {
            key: 2,
            subtitle: "Data Collection",
            desc: "(Allow usage data collection)",
            action: preferences.darkMode,
        },
    ];

    const columns = [
        {
            title: "Option",
            dataIndex: "option",
            key: "option",
            render: (_, record) => <p className="inline-flex gap-1 font-open-sans"><div className="font-bold">{record.subtitle}</div> {record.desc}</p>,
        },
        {
            title: "Action",
            dataIndex: "action",
            key: "action",
            render: (_, record) => (
                <Switch
                    checked={preferences[record.key]}
                    onChange={(checked) => handleToggle(record.key, checked)}
                />
            ),
        },
    ];

    const handleToggle = (key, value) => {
        setPreferences((prevState) => ({
            ...prevState,
            [key]: value,
        }));
    };

    return (
        <div
            className={`max-w-[465px] w-full pb-5 shadow-cards rounded-[26px] overflow-hidden ${darkMode ? "bg-[#292929] text-white" : "bg-white text-black"
                }`}
        >
            <Table
                columns={columns}
                dataSource={data}
                className={`w-full h-fit font-open-sans ${darkMode ? " !text-white" : " text-black"
                    }`}
                pagination={false}
                rowClassName={darkMode ? " !text-white" : " text-black"}
                rowHoverable={false}
            />
        </div>
    );
};

export default Privacy;
