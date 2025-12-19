import React from "react";
import { Checkbox, Table, Tag } from 'antd'
import { bbc_iPlayer, disney, hulu, netflix, walletIco } from '../../assets'
import { useSelector } from "react-redux";
import { selectDarkMode } from "../../store/darkModeSlice";

const Streaming = () => {
    const darkMode = useSelector(selectDarkMode);

    const data = [
        {
            key: 1,
            icon: netflix,
            title: "Netflix",
            description: "Stream Netflix content from different regions.",
            location: "USA - Netflix Opt., Japan - Netflix Opt.",
            is_check: true,
        },
        {
            key: 2,
            icon: disney,
            title: "Disney+",
            description: "Global access to Disney+ streaming",
            location: "USA - Disney+ Opt., UK - Disney+ Opt.",
            is_check: true,
        },
        {
            key: 3,
            icon: hulu,
            title: "Hulu",
            description: "Stream Hulu securely with optimized servers.",
            location: "USA - Hulu Opt.",
            is_check: true,
        },
        {
            key: 1,
            icon: bbc_iPlayer,
            title: "BBC iPlayer",
            description: "Access BBC iPlayer content from the UK.",
            location: "UK - BBC iPlayer Opt.",
            is_check: true,
        },
    ];

    const handleCheck = (e) => {
        console.log(e.target.checked)
    }

    const columns = [
        {
            title: "Platform",
            dataIndex: "platform",
            render: (_, record) => (
                <div className="flex items-center gap-6">
                    <img src={record.icon} alt={record.title} className="h-6" />
                    <span className="text-xs font-semibold font-open-sans">{record.title}</span>
                </div>
            ),
        },
        {
            title: "Description",
            dataIndex: "description",
            key: "description",
            render: (text) => <p>{text}</p>,
        },
        {
            title: "Actions",
            dataIndex: "is_check",
            key: "is_check",
            render: (is_check) => (
                <Checkbox onChange={handleCheck} />
            ),
        }
    ];

    return (
        <div className="max-w-[1154px] w-full">
            <h1 className={`font-open-sans text-[28px] font-semibold ${darkMode ? 'text-white' : 'text-black'}`}>Available Nodes</h1>

            <div className="py-3">
                <div className={`w-full pb-5 shadow-cards rounded-[26px] overflow-hidden ${darkMode ? "bg-[#292929] text-white" : "bg-white text-black"
                    }`}>
                    <Table
                        columns={columns}
                        dataSource={data}
                        className="w-full h-fit"
                        pagination={false}
                        rowClassName={darkMode ? " !text-white" : " text-black"}
                        rowHoverable={false}
                    />
                    {data.length < 1 && (
                        <div className='w-full p-10 bg-white flex items-center justify-center flex-col gap-3'>
                            <img src={walletIco} alt="wallet" />

                            <h4 className='font-open-sans font-semibold text-[#5C5959]'>No transactions in your history yet</h4>
                            <p className='w-[386px] text-center font-open-sans text-xs text-[#7C7C7C]'>
                                There is no activity to report at this time. We will update you if there are any developments.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div >

    );
};

export default Streaming;
