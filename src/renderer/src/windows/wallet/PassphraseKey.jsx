import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getAccount } from '../../store/accountSlice';
import { LuMoveLeft } from 'react-icons/lu';
import PrimaryButton from '../../components/PrimaryButton';
import { selectDarkMode } from '../../store/darkModeSlice';

const PassphraseKey = () => {
    const navigate = useNavigate();
    const [copied, setCopied] = useState(false);
    const [seedPhrase, setSeedPhrase] = useState([]);
    const account = useSelector(getAccount);
    const darkMode = useSelector(selectDarkMode);

    const fetchSeedPhrase = () => {
        setSeedPhrase(account.seedPhrase.split(' '));
    }
    const handleCopy = (walletAddress) => {
        navigator.clipboard.writeText(walletAddress);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const words = [
        { number: 1, word: "Play" },
        { number: 2, word: "Work" },
        { number: 3, word: "Office" },
        { number: 4, word: "Smart" },
        { number: 5, word: "Football" },
        { number: 6, word: "Bug" },
        { number: 7, word: "Gift" },
        { number: 8, word: "Shoes" },
        { number: 9, word: "Choice" },
        { number: 10, word: "Run" },
        { number: 11, word: "Walk" },
        { number: 12, word: "Sleep" },
        { number: 13, word: "Fan" },
        { number: 14, word: "Replicate" },
        { number: 15, word: "Oxygen" },
        { number: 16, word: "Smile" },
        { number: 17, word: "Watch" },
        { number: 18, word: "Table" },
        { number: 19, word: "Wall" },
        { number: 20, word: "Tennis" },
        { number: 21, word: "Bluetooth" },
        { number: 22, word: "Mobile" },
        { number: 23, word: "Cable" },
        { number: 24, word: "Monitor" },
        { number: 25, word: "Tease" }
    ];

    useEffect(() => {
        fetchSeedPhrase();
    }, [])

    return (
        <div className={`w-full min-h-screen flex justify-center bg-layout bg-cover items-center flex-grow p-10 ${darkMode ? 'bg-[#222222] text-white' : 'bg-primary text-black'}`}>

            <div className="w-fit absolute top-5 left-5">
                <LuMoveLeft className="text-3xl cursor-pointer" onClick={() => navigate(-1)} />
            </div>

            <div className={`w-full min-w-[475px] ${darkMode ? 'bg-[#292929] text-white' : 'bg-white text-black'} shadow-cards gap-2.5 px-10 py-[42px] rounded-3xl flex flex-col justify-center items-center max-w-[646px]`}>
                <p className='font-open-sans text-3xl font-semibold text-center'>Secret Passphrase ({seedPhrase?.length || 0} Words)</p>

                <div className="w-4/5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 p-2">
                    {seedPhrase?.map((item, index) => (
                        <div key={index} className="w-1/4 p-1">
                            <span className="font-bold text-sm">{index + 1}.</span> {item}
                        </div>
                    ))}
                </div>

                <div className='relative'>
                    <PrimaryButton
                        icon={(
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="17"
                                viewBox="0 0 16 17"
                                fill="none"
                            >
                                <g clipPath="url(#clip0_901_4668)">
                                    <path
                                        d="M8.66683 13.8333C9.55056 13.8323 10.3978 13.4808 11.0227 12.8559C11.6476 12.231 11.9991 11.3837 12.0002 10.5V4.66201C12.0012 4.31158 11.9327 3.96444 11.7985 3.64069C11.6644 3.31694 11.4674 3.02304 11.2188 2.77601L9.72416 1.28135C9.47713 1.03279 9.18323 0.835747 8.85948 0.701625C8.53574 0.567503 8.18859 0.498975 7.83816 0.500012H4.66683C3.7831 0.50107 2.93587 0.8526 2.31098 1.47749C1.68608 2.10238 1.33455 2.94961 1.3335 3.83334V10.5C1.33455 11.3837 1.68608 12.231 2.31098 12.8559C2.93587 13.4808 3.7831 13.8323 4.66683 13.8333H8.66683ZM2.66683 10.5V3.83334C2.66683 3.30291 2.87754 2.7942 3.25262 2.41913C3.62769 2.04406 4.1364 1.83334 4.66683 1.83334C4.66683 1.83334 7.94616 1.84268 8.00016 1.84934V3.16668C8.00016 3.5203 8.14064 3.85944 8.39069 4.10949C8.64074 4.35954 8.97987 4.50001 9.3335 4.50001H10.6508C10.6575 4.55401 10.6668 10.5 10.6668 10.5C10.6668 11.0304 10.4561 11.5392 10.081 11.9142C9.70597 12.2893 9.19726 12.5 8.66683 12.5H4.66683C4.1364 12.5 3.62769 12.2893 3.25262 11.9142C2.87754 11.5392 2.66683 11.0304 2.66683 10.5ZM14.6668 5.83334V13.1667C14.6658 14.0504 14.3142 14.8976 13.6893 15.5225C13.0645 16.1474 12.2172 16.499 11.3335 16.5H5.3335C5.15668 16.5 4.98712 16.4298 4.86209 16.3048C4.73707 16.1797 4.66683 16.0102 4.66683 15.8333C4.66683 15.6565 4.73707 15.487 4.86209 15.3619C4.98712 15.2369 5.15668 15.1667 5.3335 15.1667H11.3335C11.8639 15.1667 12.3726 14.956 12.7477 14.5809C13.1228 14.2058 13.3335 13.6971 13.3335 13.1667V5.83334C13.3335 5.65653 13.4037 5.48696 13.5288 5.36194C13.6538 5.23692 13.8234 5.16668 14.0002 5.16668C14.177 5.16668 14.3465 5.23692 14.4716 5.36194C14.5966 5.48696 14.6668 5.65653 14.6668 5.83334Z"
                                        fill="white"
                                    />
                                </g>
                                <defs>
                                    <clipPath id="clip0_901_4668">
                                        <rect width="16" height="16" fill="white" transform="translate(0 0.5)" />
                                    </clipPath>
                                </defs>
                            </svg>
                        )}
                        onClick={() => handleCopy(account.seedPhrase)}
                        text={'Copy To Clipboard'}
                    />

                    <div className={`absolute z-50 top-0 right-0 mt-[-30px] transition-all duration-500 ${copied ? 'opacity-100' : 'opacity-0 translate-y-2'} bg-white drop-shadow-md text-black text-xs px-2 py-1 rounded`}>
                        Copied!
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PassphraseKey;
