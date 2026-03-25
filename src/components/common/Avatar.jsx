const Avatar = ({ src, alt = 'User', size = 40, className = '', ring = false }) => {
  const style = {
    width: size,
    height: size,
    minWidth: size,
    minHeight: size,
    borderRadius: '50%',
    objectFit: 'cover',
  };

  const Img = () =>
    src ? (
      <img src={src} alt={alt} style={style} className={`bg-gray-800 ${className}`} />
    ) : (
      <div
        style={{ ...style, fontSize: size * 0.4 }}
        className={`bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold ${className}`}
      >
        {alt?.charAt(0)?.toUpperCase() || '?'}
      </div>
    );

  if (ring) {
    return (
      <div className="story-ring" style={{ padding: 2, borderRadius: '50%', display: 'inline-block' }}>
        <div style={{ padding: 2, background: '#0A0A0F', borderRadius: '50%', display: 'inline-block' }}>
          <Img />
        </div>
      </div>
    );
  }

  return <Img />;
};

export default Avatar;
