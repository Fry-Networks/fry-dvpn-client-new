import { useEffect, useState } from 'react'
import { Table, Tag } from 'antd'
import Select from 'react-select';
import { sessions } from '../../assets';
import { selectDarkMode } from '../../store/darkModeSlice';
import { useSelector } from 'react-redux';
import { getAccount } from '../../store/accountSlice';
import { getFryTransactionHistory } from '../../utils/sendFryTokens';

const FryTransactions = () => {
  const [fryTransactions, setFryTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const darkMode = useSelector(selectDarkMode);
  const account = useSelector(getAccount);

  const options = [
    { value: 'Daily', label: 'Daily' },
    { value: 'Weekly', label: 'Weekly' },
    { value: 'Monthly', label: 'Monthly' },
  ];

  const customStyles = {
    control: (provided) => ({
      ...provided,
      background: 'linear-gradient(to bottom, #FF0000, #F66C6C)',
      color: 'white',
      borderRadius: '9999px',
      padding: '4px 12px',
      boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
      border: 'none',
      cursor: 'pointer',
    }),
    singleValue: (provided) => ({
      ...provided,
      color: 'white',
      fontSize: '0.875rem',
      fontWeight: '500',
    }),
    indicatorSeparator: () => ({ display: 'none' }),
    dropdownIndicator: (provided) => ({
      ...provided,
      color: 'white',
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: darkMode ? "#1e1e20" : "white",
      borderRadius: '10px',
      overflow: 'hidden',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#F66C6C' : darkMode ? "#1e1e20" : "white",
      color: state.isSelected ? 'white' : darkMode ? 'white' : '#333',
      '&:hover': {
        backgroundColor: '#FF0000',
        color: 'white',
      },
    }),
  };

  // Table columns
  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (text) => <p className={darkMode ? 'text-white' : 'text-black'}>{text}</p>,
    },
    {
      title: "Transaction ID",
      dataIndex: "txn_id",
      key: "txn_id",
      render: (text, record) => (
        <div>
          <p className={`text-xs ${darkMode ? 'text-white' : 'text-black'}`}>{text}</p>
          {record.explorerUrl && (
            <a 
              href={record.explorerUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-700 text-xs underline"
            >
              View on Explorer
            </a>
          )}
          {record.isFallbackId && (
            <span className="text-orange-500 text-xs">(Fallback ID)</span>
          )}
        </div>
      ),
    },
    {
      title: "Description",
      dataIndex: "desc",
      key: "desc",
      render: (text) => <p className={darkMode ? 'text-white' : 'text-black'}>{text}</p>,
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (text) => <p className={darkMode ? 'text-white' : 'text-black'}>{text}</p>,
    },
    {
      title: "Payment Method",
      dataIndex: "payment_method",
      key: "payment_method",
      render: (text) => <p className={darkMode ? 'text-white' : 'text-black'}>{text}</p>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (text) => (
        <Tag color={text === 'Completed' ? 'green' : 'orange'}>
          {text}
        </Tag>
      ),
    },
  ];

  // Load FRY transactions
  const loadFryTransactions = async () => {
    console.log('🔄 loadFryTransactions called');
    console.log('👤 Account:', account);
    console.log('📍 Wallet Address:', account?.walletAddress);
    
    if (!account?.walletAddress) {
      console.log('❌ No wallet address available');
      return;
    }

    setLoading(true);
    try {
      console.log('📞 Calling getFryTransactionHistory with:', account.walletAddress);
      const result = await getFryTransactionHistory(account.walletAddress);
      console.log('📞 getFryTransactionHistory result:', result);
      
      if (result.success) {
        console.log('✅ Successfully loaded transactions:', result.transactions);
        setFryTransactions(result.transactions || []);
      } else {
        console.error('❌ Failed to load FRY transactions:', result.message);
        setFryTransactions([]);
      }
    } catch (error) {
      console.error('❌ Error loading FRY transactions:', error);
      setFryTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  // Load FRY transactions on component mount
  useEffect(() => {
    console.log('🔄 useEffect triggered');
    console.log('👤 Account in useEffect:', account);
    console.log('📍 Wallet Address in useEffect:', account?.walletAddress);
    console.log('🗄️ Database API available:', !!window.dbAPI);
    console.log('📊 Database API methods:', window.dbAPI ? Object.keys(window.dbAPI) : 'Not available');
    
    if (account?.walletAddress) {
      loadFryTransactions();
    } else {
      console.log('⚠️ No wallet address available, skipping loadFryTransactions');
    }
  }, [account?.walletAddress]);

  // Transform data for table
  const fryTransactionData = fryTransactions.map((tx, index) => ({
    key: index,
    date: new Date(tx.timestamp).toLocaleDateString(),
    txn_id: tx.transactionId || 'N/A',
    desc: tx.type === 'periodic_fee' ? 'Periodic FRY Fee' : 
          tx.type === 'plan_upgrade' ? 'Plan Upgrade Payment' : 
          tx.type === 'plan_purchase' ? 'Plan Purchase Payment' : 'FRY Transaction',
    amount: `${tx.amount} FRY`,
    payment_method: "Algorand Wallet",
    status: tx.status === 'completed' ? 'Completed' : 'Pending',
    isFallbackId: tx.isFallbackId || false,
    explorerUrl: tx.isFallbackId ? null : `https://explorer.perawallet.app/tx/${tx.transactionId}`
  }));

  return (
    <div className='w-full'>
      <div className='w-full py-5 mb-10'>
        <div className={`max-w-[1154px] w-full ${darkMode ? "bg-[#292929] text-white" : "bg-white text-black"} shadow-cards p-7 rounded-3xl flex flex-col gap-5`}>
          {fryTransactionData.length < 1 ? (
            <div className='w-full  flex items-center  justify-end gap-4'>
              <Select
                options={options}
                defaultValue={options[2]}
                styles={customStyles}
              />
              
              {/* Refresh FRY Transactions Button */}
              <button
                onClick={loadFryTransactions}
                disabled={loading}
                className={`px-4 py-2 rounded-full font-open-sans text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 transition-all duration-200 shadow-lg flex items-center gap-2`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                  </>
                ) : (
                  <>
                    🔄 Refresh FRY
                  </>
                )}
              </button>
            </div>
          ) : null}

          {loading ? (
            <div className={`w-full p-10 ${darkMode ? 'bg-gray-800' : 'bg-white'} flex items-center justify-center flex-col gap-3`}>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className={`font-open-sans text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading FRY transactions...</p>
            </div>
          ) : fryTransactionData.length > 0 ? (
            <Table
              columns={columns}
              dataSource={fryTransactionData}
              className={`w-full h-fit font-open-sans ${darkMode ? 'dark-table' : ''}`}
              pagination={false}
              rowClassName={darkMode ? "dark-table-row" : "light-table-row"}
              rowHoverable={false}
              style={{
                backgroundColor: darkMode ? '#1f1f1f' : 'white',
                color: darkMode ? 'white' : 'black'
              }}
            />
          ) : (
            <div className={`w-full p-10 ${darkMode ? 'bg-gray-800' : 'bg-white'} flex items-center justify-center flex-col gap-3`}>
              <img src={sessions} alt="sessions" />

              <h4 className={`font-open-sans font-semibold ${darkMode ? 'text-gray-300' : 'text-[#5C5959]'}`}>No FRY transactions in your history yet</h4>
              <p className={`w-[386px] text-center font-open-sans text-xs ${darkMode ? 'text-gray-400' : 'text-[#7C5959]'}`}>
                There is no activity to report at this time. We will update you if there are any developments.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FryTransactions
