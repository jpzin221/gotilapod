import { createContext, useContext, useState, useEffect } from 'react';
import { siteConfigService } from '../lib/supabase';

const SiteConfigContext = createContext(null);

export function SiteConfigProvider({ children }) {
    const [config, setConfig] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            const data = await siteConfigService.getAll();
            setConfig(data);

            // Aplicar CSS variables
            applyTheme(data);

            // Atualizar meta tags
            updateMetaTags(data);

        } catch (error) {
            console.error('Erro ao carregar configurações:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyTheme = (data) => {
        const root = document.documentElement;

        if (data.primary_color) {
            root.style.setProperty('--color-primary', data.primary_color);
            // Converter hex para RGB para usar em transparências
            const rgb = hexToRgb(data.primary_color);
            if (rgb) {
                root.style.setProperty('--color-primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
            }
        }

        if (data.secondary_color) {
            root.style.setProperty('--color-secondary', data.secondary_color);
        }

        if (data.accent_color) {
            root.style.setProperty('--color-accent', data.accent_color);
        }

        if (data.text_color) {
            root.style.setProperty('--color-text', data.text_color);
        }

        if (data.background_color) {
            root.style.setProperty('--color-background', data.background_color);
        }

        if (data.font_family) {
            // Carregar fonte do Google Fonts
            const link = document.createElement('link');
            link.href = `https://fonts.googleapis.com/css2?family=${data.font_family.replace(' ', '+')}:wght@400;500;600;700&display=swap`;
            link.rel = 'stylesheet';
            document.head.appendChild(link);
            root.style.setProperty('--font-family', `"${data.font_family}", sans-serif`);
        }

        if (data.border_radius) {
            root.style.setProperty('--border-radius', `${data.border_radius}px`);
        }
    };

    const updateMetaTags = (data) => {
        // Título
        if (data.meta_title) {
            document.title = data.meta_title;
        }

        // Meta description
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.name = 'description';
            document.head.appendChild(metaDesc);
        }
        if (data.meta_description) {
            metaDesc.content = data.meta_description;
        }

        // Keywords
        let metaKeywords = document.querySelector('meta[name="keywords"]');
        if (!metaKeywords) {
            metaKeywords = document.createElement('meta');
            metaKeywords.name = 'keywords';
            document.head.appendChild(metaKeywords);
        }
        if (data.meta_keywords) {
            metaKeywords.content = data.meta_keywords;
        }

        // Favicon
        if (data.favicon_url) {
            let favicon = document.querySelector('link[rel="icon"]');
            if (!favicon) {
                favicon = document.createElement('link');
                favicon.rel = 'icon';
                document.head.appendChild(favicon);
            }
            favicon.href = data.favicon_url;
        }

        // Open Graph
        if (data.og_image_url) {
            let ogImage = document.querySelector('meta[property="og:image"]');
            if (!ogImage) {
                ogImage = document.createElement('meta');
                ogImage.setAttribute('property', 'og:image');
                document.head.appendChild(ogImage);
            }
            ogImage.content = data.og_image_url;
        }
    };

    const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    };

    const refreshConfig = async () => {
        await loadConfig();
    };

    const get = (key, defaultValue = '') => {
        return config[key] || defaultValue;
    };

    return (
        <SiteConfigContext.Provider value={{
            config,
            loading,
            refreshConfig,
            get,
            isMaintenanceMode: config.maintenance_mode === 'true'
        }}>
            {children}
        </SiteConfigContext.Provider>
    );
}

export function useSiteConfig() {
    const context = useContext(SiteConfigContext);
    if (!context) {
        console.warn('useSiteConfig must be used within SiteConfigProvider');
        return { config: {}, loading: true, get: () => '' };
    }
    return context;
}
