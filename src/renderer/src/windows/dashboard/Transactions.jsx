import React from 'react'
import { Table, Tag } from 'antd'
import { walletIco } from '../../assets'
import { selectDarkMode } from '../../store/darkModeSlice';
import { useSelector } from 'react-redux';

const Transactions = ({ className }) => {
  const darkMode = useSelector(selectDarkMode);

  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (text) => <p>{text}</p>,
    },
    {
      title: "Transaction ID",
      dataIndex: "transaction_id",
      key: "transaction_id",
      render: (text) => <p>{text}</p>,
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (text) => <p>{text}</p>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag className={`rounded-full px-2 py-1 font-semibold font-open-sans ${status === "Completed" ? `text-[#23d64a] border-[#027a2a] ${darkMode ? 'bg-[#027a2a]/20' : 'bg-[#027A48]/10'}` : 'text-secondary border-secondary/30 bg-secondary/10'}`}>
          {status}
        </Tag>
      ),
    }
  ];

  const data = [
    {
      key: 1,
      date: "01/05/2025",
      transaction_id: "Tx7891234",
      amount: "$50.00",
      status: "Completed",
    },
    {
      key: 2,
      date: "01/05/2025",
      transaction_id: "Tx7891234",
      amount: "$50.00",
      status: "Pending",
    },
    {
      key: 3,
      date: "01/05/2025",
      transaction_id: "Tx7891234",
      amount: "$50.00",
      status: "Completed",
    },
  ];

  return (
    <div className={`mb-10 ${className} ${darkMode ? 'bg-[#292929] text-white' : 'bg-white text-black'} w-full rounded-2xl overflow-hidden`}>
      <div className='p-5'>
        <Table
          columns={columns}
          dataSource={data}
          className="w-full h-fit"
          rowClassName={darkMode ? " !text-white" : " text-black"}
          rowHoverable={false}
          pagination={false}
        />
        {data.length < 1 && (
          <div className={`w-full p-10 ${darkMode ? 'bg-[#292929] text-white' : 'bg-white text-black'} flex items-center justify-center flex-col gap-3`}>
            <img src={walletIco} alt="wallet" />

            <h4 className='font-open-sans font-semibold text-[#5C5959]'>No transactions in your history yet</h4>
            <p className='w-[386px] text-center font-open-sans text-xs text-[#7C7C7C]'>
              There is no activity to report at this time. We will update you if there are any developments.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Transactions
