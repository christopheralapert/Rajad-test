import { Link, useLocation } from 'react-router-dom';
import { Mountain, Map, Filter, MessageSquare, Menu, X, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export function Navigation() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t, i18n } = useTranslation();

  // Toggle body class when mobile menu opens/closes to prevent map from capturing touches
  useEffect(() => {
    document.body.classList.toggle('menu-open', isMobileMenuOpen);
    return () => {
      document.body.classList.remove('menu-open');
    };
  }, [isMobileMenuOpen]);

  const navItems = [
    { path: '/', label: t('nav.home'), icon: Mountain },
    { path: '/map', label: t('nav.map'), icon: Map },
    { path: '/filter', label: t('nav.findTracks'), icon: Filter },
    { path: '/feedback', label: t('nav.feedback'), icon: MessageSquare },
  ];

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  const switchLanguage = () => {
    i18n.changeLanguage(i18n.language?.startsWith('en') ? 'et' : 'en');
  };

  const langLabel = i18n.language?.startsWith('en') ? t('lang.en') : t('lang.et');

  return (
    // NOTE: Leaflet (map) uses fairly high z-index values for its panes/controls.
    // Keep the navigation above everything so links remain clickable on mobile.
    <nav className="site-header bg-white border-b sticky top-0 z-[9999]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2" onClick={handleLinkClick}>
            <Mountain className="size-8 text-green-600" />
            <span className="font-semibold">{t('app.name')}</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <div className="flex gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      isActive ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="size-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center gap-2 pl-2 border-l">
              <a
                href="https://rmk-loodusegakoos-veebikaart.rmk.ee/#/"
                target="_blank"
                rel="noreferrer"
                className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50"
                title={t('nav.openRmkMap')}
              >
                <ExternalLink className="size-4" />
                <span className="text-sm">RMK</span>
              </a>

              <button
                onClick={switchLanguage}
                className="px-3 py-2 rounded-lg border text-sm hover:bg-gray-50"
                aria-label={t('lang.label')}
                title={t('lang.label')}
              >
                {langLabel}
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="size-6 text-gray-600" /> : <Menu className="size-6 text-gray-600" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/50 z-[9900] md:hidden" onClick={() => setIsMobileMenuOpen(false)} />

          {/* Menu Panel */}
          <div className="fixed top-16 right-0 w-72 h-[calc(100vh-4rem)] bg-white shadow-2xl z-[9999] md:hidden overflow-y-auto">
            <div className="p-4">
              <div className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={handleLinkClick}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="size-5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}

                <a
                  href="https://rmk-loodusegakoos-veebikaart.rmk.ee/#/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50"
                  onClick={handleLinkClick}
                >
                  <ExternalLink className="size-5" />
                  <span>{t('nav.openRmkMap')}</span>
                </a>

                <button
                  onClick={() => {
                    switchLanguage();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg border hover:bg-gray-50"
                >
                  <span>{t('lang.label')}</span>
                  <span className="text-sm text-gray-600">{langLabel}</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
