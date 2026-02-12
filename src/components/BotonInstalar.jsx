// components/BotonInstalar.jsx
import { useState, useEffect } from 'react';
import './BotonInstalar.css';

const BotonInstalar = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detectar iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIOSDevice);

    // Detectar si ya está instalada
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone === true) {
      setIsStandalone(true);
      return;
    }

    // Evento de instalación para Chrome/Edge/Android
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    });

    window.addEventListener('appinstalled', () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
      setIsStandalone(true);
    });
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstallable(false);
      setDeferredPrompt(null);
    }
  };

  // Si ya está instalada, no mostrar nada
  if (isStandalone) return null;

  // Para iOS - instrucciones especiales
  if (isIOS && !window.navigator.standalone) {
    return (
      <div className="instalar-banner ios">
        <div className="instalar-contenido">
          <img src="/logo.png" alt="Arelys Salon" className="instalar-logo" />
          <div className="instalar-texto">
            <strong>Instala Arelys Salon</strong>
            <p>Toca <span className="ios-icon">⎙</span> y luego "Agregar a pantalla de inicio"</p>
          </div>
          <button onClick={() => setIsInstallable(false)} className="instalar-cerrar">×</button>
        </div>
      </div>
    );
  }

  // Para Android/Windows - botón de instalación
  if (isInstallable) {
    return (
      <button onClick={handleInstall} className="instalar-boton">
        <img src="/logo.png" alt="" className="instalar-boton-logo" />
        <span>Instalar App</span>
      </button>
    );
  }

  return null;
};

export default BotonInstalar;