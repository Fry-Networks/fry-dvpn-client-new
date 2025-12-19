import React from 'react'

const ConnectBtn = () => {
    return (
        <div className='absolute top-1/2 -translate-x-1/2 -translate-y-1/2 left-1/2'>
            <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120" fill="none">
                <g opacity="0.6" filter="url(#filter0_dd_747_10805)">
                    <circle cx="61.5" cy="61.5" r="47.5" fill="url(#paint0_radial_747_10805)" />
                </g>
                <defs>
                    <filter id="filter0_dd_747_10805" x="0.178443" y="0.178443" width="119.243" height="119.243" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                        <feFlood floodOpacity="0" result="BackgroundImageFix" />
                        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                        <feOffset dx="-2.72156" dy="-2.72156" />
                        <feGaussianBlur stdDeviation="5.55" />
                        <feComposite in2="hardAlpha" operator="out" />
                        <feColorMatrix type="matrix" values="0 0 0 0 0.513726 0 0 0 0 0.00392157 0 0 0 0 0.00784314 0 0 0 0.45 0" />
                        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_747_10805" />
                        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                        <feOffset dx="2.72156" dy="2.72156" />
                        <feGaussianBlur stdDeviation="3.85" />
                        <feComposite in2="hardAlpha" operator="out" />
                        <feColorMatrix type="matrix" values="0 0 0 0 0.513726 0 0 0 0 0.00392157 0 0 0 0 0.00784314 0 0 0 0.54 0" />
                        <feBlend mode="normal" in2="effect1_dropShadow_747_10805" result="effect2_dropShadow_747_10805" />
                        <feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow_747_10805" result="shape" />
                    </filter>
                    
                    <radialGradient id="paint0_radial_747_10805" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(62 64.5) rotate(90.6437) scale(44.5028)">
                        <stop offset="0.065" stopColor="#F74646" />
                        <stop offset="0.585" stopColor="#FF0000" />
                        <stop offset="1" stopColor="#F50606" />
                    </radialGradient>
                </defs>
            </svg>
        </div>
    )
}

export default ConnectBtn