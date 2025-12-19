import React, { useState } from "react";
import { Switch, Table } from "antd";
import { useSelector } from "react-redux";
import { selectDarkMode } from "../../store/darkModeSlice";

const Notifications = () => {
    const darkMode = useSelector(selectDarkMode);
    const [preferences, setPreferences] = useState({
        autoConnect: false,
        darkMode: false,
    });

    const data = [
        {
            id: 1,
            key: "connection_alerts",
            type: "Connection Alerts",
            action: preferences.autoConnect,
        },
        {
            id: 2,
            key: "subscription_reminders",
            type: "Subscription Reminders",
            action: preferences.darkMode,
        },
    ];

    const columns = [
        {
            title: "Type",
            dataIndex: "type",
            key: "type",
            render: (text) => <p>{text}</p>,
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
                rowKey="id"
            />
        </div>
    );
};

export default Notifications;
