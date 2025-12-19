import { useState } from "react";
import { Switch, Table } from "antd";
import { toggleDarkMode, selectDarkMode } from "../../store/darkModeSlice";
import { useDispatch, useSelector } from "react-redux";

const VPNPreferences = () => {
    const dispatch = useDispatch();
    const darkMode = useSelector(selectDarkMode);

    const data = [
        {
            id: 1,
            key: "darkMode",
            preference: "Dark Mode",
            action: darkMode,
        },
    ];

    const columns = [
        {
            title: "Preference",
            dataIndex: "preference",
            key: "preference",
            render: (text) => <p>{text}</p>,
        },
        {
            title: "Actions",
            dataIndex: "actions",
            key: "actions",
            render: (_, record) => (
                <Switch
                    checked={darkMode}
                    onChange={(checked) => handleToggle(record.key, checked)}
                />
            ),
        },
    ];

    const handleToggle = (key, value) => {
        if (key === "darkMode") {
            dispatch(toggleDarkMode());
        }
    };

    return (
        <div
            className={`max-w-[465px] w-full pb-5 shadow-cards rounded-[26px] overflow-hidden ${darkMode ? "bg-[#222222] text-white" : "bg-white text-black"
                }`}
        >
            <Table
                columns={columns}
                dataSource={data}
                className={`w-full h-fit font-open-sans ${darkMode ? 'dark-table' : ''}`}
                pagination={false}
                rowClassName={darkMode ? "dark-table-row" : "light-table-row"}
                rowHoverable={false}
                rowKey="id"
                style={{
                    backgroundColor: darkMode ? '#1f1f1f' : 'white',
                    color: darkMode ? 'white' : 'black'
                }}
            />
        </div>
    );
};

export default VPNPreferences;
