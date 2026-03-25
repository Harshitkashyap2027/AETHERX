const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  className = '',
  type = 'button',
  fullWidth = false,
}) => {
  const base = `inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 cursor-pointer ripple ${fullWidth ? 'w-full' : ''}`;

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const variants = {
    primary: 'gradient-bg text-white hover:opacity-90 hover:-translate-y-0.5 shadow-lg shadow-primary/20',
    secondary: 'bg-white/8 border border-white/12 text-white hover:bg-white/12',
    outline: 'border border-primary text-primary hover:bg-primary/10',
    danger: 'bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30',
    ghost: 'text-white/70 hover:text-white hover:bg-white/8',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${sizes[size]} ${variants[variant]} ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading…
        </>
      ) : children}
    </button>
  );
};

export default Button;
