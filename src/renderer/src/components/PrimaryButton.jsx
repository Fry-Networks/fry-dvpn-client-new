import PropTypes from 'prop-types'

const PrimaryButton = ({ text, icon, type, className, onClick, disabled = false }) => {
    const baseClasses = "mt-4 p-2 w-full py-2.5 px-12 text-[14px] flex items-center justify-center gap-3 font-semibold font-open-sans text-white rounded-[10px] bg-gradient-to-b from-[#F00] to-[#F66C6C]";
    const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:from-[#E00] hover:to-[#E55A5A] transition-all duration-200";
    
    return (
        <button
            type={type ? type : 'button'}
            onClick={disabled ? null : onClick}
            disabled={disabled}
            className={`${baseClasses} ${disabledClasses} ${className || ''}`}
        >
            {icon ? icon : null}
            {text}
        </button>
    )
}

PrimaryButton.propTypes = {
    text: PropTypes.string.isRequired,
    icon: PropTypes.node,
    type: PropTypes.string,
    className: PropTypes.string,
    onClick: PropTypes.func,
    disabled: PropTypes.bool
}

export default PrimaryButton